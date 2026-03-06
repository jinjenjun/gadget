<script setup>
import { ref, onMounted, nextTick, watch, computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { encryptAES, decryptAES } from '@/Libs/utils';
import { get, set, del } from 'idb-keyval';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers';
import * as ebook from '@/Libs/ebook';
import * as APIs from '@/APIs';
import ePub from 'epubjs';
import ElInfoButton from '@/Components/ElInfoButton.vue';
import ElBookCollapse from '@/Components/ElBookCollapse.vue';
import ElInfoLoading from '@/Components/ElInfoLoading.vue';

const props = defineProps({
  epubReaderProp: {
    type: [Array, Object, String],
    default: () => ({}),
  },
});
const emit = defineEmits(['epubReaderEmit']);

const routeSegment = ref('reader');
const page = usePage();
const password = page?.props?.auth?.session_id;
const highlightKey = 'epub-highlights';
const nightModeStatus = ref(false);
const reflowableStatus = ref(true);
const scrollModeStatus = ref(false);
const chapterListStatus = ref(false);
const highlightListStatus = ref(false);
const searchStatus = ref(false);
const settingListStatus = ref(false);
const sideMenuStatus = ref(false);
const limitStatus = ref(false);
const goBackStatus = ref(false);
const toolBarStatus = ref(false);
const tocRenderStatus = ref(false);
const viewer = ref(null);
const book = ref(null);
const rendition = ref(null);
const toc = ref([]);
const highlights = ref('');
const dialogSelectedText = ref('');
const showDialog = ref(false);
const dialogCfiRange = ref('');
const skipSelection = ref(false);
const fontSize = ref(18);
const fontColor = ref('#000000');
const lineHeight = ref(2);
const backgroundColor = ref('#ffffff');
const searchKeyword = ref('');
const searchResults = ref([]);
const searching = ref(false);
const dialogNote = ref('');
const dialogColor = ref('#ffed97');
const colorOptions = ['#ffed97', '#a6ffa6', '#bbffff', '#ffaad5'];
const sideMenuWidth = ref('250px');
const totalPages = ref(1);
const currentPage = ref(1);
const currentPercentage = ref(0);
const allowRelocateHandler = ref(true);
const nowLocation = ref(null);
const chapterLimitIndex = ref(-1);
const isLoading = ref(false);
const fileDetail = ref({
  writingMode: '',
  layoutMode: '',
});
const screenWidth = ref(window.innerWidth);
const highlightDialog = ref('340px');
const animatedKeys = ref([]);
const spineData = ref([]);

const updatedPercentage = computed(() => {
  if (!totalPages.value || !currentPage.value) return 0;
  return currentPage.value / totalPages.value;
});

let recoveryRetryCount = 0;

const epubUrl = computed(() => {
  const file = props.epubReaderProp?.outputFileUrl;
  return file ? new URL(file).pathname : null;
});

const epubData = ref({
  productId: '',
  title: '',
  epubUrl: epubUrl.value || 'img/test.epub' || '',
  preview: 100,
  status: true,
  errMessage: '',
  totalPages: 1,
  location: '',
  isPlatformStaff: true,
  writingMode: 1,
  layoutMode: 1,
  endpoints: {},
  settings: {
    fontSize: 18,
    lineHeight: 2,
    themeMode: 1,
    location: '',
    totalPages: 1,
    currentPage: 1,
    currentPercentage: 0,
    readPercentage: 0,
    highlights: [],
  },
});

const routePath = window.location.pathname;
const isEbookRoute = computed(() => {
  // 檢查是否為電子書閱讀頁路由
  return routePath.includes('/ebook/reader') || routePath.includes('/epub-reader/reader');
});
let previewLimit = '';

const emitBookCollapseData = ({ value }) => {
  if (value.tocBuilt) {
    tocRenderStatus.value = true;
  }

  if (!(value.pageSwitch && value.scrollModeStatus)) {
    updatePaginatedPage();
  }

  if (fileDetail.value.layoutMode === 'fixed') {
    currentPage.value = value.fixedCurrentPage || currentPage.value;
  }
  allowRelocateHandler.value = value.allowRelocateHandler;
};

async function loadEpub() {
  try {
    isLoading.value = true;
    return ePub(epubData.value.epubUrl);
  } catch (err) {
    console.error('Epub載入發生錯誤：', err);
    throw err;
  }
}

const setIframeCopyForbidden = () => {
  // TODO: 開發必要時再打開
  if (window.location.hostname === 'unlocking.test') return;

  const iframes = viewer.value.querySelectorAll('iframe');

  iframes.forEach((iframe, index) => {
    if (!iframe?.contentWindow) return;

    const win = iframe.contentWindow;
    const doc = win.document;

    const injectAntiCopy = () => {
      const events = ['contextmenu', 'copy', 'cut', 'paste'];
      events.forEach((event) => {
        doc.addEventListener(event, (e) => {
          helpers.devConsole.log(`[iframe ${index}] 阻擋事件: ${event}`);
          e.preventDefault();
        });
      });

      doc.addEventListener('keydown', (e) => {
        const key = e.key.toLowerCase();
        if ((e.ctrlKey || e.metaKey) && ['a', 'c', 'v', 'x'].includes(key)) {
          helpers.devConsole.log(`[iframe ${index}] 阻擋快捷鍵: Ctrl + ${key.toUpperCase()}`);
          e.preventDefault();
        }
      });

      const disableContextMenu = (e) => {
        e.preventDefault();
        helpers.devConsole.log(`[iframe ${index}] 禁用右鍵（html/body）`);
      };

      ['html', 'body'].forEach((tag) => {
        const el = doc.querySelector(tag);
        if (el) {
          el.addEventListener('contextmenu', disableContextMenu);
        }
      });

      helpers.devConsole.log(`防複製已套用到 iframe ${index}`);
    };

    if (doc.readyState === 'complete') {
      injectAntiCopy();
    } else {
      doc.addEventListener('DOMContentLoaded', injectAntiCopy);
    }
  });
};

const inputSettingsData = (settings) => {
  fontSize.value = Number(settings?.fontSize) || 18;
  lineHeight.value = Number(settings?.lineHeight) || 2;
  nightModeStatus.value = settings?.themeMode === 2;
  currentPage.value = settings?.currentPage || currentPage.value;
  currentPercentage.value = settings?.currentPercentage || currentPercentage.value;
};

const adjustLocation = async () => {
  await helpers.delay(2000);
  const current = rendition.value.currentLocation()?.start?.percentage ?? 0;
  const corrected = Math.max(current - 0.003, 0);
  await rendition.value.display(corrected);
};

const handleBackTitle = computed(() => {
  // 優先使用 endpoints 配置
  if (epubData.value?.endpoints?.webPaths?.backTitle) {
    return epubData.value.endpoints.webPaths.backTitle;
  }

  // Fallback: 根據路由判斷
  if (isEbookRoute.value) {
    return '返回我的書櫃';
  }
  return '返回解鎖首頁';
});

const handleBackRoute = () => {
  // Debug: 檢查配置
  console.log('[handleBackRoute Trial] epubData.value?.endpoints:', epubData.value?.endpoints);

  // 優先使用 endpoints 配置
  const configuredBackRoute = epubData.value?.endpoints?.webPaths?.backRoute;

  console.log('[handleBackRoute Trial] configuredBackRoute:', configuredBackRoute);

  if (configuredBackRoute) {
    helpers.forwardRoute(configuredBackRoute);
    return;
  }

  // Fallback: 根據路由判斷
  if (isEbookRoute.value) {
    helpers.forwardRoute('/member/bookshelf');
    return;
  }
  helpers.forwardRoute('/');
};

const openAnimation = () => {
  toolButtons.value.forEach((item, index) => {
    setTimeout(() => {
      animatedKeys.value.push(item.key);
    }, index * 300);
  });
};

const pending = async (second) => {
  isLoading.value = true;
  await helpers.delay(second);
  isLoading.value = false;
};

const isIpadPro = () => {
  const ua = navigator.userAgent.toLowerCase();
  const isMacTouch = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  const isIpadUA = /ipad/.test(ua);
  const isScreenWidth1024 = window.innerWidth === 1024;

  return isMacTouch && isScreenWidth1024 && !isIpadUA;
};

// 樣式設定檔
const applyTheme = (type) => {
  if (!rendition.value) return;

  let fontSizeStyle = `${fontSize.value}px !important`;
  let lineHeightStyle = `${lineHeight.value} !important`;
  let backgroundColorStyle = `${backgroundColor.value} !important`;
  let fontColorStyle = `${fontColor.value} !important`;

  switch (type) {
    case 1:
      backgroundColorStyle = '#ffffff !important';
      fontColorStyle = '#000000 !important';
      break;
    case 2:
      backgroundColorStyle = '#3c3c3c !important';
      fontColorStyle = '#ffffff !important';
      break;
  }

  const baseStyle = {
    'font-size': fontSizeStyle,
    'line-height': lineHeightStyle,
    'background-color': backgroundColorStyle,
    color: fontColorStyle,
  };

  const isVertical = fileDetail.value.writingMode === 'vertical';

  if (isVertical) {
    rendition.value.themes.default({
      html: {
        ...baseStyle,
        height: '100%',
      },
      body: {
        ...baseStyle,
        margin: '0',
        padding: '0',
        height: '100vh',
        display: 'flex',
        'flex-direction': isVertical ? 'column' : 'row',
        'justify-content': 'flex-center',
        'align-items': 'flex-center',
        'box-sizing': 'border-box',
        overflowX: 'auto',
      },
      'section, article, div.chapter': {
        display: 'flex',
        'flex-direction': 'column',
        'justify-content': 'center',
        'align-items': 'center',
        width: '100vw',
        minHeight: '100vh',
        boxSizing: 'border-box',
        padding: '1em',
        textAlign: 'center',
      },
      img: {
        display: 'block',
        maxWidth: '100%',
        maxHeight: '100%',
        objectFit: 'contain',
        margin: 'auto',
      },
      h1: {
        fontSize: fontSizeStyle,
        lineHeight: lineHeightStyle,
        color: fontColorStyle,
        margin: '1rem',
      },
      'p, div, span, li, a, h2, h3, h4, h5, h6': {
        fontSize: fontSizeStyle,
        lineHeight: lineHeightStyle,
        color: fontColorStyle,
        margin: '0 auto',
      },
      '*': {
        boxSizing: 'border-box',
        backgroundColor: backgroundColorStyle,
        color: fontColorStyle,
      },
    });
    fontSize.value = 18;
    lineHeight.vlaue = 2;
  } else {
    rendition.value.themes.default({
      html: {
        ...baseStyle,
      },
      body: {
        ...baseStyle,
      },
      'p, div, span, li, a, h1, h2, h3, h4, h5, h6': {
        'font-size': fontSizeStyle,
        'line-height': lineHeightStyle,
        color: fontColorStyle,
      },
      '*': {
        'font-size': fontSizeStyle,
        'line-height': lineHeightStyle,
        color: fontColorStyle,
        'background-color': backgroundColorStyle,
      },
    });
  }
};

// TODO: 取得頁面位置相關程式
const goToPrevPage = async () => {
  if (fileDetail.value.writingMode === 'fixed') {
    goToTargetFixedPage('prev');
  } else {
    await rendition.value?.prev();
    updatePaginatedPage();
  }
};

const goToNextPage = async () => {
  if (fileDetail.value.writingMode === 'fixed') {
    goToTargetFixedPage('next');
  } else {
    await rendition.value?.next();
    updatePaginatedPage();
  }
};

const toTargetPage = async (percent) => {
  if (!percent || percent <= 0) return;
  const cfi = book.value.locations.cfiFromPercentage(percent);
  if (cfi) {
    await rendition.value.display(cfi);
  }

  const current = rendition.value.currentLocation()?.start?.percentage ?? 0;
  const corrected = Math.max(current - 0.05, 0);
  await rendition.value.display(corrected).catch(() => {});
};

const goTargetPart = async (percentage, action) => {
  let percentageNum = percentage || 0;

  const actionMap = {
    1: 'prev',
    2: 'next',
  };

  if (actionMap[action] === 'prev') {
    percentageNum = -percentage;
  } else if (actionMap[action] === 'next') {
    percentageNum = percentage;
  } else {
    return;
  }

  if (!book.value || !rendition.value || !nowLocation.value) {
    return;
  }

  const nowPercentage = nowLocation.value.start.percentage ?? 0;
  const correctedPos = Math.max(nowPercentage + percentageNum, 0);
  const targetCfi = book.value.locations.cfiFromPercentage(correctedPos);
  rendition.value
    .display(targetCfi)
    .then(() => {
      helpers.devConsole.log('[scrollMode] 修正定位完成:', correctedPos.toFixed(4));
      ElNotification.warning({
        title: '頁面快速移動',
        offset: 100,
      });
      pending(2000);
    })
    .catch(() => {
      helpers.devConsole.warn('[scrollMode] 修正定位失敗');
    });

  await adjustLocation();
};

let lastPageEmit = -1;

const updatePaginatedPage = () => {
  const loc = rendition.value?.currentLocation();
  if (!loc) {
    console.warn('目前位置不存在');
    return;
  }

  let cfi;

  if (loc?.start?.cfi) {
    cfi = loc.start.cfi;
  } else {
    console.warn('無法獲取 CFI');
    return;
  }

  if (!book.value?.locations || !book.value.locations.length()) {
    console.warn('位置資料尚未載入');
    return;
  }

  let pageIndex;

  if (cfi) {
    pageIndex = book.value.locations.locationFromCfi(cfi);
  }

  if (pageIndex < 0) {
    console.warn('找不到對應頁面', cfi);
    return;
  }

  const atEnd =
    loc?.atEnd ||
    loc?.end?.atEnd ||
    (typeof loc?.end?.percentage === 'number' && loc.end.percentage >= 0.999) ||
    (typeof loc?.start?.percentage === 'number' && loc.start.percentage >= 0.999);
  const pageNumber = atEnd && totalPages.value ? totalPages.value : pageIndex + 1;

  if (pageNumber === lastPageEmit) return;

  currentPage.value = pageNumber;
  lastPageEmit = pageNumber;
};

const updateScrollPage = (location) => {
  const currentLocIndex = location.start.location ?? 0;
  currentPage.value = Math.min(totalPages.value, Math.max(1, currentLocIndex + 1));
};

// 刪除epub檔案
const destroyRendition = () => {
  if (rendition.value) {
    rendition.value.destroy();
    rendition.value = null;
  }
};

// 畫線註記
const loadHighlights = async () => {
  const savedEncrypted = await get(highlightKey);
  if (!savedEncrypted) return;

  let saved;
  try {
    saved = JSON.parse(decryptAES(savedEncrypted, password));
  } catch (e) {
    console.error('劃記資料解密失敗', e);
    return;
  }

  highlights.value = saved;

  saved.forEach((highlight) => {
    rebindHighlight(highlight.cfiRange, highlight.note, highlight.color);
  });
};

const checkHighlightExists = (cfiRange) => {
  return highlights.value.some((h) => h.cfiRange === cfiRange);
};

const rebindAllHighlights = () => {
  if (!rendition.value) return;

  highlights.value.forEach((highlight) => {
    if (!checkHighlightExists(highlight.cfiRange)) {
      rendition.value.annotations.add('highlight', highlight.cfiRange, {}, () => {}, 'highlight', {
        fill: highlight.color || '#00ff00',
        'fill-opacity': '0.4',
        'mix-blend-mode': 'multiply',
      });
    }
  });
};

const rebindHighlight = (cfiRange, note, color = '#00ff00') => {
  if (rendition?.value?.annotations) {
    rendition.value.annotations.remove(cfiRange, 'highlight');
    rendition.value.annotations.add('highlight', cfiRange, {}, () => {}, 'highlight', {
      fill: color,
      'fill-opacity': '0.4',
      'mix-blend-mode': 'multiply',
    });
  }
};

const confirmHighlight = async () => {
  const savedEncrypted = await get(highlightKey);
  const saved = savedEncrypted ? JSON.parse(decryptAES(savedEncrypted, password)) : [];

  let newHighlight = {
    cfiRange: dialogCfiRange.value,
    note: dialogNote.value,
    color: dialogColor.value,
    text: dialogSelectedText.value,
  };

  newHighlight = await enrichHighlightWithChapterInfo(newHighlight);
  const newData = [...saved, newHighlight];

  await set(highlightKey, encryptAES(JSON.stringify(newData), password));

  highlights.value.push(newHighlight);

  if (rendition?.value?.annotations) {
    rendition.value.annotations.add('highlight', dialogCfiRange.value, {}, () => {}, 'highlight', {
      fill: dialogColor.value,
      'fill-opacity': '0.4',
      'mix-blend-mode': 'multiply',
    });
  }

  showDialog.value = false;
};

const enrichHighlightWithChapterInfo = (highlight) => {
  const spineItem = book.value?.spine.get(highlight.cfiRange);
  if (!spineItem) return highlight;

  const spineIndex = book.value.spine.items.findIndex((item) => item.href === spineItem.href);

  const flatToc = flattenToc(book.value.navigation.toc);
  let tocMatch = null;
  const normalizePath = (path) => {
    const link = document.createElement('a');
    link.href = path;
    return link.pathname;
  };

  const bookRootPath =
    actualProp.value?.endpoints?.webBase ||
    (typeof window !== 'undefined' && window.__EPUB_READER_ENDPOINTS__?.webBase) ||
    '/epub-reader';

  for (let i = 0; i < flatToc.length; i++) {
    let tocHref = flatToc[i].href?.split('#')[0];
    if (tocHref && tocHref.startsWith('../')) {
      tocHref = bookRootPath + tocHref.slice(2);
    }

    tocHref = normalizePath(tocHref);

    const normalizedSpineItems = book.value.spine.items.map((item) => {
      let href = item.href?.split('#')[0];
      if (href && href.startsWith('../')) {
        href = bookRootPath + href.slice(2);
      }
      href = normalizePath(href);

      href = href.replace('/reader', '');

      return href;
    });

    const matchIndex = normalizedSpineItems.findIndex((item) => item.includes(tocHref));

    if (matchIndex !== -1 && matchIndex <= spineIndex) {
      tocMatch = { label: flatToc[i].label, index: i + 1 };
    }
  }

  highlight.chapterLabel = tocMatch?.label || '';
  highlight.chapterIndex = tocMatch?.index || 0;
  return highlight;
};

const flattenToc = (toc) => {
  const flat = [];
  toc.forEach((item) => {
    flat.push(item);
    if (item.subitems && item.subitems.length) {
      flat.push(...flattenToc(item.subitems));
    }
  });
  return flat;
};

const deleteAllHighlights = async () => {
  const savedEncrypted = await get(highlightKey);
  const saved = savedEncrypted ? JSON.parse(decryptAES(savedEncrypted, password)) : [];
  const updated = [];

  await set(highlightKey, encryptAES(JSON.stringify(updated), password));

  highlights.value = updated;

  saved.forEach((highlight) => {
    rendition.value.annotations.remove(highlight.cfiRange, 'highlight');
  });
};

const deleteHighlight = async (cfiRange) => {
  const savedEncrypted = await get(highlightKey);
  const saved = savedEncrypted ? JSON.parse(decryptAES(savedEncrypted, password)) : [];

  const updated = saved.filter((h) => h.cfiRange !== cfiRange);
  const enriched = await Promise.all(updated.map(enrichHighlightWithChapterInfo));

  await set(highlightKey, encryptAES(JSON.stringify(updated), password));

  highlights.value = enriched;
  rendition.value.annotations.remove(cfiRange, 'highlight');
};

const goToHighlight = async (cfiRange) => {
  if (!rendition.value || !cfiRange) return;

  await rendition.value.display(cfiRange);

  setTimeout(() => {
    rendition.value.reportLocation();
    rebindAllHighlights();
  }, 500);
};

// 分頁模式
const renderSelected = () => {
  rendition.value.on('selected', async (cfiRange, contents) => {
    if (skipSelection.value) {
      skipSelection.value = false;
      return;
    }

    if (!checkHighlightExists(cfiRange)) {
      const range = await contents.range(cfiRange);
      dialogSelectedText.value = range.toString();
      dialogCfiRange.value = cfiRange;
      dialogNote.value = '';
      dialogColor.value = '#ffed97';
      showDialog.value = true;
    } else {
      ElNotification.warning({
        title: '此區域已畫線，無法重複畫線',
        offset: 100,
      });
    }
    rendition.value.blur();
  });
};
const registerRenditionHooks = () => {
  if (!rendition.value) return;

  rendition.value.hooks.content.register(() => {
    setTimeout(() => {
      if (searchKeyword.value.trim()) {
        highlightKeyword(searchKeyword.value);
      }
      applyTheme(nightModeStatus.value ? 2 : 1);
    }, 0);
  });
};

// 計算TOC禁止試讀章節
const calculateChapterLimits = () => {
  if (!book.value.locations.length) return;

  const tocWithPercent = toc.value.map((chapter) => {
    const spineItem = book.value.spine.get(chapter.href);
    let percent = 1;
    if (spineItem?.cfiBase?.startsWith('epubcfi(')) {
      try {
        percent = book.value.locations.percentageFromCfi(spineItem.cfiBase);
      } catch {
        percent = 1;
      }
    } else if (spineItem?.index != null) {
      percent = spineItem.index / book.value.spine.length;
    }
    return { ...chapter, percent };
  });

  const firstBlockedIndex = tocWithPercent.findIndex((ch) => ch.percent > previewLimit);
  chapterLimitIndex.value =
    firstBlockedIndex === -1 ? tocWithPercent.length - 1 : firstBlockedIndex - 1;

  return tocWithPercent;
};

// 讀取位置資料
const loadLocationData = async () => {
  try {
    const locationAnalysis = await ebook.getEpubLocationByUrl(epubData.value.epubUrl);
    const savedEncryptedLocationData = encryptAES(locationAnalysis.location, password);
    totalPages.value = locationAnalysis.totalPages;
    if (savedEncryptedLocationData) {
      const decryptedLocationData = decryptAES(savedEncryptedLocationData, password);
      return JSON.parse(decryptedLocationData);
    }
  } catch (error) {
    console.error('讀取位置資料錯誤:', error);
  }
  return null;
};

// 讀取版式書籍資料
const createSpineMap = async (epubFile) => {
  const book = ePub(epubFile);
  await book.ready;
  spineData.value = book.spine.spineItems;
  totalPages.value = spineData.value.length;
  helpers.devConsole.log('總頁數:', totalPages.value);
  helpers.devConsole.log('Spine项目:', spineData.value);
};

const goToTargetFixedPage = (action) => {
  let NewPageNumber;

  if (action === 'prev') {
    NewPageNumber = currentPage.value - 1;
  } else if (action === 'next') {
    NewPageNumber = currentPage.value + 1;
  }

  const targetSection = spineData.value[NewPageNumber - 1];

  if (targetSection) {
    const sectionHref = targetSection.href;
    helpers.devConsole.log(`跳轉到第 ${NewPageNumber} 页，章節文件: ${sectionHref}`);
    currentPage.value = NewPageNumber;
    rendition.value
      .display(sectionHref)
      .then(() => {
        helpers.devConsole.log(`跳轉到章節: ${sectionHref}`);
      })
      .catch((error) => {
        console.error('跳轉失败:', error);
      });
  } else {
    console.warn('無效頁碼:', NewPageNumber);
    helpers.devConsole.log('最後的目前頁碼:', currentPage.value);
  }
};

// 分頁模式
const paginatedMode = async () => {
  isLoading.value = true;

  destroyRendition();
  await openAnimation();

  await book.value.ready;
  await book.value.loaded.package;

  let locationData = await loadLocationData();

  if (fileDetail.value.writingMode === 'fixed') {
    await createSpineMap(epubData.value.epubUrl);
  }

  book.value.locations.load(locationData);

  const navigation = await book.value.loaded.navigation;
  toc.value = navigation.toc;
  calculateChapterLimits();

  rendition.value = book.value.renderTo(viewer.value, {
    width: '100%',
    height: '100%',
    flow: 'paginated',
    manager: 'default',
    spread: 'none',
    allowScriptedContent: true,
  });

  registerRenditionHooks();

  rendition.value.on('relocated', async (location) => {
    const percent = location.start.percentage;

    updatePaginatedPage();
    await loadHighlights();
    calculateChapterLimits();

    if (percent > previewLimit) {
      if (!limitStatus.value && !goBackStatus.value) {
        limitStatus.value = true;
        ElNotification.warning({
          title: '超過試讀範圍，返回書本開始頁',
          offset: 100,
        });

        goBackStatus.value = true;

        isLoading.value = true;
        await helpers.delay(2000);
        isLoading.value = false;

        const backTo = book.value.locations.cfiFromPercentage(0);
        await rendition.value.display(backTo);
      }
    } else {
      limitStatus.value = false;
      goBackStatus.value = false;
    }
  });

  rendition.value.on('rendered', () => {
    setTimeout(() => {
      highlightKeyword(searchKeyword.value);
      loadHighlights();
      setIframeCopyForbidden();
      updatePaginatedPage();
    }, 100);
  });

  await rendition.value.display();

  await nextTick();

  if (currentPage.value > 1) {
    const percentage = (currentPage.value - 1) / (totalPages.value - 1);
    const cfi = book.value.locations.cfiFromPercentage(percentage);
    try {
      await rendition.value.display(cfi);
    } catch (e) {
      console.warn('頁面跳轉失敗:', e);
    }
  }

  await handleFontSize();
  await loadHighlights();
  setIframeCopyForbidden();
  renderSelected();

  isLoading.value = false;
};

// 捲軸模式
const scrollMode = async (percentageFromPaginated = null) => {
  if (recoveryRetryCount >= 1) return;

  await openAnimation();
  destroyRendition();

  await book.value.ready;
  await book.value.loaded.package;

  const isVertical = fileDetail.value?.writingMode === 'vertical';

  let locationData = await loadLocationData();

  book.value.locations.load(locationData);

  const navigation = await book.value.loaded.navigation;
  toc.value = navigation.toc;
  calculateChapterLimits();

  const viewerHeight = isIpadPro() ? `${window.innerHeight * 3}px` : '100%';

  rendition.value = book.value.renderTo(viewer.value, {
    width: '100%',
    height: viewerHeight,
    manager: 'continuous',
    flow: isVertical ? 'scrolled-continuous' : 'scrolled',
    allowScriptedContent: true,
  });

  registerRenditionHooks();
  await rendition.value.display();

  rendition.value.on('rendered', () => {
    setTimeout(() => {
      setIframeCopyForbidden();
    }, 100);
  });
  await adjustLocation();

  let relocatedOnce = false;
  let lastPercentage = 0;
  let isProgrammaticScroll = false;
  let isRecoveringFromInvalidRelocation = false;
  const isRecovering = ref(false);

  rendition.value.on('relocated', async (location) => {
    const refreshPercentage = location.start.percentage ?? -1;
    nowLocation.value = location;

    const isInvalidRelocation =
      location.start.index === undefined ||
      Number.isNaN(location.start.index) ||
      refreshPercentage < 0 ||
      typeof location.start.cfi !== 'string' ||
      location.start.cfi.length < 5;

    if (isInvalidRelocation) {
      helpers.devConsole.warn('[scrollMode] relocated 失效，重新載入修復');
      isRecovering.value = true;
      isRecoveringFromInvalidRelocation = true;
      recoveryRetryCount++;

      await scrollMode(updatedPercentage.value);
      await toTargetPage(currentPercentage.value);
      isRecovering.value = false;
      return;
    }

    await updateScrollPage(location);
    const newPercentage = location.start.percentage ?? 0;

    if (!relocatedOnce) {
      relocatedOnce = true;

      if (percentageFromPaginated !== null) {
        isProgrammaticScroll = true;
        const cfi = book.value.locations.cfiFromPercentage(percentageFromPaginated);
        await rendition.value.display(cfi);
        lastPercentage = percentageFromPaginated;
        return;
      }

      isProgrammaticScroll = true;
      await toTargetPage(currentPercentage.value);
      lastPercentage = currentPercentage.value || 0;
      return;
    }

    if (isProgrammaticScroll) {
      isProgrammaticScroll = false;
      return;
    }

    lastPercentage = newPercentage;

    if (newPercentage > previewLimit) {
      if (!limitStatus.value && !goBackStatus.value) {
        limitStatus.value = true;
        goBackStatus.value = true;
        isLoading.value = true;
        ElNotification.warning({
          title: '超過試讀範圍，返回書本開始頁',
          offset: 100,
        });
        await helpers.delay(500);
        ElNotification.warning({
          title: '頁面快速移動',
          offset: 100,
        });
        await helpers.delay(2000);
        isLoading.value = false;
        const backTo = book.value.locations.cfiFromPercentage(0);
        await rendition.value.display(backTo);
      }
    } else {
      limitStatus.value = false;
      goBackStatus.value = false;
    }
  });

  await handleFontSize();
  await loadHighlights();
  await adjustLocation();
  setIframeCopyForbidden();
  renderSelected();

  isLoading.value = false;
};

const switchScrollMode = async () => {
  scrollModeStatus.value ? scrollMode(updatedPercentage.value) : paginatedMode();

  if (scrollModeStatus.value) {
    await adjustLocation();
  }
};

// 文字設定
const handleFontSize = async (p) => {
  if (p !== undefined && p !== null) {
    fontSize.value = p;
  }
  applyTheme(nightModeStatus.value ? 2 : 1);
  await loadHighlights();
};

// 行高設定
const handleLineHeight = async (l) => {
  if (l !== undefined && l !== null) {
    lineHeight.value = l;
  }
  applyTheme(nightModeStatus.value ? 2 : 1);
  await loadHighlights();
};

// 日夜間模式
const switchNightMode = () => {
  applyTheme(nightModeStatus.value ? 2 : 1);
};

// 全文搜索
const searchInBook = async () => {
  if (!searchKeyword.value.trim()) return;
  searching.value = true;
  searchResults.value = [];

  await book.value.ready;
  await book.value.loaded.package;

  const keyword = searchKeyword.value.toLowerCase();
  const spineItems = book.value.spine.spineItems;

  for (const item of spineItems) {
    try {
      await item.load(book.value.load.bind(book.value));
      const html = await item.render();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const textContent = doc.body.innerText || '';
      const idx = textContent.toLowerCase().indexOf(keyword);

      if (idx !== -1) {
        const excerpt =
          textContent.substring(Math.max(0, idx - 30), idx + keyword.length + 40) + '…';
        const range = document.createRange();
        const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
        let currentNode;
        let currentOffset = 0;
        let found = false;

        while ((currentNode = walker.nextNode())) {
          const nodeText = currentNode.textContent || '';
          if (keyword.length + idx <= currentOffset + nodeText.length) {
            const startOffset = idx - currentOffset;
            range.setStart(currentNode, startOffset);
            range.setEnd(currentNode, startOffset + keyword.length);
            found = true;
            break;
          }
          currentOffset += nodeText.length;
        }

        let cfi = '';
        if (found) {
          cfi = item.cfiFromRange(range);
        }

        searchResults.value.push({
          href: item.href,
          excerpt,
          cfi,
        });
      }

      item.unload?.();
    } catch (err) {
      console.warn('搜尋時發生錯誤：', err);
    }
  }

  searching.value = false;
};

const clearSearch = () => {
  searchKeyword.value = '';
  searchResults.value = [];
  searching.value = false;
  clearSearchHighlights();
};

const highlightKeyword = (keyword) => {
  if (!rendition.value) return;
  if (!keyword.trim()) return;

  const lowerKeyword = keyword.toLowerCase();

  rendition.value.themes.default({
    'mark.epub-search-highlight': {
      'background-color': '#ffbd9d !important',
      color: 'black',
      'font-weight': 'bold',
      padding: '0 2px',
    },
  });

  rendition.value.getContents().forEach((content) => {
    const doc = content.document;

    const existingMarks = doc.querySelectorAll('mark.epub-search-highlight');
    existingMarks.forEach((mark) => {
      const text = mark.textContent;
      const parent = mark.parentNode;
      if (!parent) return;
      const textNode = doc.createTextNode(text);
      parent.replaceChild(textNode, mark);
      parent.normalize();
    });

    const walker = doc.createTreeWalker(doc.body, NodeFilter.SHOW_TEXT);
    const nodesToReplace = [];

    while (walker.nextNode()) {
      const node = walker.currentNode;
      const text = node.textContent;
      const lowerText = text.toLowerCase();

      if (lowerText.includes(lowerKeyword)) {
        nodesToReplace.push(node);
      }
    }

    nodesToReplace.forEach((node) => {
      const parent = node.parentNode;
      if (!parent) return;

      const regex = new RegExp(`(${keyword})`, 'gi');
      const newHTML = node.textContent.replace(
        regex,
        `<mark class="epub-search-highlight">$1</mark>`,
      );

      const temp = document.createElement('span');
      temp.innerHTML = newHTML;

      parent.replaceChild(temp, node);
    });
  });
};

const clearSearchHighlights = () => {
  if (!rendition.value) return;

  rendition.value.getContents().forEach((content) => {
    const doc = content.document;
    const marks = doc.querySelectorAll('mark.epub-search-highlight');
    marks.forEach((mark) => {
      const text = mark.textContent;
      const parent = mark.parentNode;
      if (!parent) return;

      const textNode = document.createTextNode(text);
      parent.replaceChild(textNode, mark);
      parent.normalize();
    });
  });
};

const goToSearchResult = async (result) => {
  skipSelection.value = true;
  clearSearchHighlights();
  sideMenuStatus.value = false;

  const previousCfi = rendition.value.location?.start?.cfi;

  let highlightTriggered = false;

  const doHighlight = () => {
    if (highlightTriggered) return;
    highlightTriggered = true;

    highlightKeyword(searchKeyword.value);

    if (nightModeStatus.value) {
      applyTheme(2);
    } else {
      applyTheme(1);
    }

    if (scrollModeStatus.value) {
      const contents = rendition.value.getContents();
      contents.forEach((content) => {
        const doc = content.document;
        const firstMark = doc.querySelector('mark.epub-search-highlight');
        if (firstMark) {
          firstMark.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
          doc.defaultView.scrollTo(0, 0);
        }
      });
    }

    rendition.value.off('relocated', doHighlight);
  };

  rendition.value.on('relocated', doHighlight);

  await rendition.value.display(result.cfi || result.href);

  setTimeout(() => {
    if (!highlightTriggered && previousCfi === result.cfi) {
      doHighlight();
    }
  }, 200);
};

// 打開選單
const statusMap = {
  chapter: chapterListStatus,
  highlight: highlightListStatus,
  setting: settingListStatus,
  search: searchStatus,
};

const openList = (listName) => {
  sideMenuStatus.value = true;
  Object.entries(statusMap).forEach(([key, val]) => {
    val.value = key === listName;
  });
};

const toggleFullscreen = () => {
  const elem = document.documentElement;

  const isFullscreen =
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement;

  if (!isFullscreen) {
    if (elem.requestFullscreen) {
      elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      elem.webkitRequestFullscreen();
    } else if (elem.mozRequestFullScreen) {
      elem.mozRequestFullScreen();
    } else if (elem.msRequestFullscreen) {
      elem.msRequestFullscreen();
    }
  } else {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      document.webkitExitFullscreen();
    } else if (document.mozCancelFullScreen) {
      document.mozCancelFullScreen();
    } else if (document.msExitFullscreen) {
      document.msExitFullscreen();
    }
  }
};

