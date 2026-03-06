<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import '@/../scss/main.scss';
import ElInfoButton from '@/Components/ElInfoButton.vue';
import ElBookCollapse from '@/Components/ElBookCollapse.vue';
import ElInfoLoading from '@/Components/ElInfoLoading.vue';
import { ElDialog, ElDrawer, ElInputNumber, ElSwitch } from 'element-plus';
import { useEpubReaderContainer } from '@epub-reader/Composables/useEpubReaderContainer';
import { useEpubReaderFormatters } from '@epub-reader/Composables/useEpubReaderFormatters';

const props = defineProps({
  epubReaderProp: {
    type: [Array, Object, String],
    default: () => ({}),
  },
});

const emit = defineEmits(['epubReaderEmit', 'epubReaderUi']);

const {
  allowRelocateHandler,
  blockingNotice,
  chapterLimitIndex,
  chapterListStatus,
  bookmarkListStatus,
  bookmarks,
  canUseBookmarks,
  clearBookmarks,
  clearSearch,
  colorOptions,
  confirmHighlight,
  currentPage,
  deleteBookmark,
  updateBookmark,
  deleteAllHighlights,
  deleteHighlight,
  updateHighlight,
  dialogColor,
  dialogNote,
  downloadInProgress,
  downloadOfflineEpub,
  downloadStatusLabel,
  emitBookCollapseData,
  fileDetail,
  fontSize,
  fullProgressPercent,
  goToBookmark,
  goToHighlight,
  goToSearchResult,
  handleBackRoute,
  handleBackTitle,
  handleChapterNavigateEnd,
  handleFontSize,
  handleLineHeight,
  handleTtsRateChange,
  highlightDialog,
  highlightListStatus,
  highlights,
  iconSvgMap,
  isIpadPro,
  isLoading,
  lineHeight,
  openList,
  loadEtaSeconds,
  loadProgressValue,
  loadStageLabel,
  navLoading,
  nightModeStatus,
  noteSanitize,
  offlineError,
  offlineMetaSize,
  offlineReady,
  offlineStatusLabel,
  canUseTts,
  prefetchChapterByHref,
  removeOfflineEpubData,
  rendition,
  readerTitle,
  retryLoadEpub,
  routeSegment,
  seekByProgress,
  scrollModeStatus,
  searchInBook,
  searchKeyword,
  searchNotice,
  searchProgress,
  searchResults,
  searchStatus,
  searching,
  settingListStatus,
  showDialog,
  showRetryHint,
  sideMenuStatus,
  sideMenuWidth,
  spineData,
  startNavLoading,
  stopTts,
  switchNightMode,
  switchScrollMode,
  toggleCurrentBookmark,
  toggleFullscreen,
  togglePlayPauseTts,
  toc,
  totalPages,
  ttsRate,
  ttsStatus,
  ttsStatusLabel,
  ttsStatusMessage,
  ttsSupported,
  ttsFeatureEnabled,
  uiVisible,
  updatedPercentage,
  userGoToNextPage,
  userGoToPrevPage,
  viewer,
  isCurrentBookmarked,
} = useEpubReaderContainer({ props, emit });

const { formatDate } = useEpubReaderFormatters();

const TOP_CHROME_AUTO_COLLAPSE_MS = 2500;
const hoverDepth = ref(0);
const chromeExpanded = ref(false);
const isHoverDevice = ref(false);
const isPointerInsideChrome = ref(false);
const progressSliderValue = ref(0);
const isProgressDragging = ref(false);
const autoCollapseTimer = ref(null);
const hoverMediaRegistration = ref(null);

// 整合式 Drawer Tab
const drawerActiveTab = ref('chapter');
const bookmarkSortOrder = ref('desc');
const highlightColorFilter = ref(null);
const highlightSortOrder = ref('desc');

// 書籤編輯 Dialog
const showBookmarkEditDialog = ref(false);
const editingBookmark = ref(null);
const editBookmarkNote = ref('');
const editBookmarkColor = ref('#bbffff');

const openBookmarkEdit = (bookmark) => {
  editingBookmark.value = bookmark;
  editBookmarkNote.value = bookmark.note || '';
  editBookmarkColor.value = bookmark.color || '#bbffff';
  showBookmarkEditDialog.value = true;
};

const submitBookmarkEdit = () => {
  if (!editingBookmark.value) return;
  updateBookmark(editingBookmark.value.id, {
    note: editBookmarkNote.value,
    color: editBookmarkColor.value,
  });
  showBookmarkEditDialog.value = false;
  editingBookmark.value = null;
};

// 劃線編輯 Dialog
const showHighlightEditDialog = ref(false);
const editingHighlight = ref(null);
const editHighlightNote = ref('');
const editHighlightColor = ref('#ffed97');

const openHighlightEdit = (highlight) => {
  editingHighlight.value = highlight;
  editHighlightNote.value = highlight.note || '';
  editHighlightColor.value = highlight.color || '#ffed97';
  showHighlightEditDialog.value = true;
};

const submitHighlightEdit = async () => {
  if (!editingHighlight.value) return;
  await updateHighlight(editingHighlight.value.cfiRange, {
    note: editHighlightNote.value,
    color: editHighlightColor.value,
  });
  showHighlightEditDialog.value = false;
  editingHighlight.value = null;
};

const filteredHighlights = computed(() => {
  let list = [...highlights.value];
  if (highlightColorFilter.value) {
    list = list.filter((h) => h.color === highlightColorFilter.value);
  }
  list.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return highlightSortOrder.value === 'desc' ? timeB - timeA : timeA - timeB;
  });
  return list;
});

