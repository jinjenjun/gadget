<script setup>
import { ref, onMounted, onBeforeUnmount, watch } from 'vue';
import '@/../scss/main.scss';
import * as helpers from '@epub-reader/Libs/helpers';
import * as ebook from '@epub-reader/Libs/ebook';
import * as APIs from '@/APIs';
import ePub from 'epubjs';
import ElInfoLoading from '@/Components/ElInfoLoading.vue';
import ElInfoButton from '@/Components/ElInfoButton.vue';
const viewer = ref(null);
const book = ref(null);
const isLoading = ref(false);
const actualProp = ref({});
const hasLoadedBook = ref(false);

// 追蹤大型資源以便清理
let epubBlob = null;
let plainBuffer = null;

const postReadData = ref({});

const checkOutcome = ref({
  tocOutcome: '尚未檢測',
  spineOutcome: '尚未檢測',
  metadataOutcome: '尚未檢測',
  manifestOutcome: '尚未檢測',
  writingMode: '橫式',
  metadata: {
    title: '',
    creator: '',
    language: '',
    publisher: '',
    date: '',
  },
  errorDetails: [],
  finalVerifiedOutcome: '尚未檢測',
});

const props = defineProps({
  epubCheckProp: {
    type: [Array, Object, String],
    default: () => ({}),
  },
});

const emit = defineEmits(['epubCheckEmit']);

const isAbsoluteUrl = (value) => /^https?:\/\//i.test(value) || value.startsWith('//');

const resolveEndpoint = (key, fallback, legacyFallback = null) => {
  const endpoints =
    actualProp.value?.endpoints ||
    (typeof window !== 'undefined' && window.__EPUB_READER_ENDPOINTS__) ||
    {};
  const apiBase = endpoints.apiBase || actualProp.value?.apiBaseUrl || '';
  const apiPaths = endpoints.apiPaths || {};
  const webPaths = endpoints.webPaths || {};

  if (apiPaths[key]) {
    const path = apiPaths[key];
    if (isAbsoluteUrl(path)) return path;
    if (!apiBase) return path;
    const normalizedBase = apiBase.replace(/\/$/, '');
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    if (normalizedPath === normalizedBase || normalizedPath.startsWith(`${normalizedBase}/`)) {
      return normalizedPath;
    }
    return `${normalizedBase}${normalizedPath}`;
  }

  if (webPaths[key]) {
    return webPaths[key];
  }

  return fallback || legacyFallback;
};

const withIncludeKey = (url) => {
  if (!url) return url;
  const joiner = url.includes('?') ? '&' : '?';
  return `${url}${joiner}include_key=1`;
};

const b64ToBytes = (b64) => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
};

async function loadEpub(productId, epubUrl) {
  try {
    isLoading.value = true;

    // 清理舊資源
    cleanupResources();

    const keyRes = await APIs.unlock.reader.getEpubKey(
      withIncludeKey(resolveEndpoint('onekey', `/epub-reader/${productId}/onekey`)),
    );
    const keyToken = keyRes?.data?.key_token;
    const keyB64 = keyRes?.data?.key_b64 ?? null;
    if (!keyToken && !keyB64) {
      throw new Error('無法取得解密金鑰');
    }
    const keyBytes = keyB64
      ? b64ToBytes(keyB64)
      : b64ToBytes(
          (
            await APIs.unlock.reader.getEpubFile(
              resolveEndpoint('epubKey', `/epub-reader/epub-key/${keyToken}`),
            )
          ).data.key_b64,
        );
    const pkgRes = await fetch(epubUrl);
    const pkg = await pkgRes.json();
    const iv = b64ToBytes(pkg.iv_b64);
    const tag = b64ToBytes(pkg.tag_b64);
    const cipher = b64ToBytes(pkg.cipher_b64);
    const cpt = new Uint8Array(cipher.length + tag.length);
    cpt.set(cipher, 0);
    cpt.set(tag, cipher.length);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, [
      'decrypt',
    ]);

    // 儲存 buffer 引用以便後續清理
    plainBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, cryptoKey, cpt);

    epubBlob = new Blob([plainBuffer], {
      type: pkg.content_type || 'application/epub+zip',
    });

    const epubBook = ePub(epubBlob);

    // 立即清理不再需要的中間資料
    plainBuffer = null;

    return epubBook;
  } catch (err) {
    console.error('Epub載入發生錯誤：', err);
    // 發生錯誤時也要清理資源
    cleanupResources();
    throw err;
  }
}

// 清理記憶體資源
function cleanupResources() {
  try {
    // 只清理最大的資源：plainBuffer 和 epubBlob
    // 不觸碰 book.value 內部，避免 ePub.js 異步操作錯誤

    if (epubBlob) {
      epubBlob = null;
    }

    if (plainBuffer) {
      plainBuffer = null;
    }

    // 只在組件卸載時才清理 book
    // 讓 book 實例自然保留（元數據相對較小，10-20MB）
    if (book.value) {
      book.value = null;
    }

    // 建議垃圾回收（僅在開發模式下有效）
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  } catch (error) {
    console.warn('清理資源時發生警告：', error);
  }
}