const goFirstChapter = async () => {
  if (book.value.spine.spineItems.length > 0) {
    const firstChapterHref = book.value.spine.spineItems[0].href;
    try {
      await rendition.value.display(firstChapterHref);
    } catch (error) {
      await goTargetPart(1, 1);
      console.error('跳轉首頁章節時出錯:', error);
    }
  } else {
    await goTargetPart(1, 1);
    console.error('spine中未找到首頁章節');
  }
};

const toolButtons = computed(() => [
  { key: 'chapter', icon: 'ri-list-check', action: () => openList('chapter'), allow: true },
  { key: 'setting', icon: 'ri-settings-5-fill', action: () => openList('setting'), allow: true },
  {
    key: 'highlight',
    icon: 'ri-ball-pen-fill',
    action: () => openList('highlight'),
    allow: reflowableStatus.value,
  },
  {
    key: 'search',
    icon: 'ri-search-line',
    action: () => openList('search'),
    allow: reflowableStatus.value,
  },
  { key: 'fullscreen', icon: 'ri-fullscreen-line', action: () => toggleFullscreen(), allow: true },
  {
    key: 'goFirstPage',
    icon: 'ri-home-7-fill',
    action: () => goFirstChapter(),
    allow: scrollModeStatus.value,
  },
]);

