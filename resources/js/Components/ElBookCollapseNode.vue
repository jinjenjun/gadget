<script setup>
defineOptions({ name: 'ElBookCollapseNode' });

const props = defineProps({
  items: {
    type: Array,
    required: true,
  },
  level: {
    type: Number,
    default: 0,
  },
  parentKey: {
    type: String,
    default: '',
  },
  expandedKeys: {
    type: Object,
    required: true,
  },
  buildKey: {
    type: Function,
    required: true,
  },
  onToggle: {
    type: Function,
    required: true,
  },
  onSelect: {
    type: Function,
    required: true,
  },
  nightModeStatus: {
    type: Boolean,
    default: false,
  },
  activeHref: {
    type: String,
    default: '',
  },
});

const getChildren = (item) => {
  if (Array.isArray(item?.children) && item.children.length) return item.children;
  if (Array.isArray(item?.subitems) && item.subitems.length) return item.subitems;
  return [];
};
const hasChildren = (item) => getChildren(item).length > 0;
const itemKey = (item, index) => props.buildKey(item, index, props.parentKey);
const isExpanded = (key) => props.expandedKeys.has(key);

const handleSelect = (item) => {
  if (!item?.href) return;
  props.onSelect(item.href);
};

const toggleItem = (key) => {
  props.onToggle(key);
};

const normalizeChapterHref = (href) =>
  String(href || '')
    .split('#')[0]
    .replace(/^(\.\.\/)+/, '')
    .replace(/^\.\//, '')
    .replace(/^\/+/, '');

const isActiveChapter = (item) => {
  if (!item?.href || !props.activeHref) {
    return false;
  }

  return normalizeChapterHref(item.href) === normalizeChapterHref(props.activeHref);
};
</script>

<template>
  <div v-for="(chapter, index) in items" :key="itemKey(chapter, index)">
    <div
      class="epub-toc-row flex w-full items-center justify-between gap-2 border-b px-2 py-4"
      :class="{
        'is-dark': nightModeStatus,
        'is-active': isActiveChapter(chapter),
      }"
      :style="{ paddingLeft: `${level * 16}px` }"
    >
      <button
        class="epub-toc-item text-card-title flex-1 bg-transparent p-0 text-left leading-[1.8]"
        type="button"
        @click="handleSelect(chapter)"
      >
        {{ chapter.label || chapter.title || chapter.href || '章節' }}
      </button>
      <button
        v-if="hasChildren(chapter)"
        class="epub-toc-toggle text-card-title flex h-6 w-6 items-center justify-center rounded-full border text-sm"
        type="button"
        @click.stop="toggleItem(itemKey(chapter, index))"
      >
        <svg
          v-if="isExpanded(itemKey(chapter, index))"
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
        </svg>
        <svg
          v-else
          class="h-3.5 w-3.5"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-linecap="round"
          stroke-linejoin="round"
          stroke-width="2"
          aria-hidden="true"
        >
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>
    </div>

    <transition name="collapse">
      <div v-show="hasChildren(chapter) && isExpanded(itemKey(chapter, index))" class="pb-1">
        <ElBookCollapseNode
          :items="getChildren(chapter)"
          :level="level + 1"
          :parent-key="`${itemKey(chapter, index)}-`"
          :expanded-keys="expandedKeys"
          :build-key="buildKey"
          :on-toggle="onToggle"
          :on-select="onSelect"
          :night-mode-status="nightModeStatus"
          :active-href="activeHref"
        />
      </div>
    </transition>
  </div>
</template>

<style scoped>
.epub-toc-row {
  border-color: #e4e4e7;
  color: #4b2c25;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    border-color 0.18s ease;
}

.epub-toc-row:hover {
  background-color: #f3f4f6;
  color: #d55928;
}

.epub-toc-item {
  border: 0;
  background: transparent;
  color: inherit !important;
  cursor: pointer;
}

.epub-toc-item:focus-visible {
  outline: 2px solid rgba(213, 89, 40, 0.6);
  outline-offset: 2px;
  border-radius: 4px;
}

.epub-toc-toggle {
  border-color: #d1d5db;
  background-color: transparent;
  color: inherit !important;
  cursor: pointer;
  transition:
    background-color 0.18s ease,
    border-color 0.18s ease,
    color 0.18s ease;
}

.epub-toc-toggle:hover {
  background-color: #e5e7eb;
}

.epub-toc-row.is-active {
  background-color: #e7eaee;
}

.epub-toc-row.is-active .epub-toc-item {
  font-weight: 700;
  color: #1f2937 !important;
}

.epub-toc-row.is-dark {
  border-color: #617082;
  color: #eef3fa;
}

.epub-toc-row.is-dark:hover {
  background-color: rgba(86, 100, 114, 0.65);
  color: #ffffff;
}

.epub-toc-row.is-dark .epub-toc-toggle {
  border-color: #738294;
  background-color: rgba(86, 100, 114, 0.42);
}

.epub-toc-row.is-dark .epub-toc-toggle:hover {
  background-color: rgba(107, 122, 139, 0.78);
}

.epub-toc-row.is-dark.is-active {
  background-color: rgba(98, 113, 129, 0.95);
}

.epub-toc-row.is-dark.is-active .epub-toc-item {
  color: #ffffff !important;
}

.collapse-enter-active,
.collapse-leave-active {
  transition:
    max-height 0.3s ease,
    opacity 0.3s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  max-height: 700px;
  opacity: 1;
}
</style>