const sortedBookmarks = computed(() => {
  const list = [...bookmarks.value];
  list.sort((a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bookmarkSortOrder.value === 'desc' ? timeB - timeA : timeA - timeB;
  });
  return list;
});
const isDrawerNavPanelActive = computed(
  () => chapterListStatus.value || bookmarkListStatus.value || highlightListStatus.value,
);

const topActionIconClass =
  'inline-flex size-5 items-center justify-center text-current [&>svg]:size-5 [&>svg]:stroke-current';
const topActionButtonClass =
  'reader-top-action-btn inline-flex h-9 w-9 items-center justify-center rounded-full transition hover:scale-[1.04]';
const viewportHeightStyle = 'height: calc(var(--vh, 1vh) * 100); height: 100dvh;';
const AUTH_EXPIRED_ERROR_KEYWORDS = [
  '登入已逾時',
  '登入狀態已失效',
  '請重新登入',
  '尚未登入',
  'unauthenticated',
  'csrf',
  'login',
];

const compactTitle = computed(() => readerTitle.value || '未命名書籍');
const roundedProgressPercent = computed(() => Math.round(updatedPercentage.value * 100));
const isAuthExpiredError = computed(() => {
  const message = String(offlineError.value || '').toLowerCase();
  return AUTH_EXPIRED_ERROR_KEYWORDS.some((keyword) => message.includes(keyword.toLowerCase()));
});
const pageInfoLabel = computed(() => {
  const current = Math.max(1, Number(currentPage.value || 1));
  const total = Math.max(1, Number(totalPages.value || 1));
  return `第 ${current} 頁 / 共 ${total} 頁`;
});
const formatBookmarkPageLabel = (page) => {
  const normalizedPage = String(page ?? '').trim();
  if (normalizedPage === '') {
    return '';
  }

  if (/^第\s*.+\s*頁$/.test(normalizedPage)) {
    return normalizedPage.replace(/\s+/g, ' ').trim();
  }

  return `第 ${normalizedPage} 頁`;
};

const resolveLoginRedirectUrl = () => {
  if (typeof window === 'undefined') {
    return '/login';
  }

  const currentPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
  return `/login?redirect=${encodeURIComponent(currentPath || '/')}`;
};

const goToLogin = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.location.assign(resolveLoginRedirectUrl());
};

const bookmarkIconSvg = computed(() =>
  isCurrentBookmarked.value
    ? '<svg viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1.5"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z" /></svg>',
);

const ttsIconSvg = computed(() =>
  ttsStatus.value === 'playing'
    ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h4l5-4v16l-5-4H6z" /><line x1="19" y1="9" x2="19" y2="15" /><line x1="22" y1="7" x2="22" y2="17" /></svg>'
    : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8h4l5-4v16l-5-4H6z" /><path d="M19 9a4 4 0 0 1 0 6" /><path d="M22 7a7 7 0 0 1 0 10" /></svg>',
);

const clearAutoCollapseTimer = () => {
  if (autoCollapseTimer.value) {
    window.clearTimeout(autoCollapseTimer.value);
    autoCollapseTimer.value = null;
  }
};

const scheduleAutoCollapse = () => {
  if (isHoverDevice.value || !chromeExpanded.value) {
    return;
  }

  clearAutoCollapseTimer();
  autoCollapseTimer.value = window.setTimeout(() => {
    if (!isPointerInsideChrome.value && !sideMenuStatus.value && !showDialog.value) {
      chromeExpanded.value = false;
    }
  }, TOP_CHROME_AUTO_COLLAPSE_MS);
};

const markChromeInteraction = () => {
  if (!uiVisible.value) {
    return;
  }

  chromeExpanded.value = true;
  if (!isHoverDevice.value) {
    scheduleAutoCollapse();
  }
};

const handleChromeMouseEnter = () => {
  if (!isHoverDevice.value) {
    return;
  }

  hoverDepth.value += 1;
  isPointerInsideChrome.value = true;
  chromeExpanded.value = true;
  clearAutoCollapseTimer();
};

const handleChromeMouseLeave = () => {
  if (!isHoverDevice.value) {
    return;
  }

  hoverDepth.value = Math.max(0, hoverDepth.value - 1);
  isPointerInsideChrome.value = hoverDepth.value > 0;

  if (!isPointerInsideChrome.value) {
    chromeExpanded.value = false;
  }
};

const handleChromeTap = () => {
  if (isHoverDevice.value) {
    return;
  }

  chromeExpanded.value = true;
  isPointerInsideChrome.value = false;
  scheduleAutoCollapse();
};

const openChapterList = () => {
  markChromeInteraction();
  drawerActiveTab.value = 'chapter';
  openList('chapter');
};

const openToolPanel = () => {
  markChromeInteraction();
  openList('setting');
};

const openHighlightPanel = () => {
  markChromeInteraction();
  drawerActiveTab.value = 'highlight';
  openList('highlight');
};

const openBookmarkPanel = () => {
  markChromeInteraction();
  drawerActiveTab.value = 'bookmark';
  openList('bookmark');
};

const openSearchPanel = () => {
  markChromeInteraction();
  openList('search');
};

const handleFullscreenAction = () => {
  markChromeInteraction();
  toggleFullscreen();
};

const handleTtsAction = () => {
  markChromeInteraction();
  if (!canUseTts.value) {
    return;
  }

  if (!ttsSupported.value) {
    openToolPanel();
    return;
  }

  togglePlayPauseTts();
};

const handleBookmarkToggle = () => {
  markChromeInteraction();
  if (!canUseBookmarks.value) {
    return;
  }

  toggleCurrentBookmark();
};

const handleProgressSliderInput = (event) => {
  const value = Number(event?.target?.value ?? 0);
  if (!Number.isFinite(value)) {
    return;
  }

  isProgressDragging.value = true;
  progressSliderValue.value = Math.max(0, Math.min(100, value));
  markChromeInteraction();
};