const closeEpubReader = () => {
  emit('epubReaderEmit', {
    outputFileUrl: '',
    active: false,
  });
};

const updateViewItems = () => {
  if (screenWidth.value > 1024) {
    highlightDialog.value = '450px';
    sideMenuWidth.value = '340px';
    updateVH();
  } else if ((screenWidth.value = 1024)) {
    highlightDialog.value = '450px';
    sideMenuWidth.value = '340px';
  } else if (screenWidth.value >= 768) {
    highlightDialog.value = '340px';
    sideMenuWidth.value = '320px';
  } else {
    highlightDialog.value = '340px';
    sideMenuWidth.value = '250px';
  }
};

const updateVH = () => {
  const vh = Math.max(document.documentElement.clientHeight || 0, window.innerHeight || 0) * 0.01;
  document.documentElement.style.setProperty('--vh', `${vh}px`);
};

onMounted(async () => {
  setTimeout(() => {
    updateVH();
  }, 200);

  window.addEventListener('orientationchange', () => {
    setTimeout(updateVH, 300);
  });

  if (epubData.value?.settings) {
    const settings = epubData.value.settings;
    inputSettingsData(settings);
    const encrypted = encryptAES(JSON.stringify(settings.highlights), password);
    await set(highlightKey, encrypted);
    if (routeSegment === 'preview') {
      await del(highlightKey);
    }
  }

  if (epubData.value.layoutMode === 1) {
    fileDetail.value.layoutMode = 'reflowable';
  } else if (epubData.value.layoutMode === 2) {
    fileDetail.value.layoutMode = 'fixed';
  } else {
    fileDetail.value.layoutMode = 'reflowable';
  }

  if (epubData.value.layoutMode === 2) {
    fileDetail.value.writingMode = 'fixed';
    reflowableStatus.value = false;
  } else if (epubData.value.writingMode === 1) {
    fileDetail.value.writingMode = 'horizontal';
  } else if (epubData.value.writingMode === 2) {
    fileDetail.value.writingMode = 'vertical';
  } else {
    if (book.value) {
      fileDetail.value = await ebook.analyzeEpubFile(book.value);
      fileDetail.value.layoutMode = 'reflowable';
    } else {
      console.error('無法分析EPUB檔案');
    }
  }

  if (epubData.value.isPlatformStaff === true && routeSegment === 'preview') {
    previewLimit = epubData.value.preview / 100;
  } else if (epubData.value.isPlatformStaff === false && routeSegment === 'preview') {
    previewLimit = epubData.value.preview / 100;
  } else {
    previewLimit = 1;
  }

  updateViewItems();
  window.addEventListener('resize', async () => {
    screenWidth.value = window.innerWidth;
    updateViewItems();

    if (rendition.value) {
      if (fileDetail.value.writingMode === 'vertical') {
        await paginatedMode();
      }
      rendition.value.resize();
    }
  });

  await loadHighlights();
  await rebindAllHighlights();
  await helpers.delay(2000);

  if (routeSegment === 'preview') {
    await deleteAllHighlights();
  }

  let lastTouchEnd = 0;
  document.addEventListener(
    'touchend',
    (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    },
    { passive: false },
  );

  book.value = await loadEpub();

  await paginatedMode();
});

