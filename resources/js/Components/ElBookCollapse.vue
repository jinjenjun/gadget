<script setup>
import { onBeforeUnmount, ref, watch } from 'vue';
import ElBookCollapseNode from '@/Components/ElBookCollapseNode.vue';
import { resolveTocHref } from '@/Libs/ebook_toc';
import * as helpers from '@/Libs/helpers';

const props = defineProps({
  toc: {
    type: [Array, String],
    required: true,
  },
  rendition: {
    type: Object,
    required: true,
  },
  spineItems: {
    type: [Array, String],
    required: true,
  },
  chapterLimitIndex: {
    type: Number,
    default: -1,
  },
  scrollModeStatus: {
    type: Boolean,
    required: true,
  },
  allowRelocateHandler: {
    type: Boolean,
    required: true,
  },
  prefetchChapter: {
    type: Function,
    default: null,
  },
  nightModeStatus: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['bookCollapseEmit', 'navigateStart', 'navigateEnd']);

const emitBookCollapseData = () => {
  emit('bookCollapseEmit', pageData);
};

const tocArray = ref([]);
const expandedKeys = ref(new Set());
const activeChapterHref = ref('');

const pageData = ref({
  pageSwitch: true,
  scrollModeStatus: props.scrollModeStatus,
  allowRelocateHandler: true,
  fixedCurrentPage: '',
  tocBuilt: false,
});

const normalizeChapterHref = (href) =>
  String(href || '')
    .split('#')[0]
    .replace(/^(\.\.\/)+/, '')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');

const updateActiveChapterHref = () => {
  const currentHref = props.rendition?.currentLocation?.()?.start?.href || '';
  activeChapterHref.value = normalizeChapterHref(currentHref);
};

const goToChapter = async (href) => {
  if (props.rendition) {
    const resolvedHref = resolveTocHref(href, props.spineItems || []);
    const [rawHref, anchor] = resolvedHref.split('#');
    let normalizedHref = rawHref || resolvedHref;
    normalizedHref = normalizedHref
      .replace(/^(\.\.\/)+/, '')
      .replace(/^\.\//, '')
      .replace(/^\/+/, '');

    const item = props?.spineItems?.find((item) => item.href === normalizedHref);
    if (item) {
      helpers.devConsole.log('page data index:', item.index);
      pageData.value.fixedCurrentPage = item.index + 1;
    }

    pageData.value.allowRelocateHandler = false;
    emitBookCollapseData();
    emit('navigateStart');

    const safeHref = item?.href || normalizedHref;
    const displayHref = anchor ? `${safeHref}#${anchor}` : safeHref;

    try {
      if (typeof props.prefetchChapter === 'function') {
        props.prefetchChapter(safeHref).catch((prefetchError) => {
          helpers.devConsole.warn('章節預抓失敗，改為直接跳轉', prefetchError);
        });
      }
      await props.rendition.display(displayHref);
      activeChapterHref.value = normalizeChapterHref(safeHref);

      if (props.scrollModeStatus) {
        await helpers.delay(500);
        const current = props.rendition.currentLocation()?.start?.percentage ?? 0;
        const corrected = Math.max(current - 0.05, 0);
        await props.rendition.display(corrected);
      }
    } catch (error) {
      if (anchor) {
        try {
          await props.rendition.display(safeHref);
        } catch (fallbackError) {
          console.error('跳轉章節失敗:', fallbackError);
        }
      }
      console.error('跳轉章節失敗:', error);
    } finally {
      emit('navigateEnd');
    }

    setTimeout(() => {
      pageData.value.allowRelocateHandler = true;
      emitBookCollapseData();
    }, 500);
  } else {
    console.warn('目錄列表讀取錯誤');
  }
};

const normalizeTocItems = (items) =>
  items.map((item) => {
    if (!item || typeof item !== 'object') return item;

    const normalized = { ...item };
    if (!normalized.label && normalized.title) normalized.label = normalized.title;
    if (!normalized.title && normalized.label) normalized.title = normalized.label;

    const children = Array.isArray(normalized.children) ? normalized.children : [];
    const subitems = Array.isArray(normalized.subitems) ? normalized.subitems : [];

    if (children.length) {
      normalized.children = normalizeTocItems(children);
    } else if (subitems.length) {
      normalized.children = normalizeTocItems(subitems);
    }

    return normalized;
  });

const hasNestedItems = (items) =>
  items.some((item) => {
    if (!item || typeof item !== 'object') return false;
    if (Array.isArray(item.children) && item.children.length) return true;
    if (Array.isArray(item.subitems) && item.subitems.length) return true;
    return false;
  });

const groupTocByHrefAnchor = (items) => {
  const grouped = [];
  const parentsByBase = new Map();

  const splitHref = (href) => (typeof href === 'string' ? href.split('#')[0] : '');
  const hasAnchor = (href) => typeof href === 'string' && href.includes('#');

  items.forEach((item) => {
    if (!item || typeof item !== 'object') {
      grouped.push(item);
      return;
    }

    const href = item.href || '';
    const base = splitHref(href);

    if (hasAnchor(href)) {
      const parent = parentsByBase.get(base);
      if (parent) {
        if (!Array.isArray(parent.children)) parent.children = [];
        parent.children.push({ ...item });
        return;
      }
    }

    const next = { ...item };
    grouped.push(next);

    if (base && !hasAnchor(href)) {
      parentsByBase.set(base, next);
    }
  });

  return grouped;
};

const buildTocTree = (items) => {
  const normalized = normalizeTocItems(items);
  if (hasNestedItems(normalized)) return normalized;
  return groupTocByHrefAnchor(normalized);
};

const parseToc = (tocValue) => {
  if (!tocValue) {
    tocArray.value = [];
    expandedKeys.value = new Set();
    pageData.value.tocBuilt = false;
    emitBookCollapseData();
    return;
  }

  if (typeof tocValue === 'string') {
    const tocString = tocValue.trim();

    if (tocString.startsWith('<ncx')) {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(tocString, 'application/xml');
      const navPoints = xmlDoc.getElementsByTagName('navPoint');

      const parseNavPoints = (points) => {
        const chapters = [];
        Array.from(points).forEach((point) => {
          const label = point.querySelector('navLabel text').textContent;
          let href = point.querySelector('content').getAttribute('src');

          if (href.startsWith('../')) {
            href = 'Text/' + href.slice(3);
          }

          const children = parseNavPoints(point.getElementsByTagName('navPoint'));
          chapters.push({ label, title: label, href, children });
        });
        return chapters;
      };

      tocArray.value = parseNavPoints(navPoints);
    } else if (tocString.startsWith('<html')) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(tocString, 'text/html');
      const tocLinks = doc.querySelectorAll('a');

      tocArray.value = Array.from(tocLinks).map((link) => {
        let href = link.getAttribute('href');
        if (href.startsWith('../')) {
          href = 'Text/' + href.slice(3);
        }
        return {
          label: link.textContent,
          title: link.textContent,
          href: href,
        };
      });
    }
    pageData.value.tocBuilt = true;
    emitBookCollapseData();
  } else if (Array.isArray(tocValue)) {
    tocArray.value = buildTocTree(tocValue);
    pageData.value.tocBuilt = true;
    emitBookCollapseData();
  }
};

const buildTocKey = (item, index, parentKey = '') => {
  const base = item?.href || item?.label || item?.title || 'toc';
  return `${parentKey}${base}-${index}`;
};

const toggleExpanded = (key) => {
  const next = new Set(expandedKeys.value);
  if (next.has(key)) {
    next.delete(key);
  } else {
    next.add(key);
  }
  expandedKeys.value = next;
};

watch(
  () => props.toc,
  (value) => {
    parseToc(value);
  },
  { immediate: true },
);

watch(
  () => props.rendition,
  (nextRendition, previousRendition) => {
    if (typeof previousRendition?.off === 'function') {
      previousRendition.off('relocated', updateActiveChapterHref);
    }

    if (typeof nextRendition?.on === 'function') {
      nextRendition.on('relocated', updateActiveChapterHref);
      updateActiveChapterHref();
    }
  },
  { immediate: true },
);

onBeforeUnmount(() => {
  if (typeof props.rendition?.off === 'function') {
    props.rendition.off('relocated', updateActiveChapterHref);
  }
});
</script>

<template>
  <div>
    <ElBookCollapseNode
      :items="tocArray"
      :level="0"
      parent-key="toc-"
      :expanded-keys="expandedKeys"
      :build-key="buildTocKey"
      :on-toggle="toggleExpanded"
      :on-select="goToChapter"
      :night-mode-status="nightModeStatus"
      :active-href="activeChapterHref"
    />
  </div>
</template>
