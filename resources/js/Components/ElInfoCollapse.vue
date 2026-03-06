<script setup>
import { ref } from 'vue';
import '@/../scss/main.scss';

const props = defineProps({
  infoCollapseProp: [Array, Object],
});

const emit = defineEmits(['InfoCollapseEmit']);
const openChapters = ref([]);

const toggleChapter = (index) => {
  if (openChapters.value.includes(index)) {
    openChapters.value = openChapters.value.filter((i) => i !== index);
  } else {
    openChapters.value.push(index);
  }
};

const isOpen = (index) => openChapters.value.includes(index);

const durationTransfer = (d) => {
  if (d == null || isNaN(d) || d <= 0) return '尚無資料';
  if (d >= 3600 * 999) return '999+ 小時';

  const hours = String(Math.floor(d / 3600)).padStart(2, '0');
  const minutes = String(Math.floor((d % 3600) / 60)).padStart(2, '0');
  const seconds = String(d % 60).padStart(2, '0');

  return `${hours}:${minutes}:${seconds}`;
};
</script>

<template>
  <div
    v-for="(chapter, chapterIndex) in props.infoCollapseProp"
    :key="chapterIndex"
    class="group border-light-gray mb-2 border-b-2"
  >
    <div
      class="text-card-title flex cursor-pointer items-center justify-between px-2 pt-5 pb-3 font-bold"
      @click="toggleChapter(chapterIndex)"
    >
      <span>{{ chapter.title }}</span>
      <span
        v-if="chapter.units.length"
        class="inline-block text-xl transition-transform duration-300 md:text-2xl lg:text-3xl"
        :class="{ 'rotate-90': isOpen(chapterIndex) }"
      >
        <i class="ri-arrow-drop-right-line font-normal" />
      </span>
    </div>

    <transition name="collapse">
      <div v-show="isOpen(chapterIndex)">
        <div
          v-for="(unit, unitIndex) in chapter.units"
          :key="unitIndex"
          class="unit-item text-card-title text-primary bg-light-brown grid grid-cols-2 gap-4 px-2 py-5 leading-[1.8]"
        >
          <div class="col-span-1 wrap-break-word break-all whitespace-normal">
            <p class="mr-5">單元{{ unitIndex + 1 }} - {{ unit.title }}</p>
          </div>
          <div class="col-span-1">
            <p>| 時間：{{ durationTransfer(unit.duration) }}</p>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.collapse-enter-active,
.collapse-leave-active {
  transition:
    max-height 0.5s ease,
    opacity 0.5s ease;
  overflow: hidden;
}
.collapse-enter-from,
.collapse-leave-to {
  max-height: 0;
  opacity: 0;
}
.collapse-enter-to,
.collapse-leave-from {
  max-height: 500px;
  opacity: 1;
}
</style>