watch(
  () => epubData.value?.settings,
  async (settings) => {
    if (!settings) return;
    inputSettingsData(settings);
    const encrypted = encryptAES(JSON.stringify(settings.highlights), password);
    await set(highlightKey, encrypted);
    if (routeSegment === 'preview') {
      await del(highlightKey);
    }
  },
  { immediate: true },
);
</script>
<template>
  <ElInfoLoading v-if="isLoading" />
  <div
    class="text-primary flex w-full items-center justify-center bg-gray-300"
    :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
  >
    <!-- 電子書容器 -->
    <div
      class="flex w-full flex-col items-center justify-center overflow-hidden p-[30px] lg:w-[60%] lg:px-[100px]"
      :class="{
        'bg-[#3c3c3c]': nightModeStatus,
        'bg-[#ffffff]': !nightModeStatus,
        'lg:py-0': fileDetail.writingMode === 'fixed',
        'py-[100px]':
          fileDetail.writingMode === 'horizontal' || fileDetail.writingMode === 'vertical',
        'mb-[100px] lg:w-full': fileDetail.writingMode === 'fixed',
      }"
      :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
    >
      <div
        ref="viewer"
        class="slow-blur-transition w-full"
        :class="{
          'h-[60%]': fileDetail.writingMode === 'vertical' && isIpadPro() === true,
          'h-full': isIpadPro() !== true,
        }"
      />
    </div>

    <button
      class="fixed top-1/2 left-4 z-50 flex h-[100px] w-[45px] -translate-y-1/2 transform items-center justify-center rounded-full bg-white p-1 text-xl text-gray-700 opacity-30 shadow-lg transition hover:opacity-60 md:h-[120px] md:text-3xl lg:h-[150px] lg:w-[60px] lg:text-5xl"
      style="
        touch-action: manipulation;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      "
      @click="goToPrevPage"
      v-if="!scrollModeStatus"
    >
      <i class="ri-arrow-left-s-line"></i>
    </button>

    <button
      class="fixed top-1/2 right-4 z-50 flex h-[100px] w-[45px] -translate-y-1/2 transform items-center justify-center rounded-full bg-white p-1 text-xl text-gray-700 opacity-30 shadow-lg transition hover:opacity-60 md:h-[120px] md:text-3xl lg:h-[150px] lg:w-[60px] lg:text-5xl"
      style="
        touch-action: manipulation;
        -webkit-user-select: none;
        -webkit-tap-highlight-color: transparent;
      "
      @click="goToNextPage"
      v-if="!scrollModeStatus"
    >
      <i class="ri-arrow-right-s-line"></i>
    </button>
    <div class="fixed bottom-0 z-10 flex w-full flex-col justify-center pt-3">
      <div
        class="mb-2 flex items-center justify-center"
        :class="{
          hidden: !toolBarStatus,
        }"
      >
        <div v-for="item in toolButtons" :key="item.key">
          <button
            class="tool-button bg-light-brown border-primary hover:border-primary-500! hover:text-primary-500! mx-1 mb-1 h-[35px] w-[35px] rounded-full border-2 hover:bg-white! md:mx-3 md:h-[55px] md:w-[55px] lg:mx-4 lg:h-[70px] lg:w-[70px]"
            :class="[
              item.allow ? 'bg-light-brown border-primary' : 'hidden',
              animatedKeys.includes(item.key) ? 'glowing-orange' : '',
            ]"
            @click="item.action"
          >
            <i :class="`${item.icon} text-xl md:text-3xl lg:text-3xl`"></i>
          </button>
        </div>
      </div>
      <div
        class="bg-light-brown border-light-gray flex w-full items-center justify-center space-x-3 border-t-2 py-2 text-center font-bold"
      >
        <span v-if="totalPages > 1"
          >閱讀進度：<span>{{ Math.round(updatedPercentage * 100) }}%</span></span
        >
        <span class="pr-2">工具列：</span>
        <ElSwitch
          v-model="toolBarStatus"
          class="scale-150"
          style="--el-switch-on-color: #d55928; --el-switch-off-color: #bbbbbb"
        />
        <!--      TODO: 總頁數有需要時再打開-->
        <!--      <span v-if="totalPages > 1" class="ml-5"-->
        <!--        >總頁數：<span>{{ totalPages }}</span></span-->
        <!--      >-->
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
          v-model="dialogNote"
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

    <ElDrawer
      v-model="sideMenuStatus"
      :with-header="true"
      :size="sideMenuWidth"
      :modal="true"
      :modal-class="'custom-overlay'"
      direction="ltr"
    >
      <div
        class="text-card-title flex w-full flex-col items-start justify-start"
        v-if="chapterListStatus"
      >
        <div class="mb-5">目錄</div>
        <ElBookCollapse
          :toc="toc"
          :rendition="rendition"
          :spineItems="spineData"
          :chapterLimitIndex="chapterLimitIndex"
          :scrollModeStatus="scrollModeStatus"
          :allow-relocate-handler="allowRelocateHandler"
          @book-collapse-emit="emitBookCollapseData"
        />
      </div>

      <div
        class="text-card-title flex w-full flex-col items-start justify-start"
        v-if="highlightListStatus"
      >
        <div class="flex w-full items-center justify-between">
          <div class="mb-2">劃記註解</div>
          <button
            class="bg-secondary text-card-description mt-2 mb-5 rounded p-2 text-white"
            @click="deleteAllHighlights"
          >
            全部清除
          </button>
        </div>

        <div class="max-h-[600px] w-full space-y-2 overflow-auto">
          <div
            v-for="highlight in highlights"
            :key="highlight.cfiRange"
            class="group hover:bg-primary-100 cursor-pointer rounded border border-gray-200 p-2 transition"
            @click="goToHighlight(highlight.cfiRange)"
          >
            <!-- 章節名稱 -->
            <div
              class="text-primary-600 mt-1 mb-2 text-sm font-semibold"
              v-if="highlight.chapterLabel"
            >
              {{ highlight.chapterLabel || '未知章節' }}
            </div>

            <!-- 劃記文字 -->
            <div class="my-2 rounded bg-gray-100 p-2 text-sm text-gray-600">
              {{ highlight.text || '（無文字內容）' }}
            </div>

            <!-- 註解輸入 -->
            <textarea
              v-model="highlight.note"
              disabled
              rows="2"
              class="w-full cursor-not-allowed rounded border border-gray-300 p-1 text-sm text-gray-400"
              placeholder="沒有註解"
            />

            <!-- 顏色與刪除 -->
            <div class="mt-2 flex items-center justify-between">
              <div class="flex items-center space-x-2">
                <span class="text-xs text-gray-500">顏色：</span>
                <div
                  class="border-gray h-6 w-6 rounded border"
                  :style="{ 'background-color': highlight.color }"
                />
              </div>
              <button
                class="text-sm text-red-500 underline"
                @click.stop="deleteHighlight(highlight.cfiRange)"
              >
                刪除
              </button>
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
                class="text-card-description w-[100px] px-2 py-3 whitespace-nowrap"
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
          <div v-if="searching" class="mt-5 mb-2 text-sm text-gray-500">搜尋中…</div>
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
        <div v-if="fileDetail.writingMode === 'horizontal'">
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
            fileDetail.writingMode === 'horizontal' && totalPages > 1 && routeSegment !== 'preview'
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

        <div class="text-card-title mt-5 mb-2">返回Epub轉換器</div>
        <ElInfoButton
          class="text-card-description w-[100px] px-2 py-3 whitespace-nowrap"
          @click="closeEpubReader"
        >
          <p class="text-card-title">返回</p>
        </ElInfoButton>
      </div>
    </ElDrawer>
  </div>
</template>