const handleProgressSliderCommit = async () => {
  const targetPercent = Number(progressSliderValue.value || 0);
  isProgressDragging.value = false;
  await seekByProgress(targetPercent);
  markChromeInteraction();
};

watch(
  updatedPercentage,
  (value) => {
    if (isProgressDragging.value) {
      return;
    }

    const percent = Math.max(0, Math.min(100, Number(value) * 100));
    progressSliderValue.value = percent;
  },
  { immediate: true },
);

watch(sideMenuStatus, (open) => {
  if (open) {
    chromeExpanded.value = true;
    clearAutoCollapseTimer();
    return;
  }

  scheduleAutoCollapse();
});

watch(uiVisible, (visible) => {
  if (!visible) {
    chromeExpanded.value = false;
    clearAutoCollapseTimer();
    return;
  }

  scheduleAutoCollapse();
});

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return;
  }

  const media = window.matchMedia('(hover: hover) and (pointer: fine)');
  const applyHoverDevice = (event) => {
    isHoverDevice.value = Boolean(event.matches);
    hoverDepth.value = 0;
    isPointerInsideChrome.value = false;
    if (!isHoverDevice.value) {
      scheduleAutoCollapse();
    } else {
      clearAutoCollapseTimer();
      chromeExpanded.value = false;
    }
  };

  applyHoverDevice(media);

  if (typeof media.addEventListener === 'function') {
    media.addEventListener('change', applyHoverDevice);
    hoverMediaRegistration.value = { media, applyHoverDevice, modern: true };
    return;
  }

  if (typeof media.addListener === 'function') {
    media.addListener(applyHoverDevice);
    hoverMediaRegistration.value = { media, applyHoverDevice, modern: false };
  }
});