watch(
  () => props.epubCheckProp,
  (val) => {
    if (typeof val === 'string') {
      if (val.trim().startsWith('{')) {
        try {
          actualProp.value = JSON.parse(val);
        } catch (e) {
          console.error('閱讀器傳入invalid JSON');
          actualProp.value = {};
        }
      } else {
        console.error('閱讀器傳入非 JSON 字串');
        actualProp.value = {};
      }
    } else {
      actualProp.value = val;
    }
  },
  { immediate: true },
);

const statusClass = (value) => {
  if (value === '尚未檢測') {
    return 'color-alert-disabled';
  } else if (value === '通過') {
    return 'color-alert-success';
  } else {
    return 'color-alert-danger';
  }
};

const openEpubReader = () => {
  const productId = actualProp.value?.productId;
  if (!productId) {
    console.error('無法開啟電子書：缺少 productId');
    return;
  }

  const readerUrl = `/epub-reader/reader/${productId}`;
  window.open(readerUrl, '_blank');

  emit('epubCheckEmit', { closeChecklist: true });
};

watch(
  () => actualProp.value?.settings,
  async (settings) => {
    if (!settings) return;
    if (!postReadData.value.settings) {
      postReadData.value.settings = {};
    }
    Object.assign(postReadData.value.settings, settings);
  },
  { immediate: true },
);

onMounted(async () => {
  const newVal = actualProp.value;
  if (!newVal) return;
  helpers.devConsole.log('閱讀器資料傳入:', newVal);
  postReadData.value = newVal;

  // 確保 settings 物件存在
  if (!postReadData.value.settings) {
    postReadData.value.settings = {};
  }

  if (!hasLoadedBook.value) {
    try {
      book.value = await loadEpub(newVal.productId, newVal.epubUrl);
      if (book.value) {
        checkOutcome.value = await ebook.analyzeEpubFile(book.value);
        postReadData.value.settings.checkOutcome = checkOutcome.value;
        emit('epubCheckEmit', postReadData.value);

        // ✅ 只清理最大的資源：plainBuffer 和 epubBlob（~200MB）
        // ⚠️ 保留 book.value 不動，避免 ePub.js 內部錯誤
        // book 實例主要是元數據（~10-20MB），相對可接受
        epubBlob = null;
        plainBuffer = null;

        isLoading.value = false;
      } else {
        console.error('無法分析EPUB檔案');
        isLoading.value = false;
      }

      hasLoadedBook.value = true;
      isLoading.value = false;
    } catch (error) {
      console.error('載入或分析 EPUB 時發生錯誤：', error);
      isLoading.value = false;
      cleanupResources();
    }
  }
});

// 組件卸載時清理資源
onBeforeUnmount(() => {
  cleanupResources();
});
</script>
<template>
  <ElInfoLoading v-if="isLoading" />
  <div
    class="text-primary flex w-full items-center justify-center bg-gray-300"
    :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
  >
    <div
      class="bg-light-brown flex w-full flex-col items-center justify-center overflow-hidden p-[30px] py-[100px] lg:px-[100px]"
      :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
    >
      <div ref="viewer" class="slow-blur-transition hidden h-full w-full" />
      <div class="text-card-title flex w-full items-center justify-center">
        <div
          class="flex w-full flex-col items-start justify-center rounded-lg border-2 bg-white p-5 md:w-[50vw]"
        >
          <p class="text-page-title">
            epub檔案檢查:
            <span :class="statusClass(checkOutcome?.finalVerifiedOutcome)">
              {{ checkOutcome?.finalVerifiedOutcome }}
            </span>
          </p>
          <p
            class="text-card-title mt-2 mb-2 opacity-0"
            :class="{ 'opacity-100': checkOutcome?.finalVerifiedOutcome === '不通過' }"
          >
            請重新上傳檔案或聯絡客服協助處理
          </p>
          <hr class="border-gray mb-5 w-full border" />
          <p class="mb-5">檢查項目:</p>
          <ul class="space-y-5">
            <li>
              目錄檔 (TOC)：
              <span :class="statusClass(checkOutcome?.tocOutcome)">
                {{ checkOutcome?.tocOutcome }}
              </span>
            </li>
            <li>
              頁序檔 (Spine)：
              <span :class="statusClass(checkOutcome?.spineOutcome)">
                {{ checkOutcome?.spineOutcome }}
              </span>
            </li>
            <li>
              基本資料檔 (Metadata)：
              <span :class="statusClass(checkOutcome?.metadataOutcome)">
                {{ checkOutcome?.metadataOutcome }}
              </span>
            </li>
            <li>
              圖文資源檔 (Manifest)：
              <span :class="statusClass(checkOutcome?.manifestOutcome)">
                {{ checkOutcome?.manifestOutcome }}
              </span>
            </li>
          </ul>
          <ElInfoButton
            class="mt-10 mb-5 w-full py-3 md:py-2"
            :class="{ hidden: checkOutcome?.finalVerifiedOutcome !== '通過' }"
            @click="openEpubReader"
            >觀看電子書</ElInfoButton
          >
        </div>
      </div>
    </div>
  </div>
</template>
