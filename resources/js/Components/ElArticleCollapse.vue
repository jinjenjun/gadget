<script setup>
import { ref } from 'vue';

const props = defineProps({
  articleCollapseProp: [Array, Object],
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
</script>
<template>
  <div
    v-for="(item, index) in props.articleCollapseProp"
    :key="index"
    class="group border-light-gray mb-2 border-b-2"
  >
    <div
      class="text-card-title flex cursor-pointer items-center justify-between px-2 pt-5 pb-3 font-bold"
      @click="toggleChapter(index)"
    >
      <span>{{ item.title }}</span>
      <span
        v-if="item.statement"
        class="inline-block text-xl transition-transform duration-300 md:text-2xl lg:text-3xl"
        :class="{ 'rotate-90': isOpen(index) }"
      >
        <i class="ri-arrow-drop-right-line font-normal" />
      </span>
    </div>

    <transition name="collapse">
      <div v-show="isOpen(index)">
        <div
          class="unit-item text-primary bg-light-brown text-card-description grid grid-cols-2 gap-4 p-5 leading-[1.8]"
        >
          <div class="col-span-2" v-html="item.statement" />
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