onBeforeUnmount(() => {
  clearAutoCollapseTimer();

  const registration = hoverMediaRegistration.value;
  if (!registration) {
    return;
  }

  if (registration.modern && typeof registration.media.removeEventListener === 'function') {
    registration.media.removeEventListener('change', registration.applyHoverDevice);
    return;
  }

  if (typeof registration.media.removeListener === 'function') {
    registration.media.removeListener(registration.applyHoverDevice);
  }
});
</script>
<template>
  <ElInfoLoading
    v-if="isLoading"
    :stage-label="loadStageLabel"
    :progress="loadProgressValue"
    :eta-seconds="loadEtaSeconds"
    :show-retry="showRetryHint"
    @retry="retryLoadEpub"
  />
  <div
    v-if="navLoading && !isLoading"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/20 text-white backdrop-blur-[1px]"
  >
    <div class="flex items-center gap-3 rounded-full bg-black/65 px-4 py-2 text-sm shadow-lg">
      <span class="relative flex size-2">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80"
        ></span>
        <span class="relative inline-flex size-2 rounded-full bg-white"></span>
      </span>
      <span>頁面切換中</span>
    </div>
  </div>
  <div
    v-if="blockingNotice.visible && !isLoading && !navLoading"
    class="fixed inset-0 z-40 flex items-center justify-center bg-black/20 text-white backdrop-blur-[1px]"
  >
    <div class="flex items-center gap-3 rounded-full bg-black/65 px-4 py-2 text-sm shadow-lg">
      <span class="relative flex size-2">
        <span
          class="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80"
        ></span>
        <span class="relative inline-flex size-2 rounded-full bg-white"></span>
      </span>
      <span>{{ blockingNotice.message }}</span>
    </div>
  </div>
  <div
    class="flex min-h-0 w-full items-center justify-center overflow-hidden transition-colors duration-300"
    :class="nightModeStatus ? 'bg-[#3f4a55] text-slate-100' : 'text-primary bg-gray-300'"
    :style="viewportHeightStyle"
  >
    <!-- 電子書容器 -->
    <div
      class="flex min-h-0 w-full flex-col items-center justify-center overflow-hidden lg:w-[70%] lg:px-[80px] lg:pt-[16px]"
      :class="{
        'bg-[#4b5563]': nightModeStatus,
        'bg-[#ffffff]': !nightModeStatus,
        'lg:py-0': fileDetail.writingMode === 'fixed',
        'py-[100px]':
          fileDetail.writingMode === 'horizontal' || fileDetail.writingMode === 'vertical',
        'mb-[100px] lg:w-full': fileDetail.writingMode === 'fixed',
      }"
      :style="viewportHeightStyle"
    >
      <div
        v-if="offlineError"
        class="mb-4 w-full max-w-[520px] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <div>{{ offlineError }}</div>
        <button
          v-if="isAuthExpiredError"
          class="mt-3 inline-flex items-center rounded-md border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
          @click="goToLogin"
        >
          立即登入
        </button>
      </div>
      <div
        ref="viewer"
        class="slow-blur-transition min-h-0 w-full"
        :class="{
          'h-[60%]': fileDetail.writingMode === 'vertical' && isIpadPro() === true,
          'h-full': isIpadPro() !== true,
        }"
      />
    </div>
    <button
      class="fixed top-1/2 left-4 z-50 flex h-[100px] w-[45px] -translate-y-1/2 transform items-center justify-center rounded-full p-1 text-xl shadow-lg transition md:h-[120px] md:text-3xl lg:h-[150px] lg:w-[60px] lg:text-5xl"
      :class="
        nightModeStatus
          ? 'border border-slate-300/40 bg-slate-500/80 text-slate-100 opacity-80 hover:bg-slate-400/85 hover:opacity-100'
          : 'bg-white text-gray-700 opacity-30 hover:opacity-60'
      "
      style="
        touch-action: manipulation;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      "
      @click="userGoToPrevPage"
      v-if="!scrollModeStatus"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M15 18l-6-6 6-6" />
      </svg>
    </button>

    <button
      class="fixed top-1/2 right-4 z-50 flex h-[100px] w-[45px] -translate-y-1/2 transform items-center justify-center rounded-full p-1 text-xl shadow-lg transition md:h-[120px] md:text-3xl lg:h-[150px] lg:w-[60px] lg:text-5xl"
      :class="
        nightModeStatus
          ? 'border border-slate-300/40 bg-slate-500/80 text-slate-100 opacity-80 hover:bg-slate-400/85 hover:opacity-100'
          : 'bg-white text-gray-700 opacity-30 hover:opacity-60'
      "
      style="
        touch-action: manipulation;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      "
      @click="userGoToNextPage"
      v-if="!scrollModeStatus"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="M9 18l6-6-6-6" />
      </svg>
    </button>
    <div
      v-show="uiVisible"
      class="pointer-events-none fixed inset-x-0 top-0 z-20"
      @mouseenter="handleChromeMouseEnter"
      @mouseleave="handleChromeMouseLeave"
      @click="handleChromeTap"
    >
      <div
        class="reader-chrome-bar mx-auto w-[calc(100%-20px)] lg:w-[70%] lg:px-[10px]"
        :class="[
          chromeExpanded ? 'reader-chrome-expanded' : 'reader-chrome-compact',
          nightModeStatus ? 'reader-chrome-night' : 'reader-chrome-light',
          !isPointerInsideChrome && !chromeExpanded ? 'reader-chrome-transparent' : '',
        ]"
      >
        <template v-if="!chromeExpanded">
          <div class="grid w-full grid-cols-[1fr_auto_1fr] items-center px-4 py-1">
            <div></div>
            <div class="truncate text-center text-sm font-semibold md:text-base">
              {{ compactTitle }}
            </div>
            <div class="flex justify-end">
              <button
                class="reader-top-action-btn inline-flex h-9 w-9 items-center justify-center rounded-full transition"
                :class="
                  canUseBookmarks
                    ? 'bg-white/20 hover:bg-white/30'
                    : 'cursor-not-allowed bg-white/10 opacity-50'
                "
                :disabled="!canUseBookmarks"
                @click.stop="handleBookmarkToggle"
              >
                <span v-html="bookmarkIconSvg" :class="topActionIconClass"></span>
              </button>
            </div>
          </div>
        </template>
        <template v-else>
          <div class="flex w-full items-center justify-between gap-3 px-4 py-2">
            <button
              :class="topActionButtonClass"
              class="bg-white/15 hover:bg-white/25"
              title="目錄"
              @click.stop="openChapterList"
            >
              <span v-html="iconSvgMap.chapter" :class="topActionIconClass"></span>
            </button>
            <div class="flex items-center gap-1 sm:gap-2">
              <button
                :class="topActionButtonClass"
                class="bg-white/15 hover:bg-white/25"
                title="工具"
                @click.stop="openToolPanel"
              >
                <span v-html="iconSvgMap.setting" :class="topActionIconClass"></span>
              </button>
              <button
                v-if="ttsFeatureEnabled"
                :class="[
                  topActionButtonClass,
                  'bg-white/15 hover:bg-white/25',
                  { 'cursor-not-allowed opacity-50': !canUseTts },
                ]"
                title="朗讀"
                :disabled="!canUseTts"
                @click.stop="handleTtsAction"
              >
                <span v-html="ttsIconSvg" :class="topActionIconClass"></span>
              </button>
              <button
                :class="topActionButtonClass"
                class="bg-white/15 hover:bg-white/25"
                title="搜尋"
                @click.stop="openSearchPanel"
              >
                <span v-html="iconSvgMap.search" :class="topActionIconClass"></span>
              </button>
              <button
                :class="topActionButtonClass"
                class="bg-white/15 hover:bg-white/25"
                title="全螢幕"
                @click.stop="handleFullscreenAction"
              >
                <span v-html="iconSvgMap.fullscreen" :class="topActionIconClass"></span>
              </button>
              <button
                :class="[
                  topActionButtonClass,
                  'bg-white/15 hover:bg-white/25',
                  { 'cursor-not-allowed opacity-50': !canUseBookmarks },
                ]"
                title="加入書籤"
                :disabled="!canUseBookmarks"
                @click.stop="handleBookmarkToggle"
              >
                <span v-html="bookmarkIconSvg" :class="topActionIconClass"></span>
              </button>
            </div>
          </div>
        </template>
      </div>
    </div>

    <div
      v-show="uiVisible"
      class="pointer-events-none fixed inset-x-0 bottom-0 z-20"
      @mouseenter="handleChromeMouseEnter"
      @mouseleave="handleChromeMouseLeave"
      @click="handleChromeTap"
    >
      <div
        class="reader-chrome-bar mx-auto w-[calc(100%-20px)] lg:w-[70%] lg:px-[10px]"
        :class="[
          chromeExpanded ? 'reader-chrome-expanded' : 'reader-chrome-compact',
          nightModeStatus ? 'reader-chrome-night' : 'reader-chrome-light',
          !isPointerInsideChrome && !chromeExpanded ? 'reader-chrome-transparent' : '',
        ]"
      >
        <template v-if="!chromeExpanded">
          <div
            class="flex w-full items-center justify-between gap-3 px-4 py-2 text-xs font-semibold md:text-sm"
          >
            <span>閱讀進度 {{ roundedProgressPercent }}%</span>
            <span>{{ pageInfoLabel }}</span>
          </div>
        </template>
        <template v-else>
          <div class="w-full px-4 pt-2 pb-3">
            <input
              class="reader-progress-slider w-full"
              type="range"
              min="0"
              max="100"
              step="0.1"
              :value="progressSliderValue"
              @input="handleProgressSliderInput"
              @change="handleProgressSliderCommit"
            />
            <div
              class="mt-2 flex w-full items-center justify-between text-xs font-semibold md:text-sm"
            >
              <span>閱讀進度 {{ Math.round(progressSliderValue) }}%</span>
              <span>{{ pageInfoLabel }}</span>
            </div>
          </div>
        </template>
      </div>
    </div>
    <ElDialog v-model="showDialog" title="新增劃記" :width="highlightDialog">
      <div class="mb-3">
        <label class="mb-1 block">劃記顏色：</label>
        <div class="flex space-x-2">
          <div
            v-for="color in colorOptions"
            :key="color"
            class="h-8 w-8 cursor-pointer rounded transition-all duration-200 hover:opacity-80"
            :style="{
              backgroundColor: color,
              border: dialogColor === color ? '3px solid #3b82f6' : '2px solid #d1d5db',
            }"
            @click="dialogColor = color"
          />
        </div>
      </div>
      <div class="mt-4">
        <label class="mb-1 block">註解（可留空）：</label>
        <textarea
          :value="dialogNote"
          @input="noteSanitize"
          rows="3"
          class="w-full rounded border border-gray-300 p-2"
        ></textarea>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <button class="bg-secondary rounded p-2 text-white" @click="confirmHighlight">
            確定
          </button>
          <button class="rounded bg-gray-300 p-2" @click="showDialog = false">取消</button>
        </div>
      </template>
    </ElDialog>

    <!-- 書籤編輯 Dialog -->
    <ElDialog v-model="showBookmarkEditDialog" title="書籤註記" :width="highlightDialog">
      <div v-if="editingBookmark" class="space-y-4">
        <div class="text-sm" :class="nightModeStatus ? 'text-slate-300' : 'text-gray-600'">
          {{ editingBookmark.page }}
        </div>
        <div>
          <label class="mb-1 block">顏色：</label>
          <div class="flex space-x-2">
            <div
              v-for="color in colorOptions"
              :key="color"
              class="h-8 w-8 cursor-pointer rounded transition-all duration-200 hover:opacity-80"
              :style="{
                backgroundColor: color,
                border: editBookmarkColor === color ? '3px solid #3b82f6' : '2px solid #d1d5db',
              }"
              @click="editBookmarkColor = color"
            />
          </div>
        </div>
        <div>
          <textarea
            v-model="editBookmarkNote"
            rows="3"
            class="w-full rounded border border-gray-300 p-2"
            placeholder="輸入註記..."
          ></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <button class="bg-secondary rounded p-2 text-white" @click="submitBookmarkEdit">
            送出
          </button>
          <button class="rounded bg-gray-300 p-2" @click="showBookmarkEditDialog = false">
            取消
          </button>
        </div>
      </template>
    </ElDialog>

    <!-- 劃線編輯 Dialog -->
    <ElDialog v-model="showHighlightEditDialog" title="劃線註記" :width="highlightDialog">
      <div v-if="editingHighlight" class="space-y-4">
        <div
          class="rounded p-2 text-sm"
          :class="nightModeStatus ? 'bg-slate-600 text-slate-200' : 'bg-gray-100 text-gray-600'"
        >
          {{ editingHighlight.text || '（無文字內容）' }}
        </div>
        <div>
          <label class="mb-1 block">顏色：</label>
          <div class="flex space-x-2">
            <div
              v-for="color in colorOptions"
              :key="color"
              class="h-8 w-8 cursor-pointer rounded transition-all duration-200 hover:opacity-80"
              :style="{
                backgroundColor: color,
                border: editHighlightColor === color ? '3px solid #3b82f6' : '2px solid #d1d5db',
              }"
              @click="editHighlightColor = color"
            />
          </div>
        </div>
        <div>
          <textarea
            v-model="editHighlightNote"
            rows="3"
            class="w-full rounded border border-gray-300 p-2"
            placeholder="輸入註記..."
          ></textarea>
        </div>
      </div>
      <template #footer>
        <div class="flex justify-end space-x-2">
          <button class="bg-secondary rounded p-2 text-white" @click="submitHighlightEdit">
            送出
          </button>
          <button class="rounded bg-gray-300 p-2" @click="showHighlightEditDialog = false">
            取消
          </button>
        </div>
      </template>
    </ElDialog>

    <ElDrawer
      v-model="sideMenuStatus"
      :with-header="true"
      :size="sideMenuWidth"
      :modal="true"
      :modal-class="nightModeStatus ? 'custom-overlay epub-reader-night-overlay' : 'custom-overlay'"
      :class="{
        'epub-reader-night-drawer': nightModeStatus,
        'epub-reader-nav-drawer': isDrawerNavPanelActive,
      }"
      direction="ltr"
    >
      <!-- 整合式 Tab：目錄 / 書籤 / 劃線 -->
      <div
        class="epub-reader-nav-shell text-card-title flex w-full flex-col items-start justify-start"
        v-if="isDrawerNavPanelActive"
      >
        <!-- Tab 標籤列 -->
        <div
          class="epub-reader-nav-tabs flex w-full border-b"
          :class="nightModeStatus ? 'border-slate-600' : 'border-gray-200'"
        >
          <button
            v-for="tab in [
              { key: 'chapter', label: '目錄' },
              { key: 'bookmark', label: '書籤' },
              { key: 'highlight', label: '劃線' },
            ]"
            :key="tab.key"
            class="px-4 py-2 text-sm font-semibold transition"
            :class="
              drawerActiveTab === tab.key
                ? nightModeStatus
                  ? 'border-b-2 border-orange-400/80 text-orange-300'
                  : 'border-b-2 border-orange-500 text-orange-600'
                : nightModeStatus
                  ? 'text-slate-400 hover:text-slate-200'
                  : 'text-gray-500 hover:text-gray-700'
            "
            @click="drawerActiveTab = tab.key"
          >
            {{ tab.label }}
          </button>
        </div>

        <!-- Tab 內容：目錄 -->
        <div v-if="drawerActiveTab === 'chapter'" class="epub-reader-nav-panel w-full">
          <ElBookCollapse
            :toc="toc"
            :rendition="rendition"
            :spineItems="spineData"
            :chapterLimitIndex="chapterLimitIndex"
            :scrollModeStatus="scrollModeStatus"
            :night-mode-status="nightModeStatus"
            :allow-relocate-handler="allowRelocateHandler"
            :prefetch-chapter="prefetchChapterByHref"
            @book-collapse-emit="emitBookCollapseData"
            @navigate-start="startNavLoading"
            @navigate-end="handleChapterNavigateEnd"
          />
        </div>

        <!-- Tab 內容：書籤 -->
        <div v-if="drawerActiveTab === 'bookmark'" class="epub-reader-nav-panel w-full">
          <!-- 工具列：排序 + 清空 -->
          <div class="mb-3 flex w-full items-center justify-between gap-2">
            <select
              v-model="bookmarkSortOrder"
              class="min-w-[5.5rem] rounded border py-1 pr-5 pl-2 text-xs focus:ring-1 focus:ring-orange-400/50 focus:outline-none"
              :class="
                nightModeStatus
                  ? 'border-slate-600 bg-slate-700 text-slate-200'
                  : 'border-gray-200 bg-white text-gray-600'
              "
            >
              <option value="desc">新→舊</option>
              <option value="asc">舊→新</option>
            </select>
            <button
              class="rounded px-3 py-1 text-xs font-medium transition"
              :class="[
                nightModeStatus
                  ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                  : 'bg-secondary text-white hover:opacity-90',
                { 'pointer-events-none opacity-50': bookmarks.length === 0 },
              ]"
              :disabled="bookmarks.length === 0"
              @click="clearBookmarks"
            >
              清空
            </button>
          </div>

          <div
            v-if="sortedBookmarks.length === 0"
            class="text-sm"
            :class="nightModeStatus ? 'text-slate-400' : 'text-gray-500'"
          >
            尚無書籤
          </div>
          <div v-else class="epub-reader-nav-scroll w-full space-y-2">
            <div
              v-for="bookmark in sortedBookmarks"
              :key="bookmark.id"
              class="group cursor-pointer rounded border p-3 transition"
              :class="
                nightModeStatus
                  ? 'border-slate-600 hover:bg-slate-700'
                  : 'border-gray-200 hover:bg-orange-50'
              "
              @click="goToBookmark(bookmark)"
            >
              <!-- 章節名稱 -->
              <div
                v-if="bookmark.chapterLabel"
                class="mb-2 text-sm font-semibold"
                :class="nightModeStatus ? 'text-orange-300' : 'text-primary-600'"
              >
                {{ bookmark.chapterLabel }}
              </div>

              <div class="flex items-center justify-between">
                <div class="text-sm font-semibold">{{ formatBookmarkPageLabel(bookmark.page) }}</div>
                <div class="flex items-center gap-2">
                  <button
                    class="text-xs underline"
                    :class="nightModeStatus ? 'text-slate-300' : 'text-gray-600'"
                    @click.stop="openBookmarkEdit(bookmark)"
                  >
                    ✏️
                  </button>
                  <button
                    class="text-xs underline"
                    :class="nightModeStatus ? 'text-red-400/80' : 'text-red-500'"
                    @click.stop="deleteBookmark(bookmark.id)"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <!-- 註記 -->
              <div
                v-if="bookmark.note"
                class="mt-2 rounded p-2 text-sm"
                :class="
                  nightModeStatus ? 'bg-slate-600 text-slate-200' : 'bg-gray-100 text-gray-600'
                "
              >
                {{ bookmark.note }}
              </div>

              <!-- 顏色、時間 -->
              <div class="mt-2 flex items-center gap-2">
                <div
                  class="h-5 w-5 rounded-full border"
                  :class="nightModeStatus ? 'border-slate-500' : 'border-gray-300'"
                  :style="{ backgroundColor: bookmark.color || '#bbffff' }"
                />
                <span
                  class="text-[11px]"
                  :class="nightModeStatus ? 'text-slate-500' : 'text-gray-400'"
                >
                  {{ formatDate(bookmark.createdAt) }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 內容：劃線 -->
        <div v-if="drawerActiveTab === 'highlight'" class="epub-reader-nav-panel w-full">
          <!-- 工具列：顏色篩選 + 排序 + 全部清除 -->
          <div class="mb-3 flex w-full flex-wrap items-center justify-between gap-2">
            <!-- 顏色篩選圓點 -->
            <div class="flex items-center gap-1">
              <button
                class="h-6 w-6 rounded-full border-2 transition"
                :class="
                  highlightColorFilter === null
                    ? 'border-orange-500'
                    : nightModeStatus
                      ? 'border-slate-500'
                      : 'border-gray-200'
                "
                :style="{
                  background:
                    'conic-gradient(#ffed97 0% 25%, #b3f5b3 25% 50%, #f9a8a8 50% 75%, #93c5fd 75% 100%)',
                }"
                title="全部"
                @click="highlightColorFilter = null"
              />
              <button
                v-for="color in colorOptions"
                :key="color"
                class="h-6 w-6 rounded-full border-2 transition"
                :class="
                  highlightColorFilter === color
                    ? 'border-orange-500'
                    : nightModeStatus
                      ? 'border-slate-500'
                      : 'border-gray-300'
                "
                :style="{ backgroundColor: color }"
                @click="highlightColorFilter = highlightColorFilter === color ? null : color"
              />
            </div>
            <!-- 排序 + 清除 -->
            <div class="flex items-center gap-2">
              <select
                v-model="highlightSortOrder"
                class="min-w-[5.5rem] rounded border py-1 pr-5 pl-2 text-xs focus:ring-1 focus:ring-orange-400/50 focus:outline-none"
                :class="
                  nightModeStatus
                    ? 'border-slate-600 bg-slate-700 text-slate-200'
                    : 'border-gray-200 bg-white text-gray-600'
                "
              >
                <option value="desc">新→舊</option>
                <option value="asc">舊→新</option>
              </select>
              <button
                class="rounded px-3 py-1 text-xs font-medium transition"
                :class="
                  nightModeStatus
                    ? 'bg-slate-600 text-slate-200 hover:bg-slate-500'
                    : 'bg-secondary text-white hover:opacity-90'
                "
                @click="deleteAllHighlights"
              >
                全部清除
              </button>
            </div>
          </div>

          <div
            v-if="filteredHighlights.length === 0"
            class="text-sm"
            :class="nightModeStatus ? 'text-slate-400' : 'text-gray-500'"
          >
            {{ highlightColorFilter ? '此顏色尚無劃線' : '尚無劃線' }}
          </div>
          <div v-else class="epub-reader-nav-scroll w-full space-y-2">
            <div
              v-for="highlight in filteredHighlights"
              :key="highlight.cfiRange"
              class="group cursor-pointer rounded border p-2 transition"
              :class="
                nightModeStatus
                  ? 'border-slate-600 hover:bg-slate-700'
                  : 'border-gray-200 hover:bg-orange-50'
              "
              @click="goToHighlight(highlight.cfiRange)"
            >
              <!-- 章節名稱 -->
              <div
                class="mt-1 mb-2 text-sm font-semibold"
                :class="nightModeStatus ? 'text-orange-300' : 'text-primary-600'"
                v-if="highlight.chapterLabel"
              >
                {{ highlight.chapterLabel || '未知章節' }}
              </div>

              <!-- 劃記文字 -->
              <div
                class="my-2 rounded p-2 text-sm"
                :class="
                  nightModeStatus ? 'bg-slate-600 text-slate-200' : 'bg-gray-100 text-gray-600'
                "
              >
                {{ highlight.text || '（無文字內容）' }}
              </div>

              <!-- 註記顯示 -->
              <div
                v-if="highlight.note"
                class="mt-2 rounded p-2 text-sm"
                :class="
                  nightModeStatus ? 'bg-slate-600 text-slate-200' : 'bg-gray-100 text-gray-600'
                "
              >
                {{ highlight.note }}
              </div>

              <!-- 顏色、時間、編輯、刪除 -->
              <div class="mt-2 flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <div
                    class="h-5 w-5 rounded-full border"
                    :class="nightModeStatus ? 'border-slate-500' : 'border-gray-300'"
                    :style="{ backgroundColor: highlight.color }"
                  />
                  <span
                    v-if="highlight.createdAt"
                    class="text-[11px]"
                    :class="nightModeStatus ? 'text-slate-500' : 'text-gray-400'"
                  >
                    {{ formatDate(highlight.createdAt) }}
                  </span>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="text-sm underline"
                    :class="nightModeStatus ? 'text-slate-300' : 'text-gray-600'"
                    @click.stop="openHighlightEdit(highlight)"
                  >
                    ✏️
                  </button>
                  <button
                    class="text-sm underline"
                    :class="nightModeStatus ? 'text-red-400/80' : 'text-red-500'"
                    @click.stop="deleteHighlight(highlight.cfiRange)"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="text-card-title flex w-full flex-col items-start justify-start"
        v-if="searchStatus"
      >
        <div class="text-card-title mb-5">全文搜索</div>
        <div class="mb-2 flex w-full items-center">
          <div class="flex h-[43px] items-center space-x-2 md:h-[48px] lg:h-[52px]">
            <input
              v-model="searchKeyword"
              class="placeholder:text-card-title h-full w-full grow rounded"
              placeholder="搜尋文字"
              type="text"
              @keyup.enter="searchKeyword && searchInBook()"
            />
            <div :class="{ 'pointer-events-none opacity-50': !searchKeyword }">
              <ElInfoButton
                class="text-card-description w-[50px] px-2 py-3 whitespace-nowrap md:w-[90px]"
                @click="searchInBook"
              >
                <p class="text-card-title">搜尋</p>
              </ElInfoButton>
            </div>
          </div>
        </div>

        <div class="mt-2 mb-2 flex w-full items-center justify-end px-2">
          <a class="cursor-pointer text-xs underline md:text-sm" @click="clearSearch">清除搜索</a>
        </div>

        <div class="max-h-[600px] w-full space-y-2 overflow-auto">
          <div v-if="searchNotice" class="mt-3 text-xs text-gray-500">{{ searchNotice }}</div>
          <div v-if="searching" class="mt-5 mb-2 text-sm text-gray-500">
            搜尋中…{{
              searchProgress.total ? ` ${searchProgress.scanned}/${searchProgress.total}` : ''
            }}
          </div>
          <ul v-else class="mt-5 space-y-2">
            <li
              v-for="(res, i) in searchResults"
              :key="i"
              @click="goToSearchResult(res)"
              class="cursor-pointer rounded bg-gray-100 p-2 text-sm hover:bg-orange-100"
            >
              {{ res.excerpt }}
            </li>
          </ul>
        </div>
      </div>

      <div
        class="text-card-title flex w-full flex-col items-start justify-start"
        v-if="settingListStatus"
      >
        <div v-if="fileDetail.writingMode !== 'vertical' && fileDetail.writingMode !== 'fixed'">
          <div class="text-card-title mb-2">字體大小</div>
          <ElInputNumber
            class="mb-5"
            v-model="fontSize"
            :min="18"
            :max="24"
            @change="handleFontSize"
          />

          <div class="text-card-title mb-2">行距大小</div>
          <ElInputNumber
            class="mb-5"
            v-model="lineHeight"
            :min="2"
            :max="3"
            :step="0.5"
            @change="handleLineHeight"
          />
        </div>

        <div class="text-card-title mb-2">夜間模式</div>
        <ElSwitch
          v-model="nightModeStatus"
          class="mb-5 ml-2 scale-150"
          @change="switchNightMode"
          style="--el-switch-on-color: #d55928; --el-switch-off-color: #bbbbbb"
        />

        <div
          v-if="
            fileDetail.writingMode !== 'vertical' &&
            fileDetail.writingMode !== 'fixed' &&
            totalPages > 1 &&
            routeSegment !== 'preview'
          "
        >
          <div class="text-card-title mb-2">捲軸模式</div>
          <ElSwitch
            v-model="scrollModeStatus"
            class="mb-5 ml-2 scale-150"
            @change="switchScrollMode"
            style="--el-switch-on-color: #d55928; --el-switch-off-color: #bbbbbb"
          />
        </div>

        <div v-if="ttsFeatureEnabled && canUseTts">
          <div class="text-card-title mb-2">語音朗讀</div>
          <div class="mb-2 text-xs" :class="nightModeStatus ? 'text-slate-300' : 'text-gray-500'">
            狀態：{{ ttsStatusLabel }}
          </div>

          <div
            v-if="!ttsSupported"
            class="mb-5 text-xs"
            :class="nightModeStatus ? 'text-slate-300' : 'text-gray-500'"
          >
            此裝置或瀏覽器不支援語音朗讀
          </div>
          <div v-else class="space-y-3">
            <div class="flex flex-wrap gap-2">
              <ElInfoButton
                class="text-card-description w-[80px] px-2 py-2 whitespace-nowrap"
                @click="togglePlayPauseTts"
              >
                <p class="text-card-title">{{ ttsStatus === 'playing' ? '暫停' : '播放' }}</p>
              </ElInfoButton>
              <ElInfoButton
                class="text-card-description w-[80px] px-2 py-2 whitespace-nowrap"
                @click="stopTts"
              >
                <p class="text-card-title">停止</p>
              </ElInfoButton>
            </div>

            <div class="text-card-title mb-2">語速</div>
            <ElInputNumber
              :model-value="ttsRate"
              :min="0.8"
              :max="1.5"
              :step="0.1"
              :precision="1"
              @change="handleTtsRateChange"
            />
          </div>

          <div
            v-if="ttsStatusMessage"
            class="mt-3 text-xs"
            :class="nightModeStatus ? 'text-slate-300' : 'text-gray-500'"
          >
            {{ ttsStatusMessage }}
          </div>
        </div>

        <div v-if="routeSegment !== 'preview'">
          <div class="text-card-title mt-5 mb-2">離線下載進度</div>
          <div class="space-y-2 text-xs text-gray-500">
            <div class="flex items-center justify-between">
              <span>完整下載進度</span>
              <span>{{ fullProgressPercent }}%</span>
            </div>
            <div class="h-2 w-full rounded-full bg-gray-200">
              <div
                class="h-full rounded-full bg-orange-500 transition-all"
                :style="{ width: `${fullProgressPercent}%` }"
              />
            </div>
            <div class="text-[11px] text-gray-500">{{ downloadStatusLabel }}</div>
          </div>

          <div class="text-card-title mt-5 mb-2">離線閱讀</div>
          <div class="mb-2 text-xs text-gray-500">狀態：{{ offlineStatusLabel }}</div>
          <div v-if="offlineMetaSize" class="text-xs text-gray-500">
            容量估計：{{ offlineMetaSize }}
          </div>
          <div
            class="mt-2 flex flex-col gap-2 sm:flex-row"
            :class="{ 'pointer-events-none opacity-50': downloadInProgress }"
          >
            <ElInfoButton
              class="text-card-description w-full px-2 py-3 whitespace-nowrap sm:w-[120px]"
              @click="downloadOfflineEpub"
            >
              <p class="text-card-title">
                {{ downloadInProgress ? '下載中...' : offlineReady ? '重新下載' : '下載離線' }}
              </p>
            </ElInfoButton>
            <ElInfoButton
              v-if="offlineReady"
              class="text-card-description w-full px-2 py-3 whitespace-nowrap sm:w-[120px]"
              @click="removeOfflineEpubData"
            >
              <p class="text-card-title">刪除離線</p>
            </ElInfoButton>
          </div>
          <div v-if="offlineError" class="mt-2 space-y-2">
            <div class="text-xs text-red-500">{{ offlineError }}</div>
            <button
              v-if="isAuthExpiredError"
              class="inline-flex items-center rounded-md border border-red-300 px-2 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
              @click="goToLogin"
            >
              立即登入
            </button>
          </div>
        </div>

        <div class="text-card-title mt-5 mb-2">{{ handleBackTitle }}</div>
        <ElInfoButton
          class="text-card-description w-[100px] px-2 py-3 whitespace-nowrap"
          @click="handleBackRoute"
        >
          <p class="text-card-title">返回</p>
        </ElInfoButton>
      </div>
    </ElDrawer>
  </div>
</template>

<style>
:host {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
