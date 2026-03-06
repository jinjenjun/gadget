<script setup>
import { ref, onMounted, watch } from 'vue';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';
import ElVideoEmbed from '@/Components/ElVideoEmbed.vue';

const props = defineProps({
  newsCardProp: [Array, Object],
});
const emit = defineEmits(['newsCardEmit']);

const emitNewsCardData = (data) => {
  emit('newsCardEmit', data);
};

const backgroundImageRatio = ref('4/3');
const visibleItems = ref([]);
const updateVisibleItems = () => {
  visibleItems.value = props.newsCardProp.textContent;
};

onMounted(() => {
  updateVisibleItems();
});
watch(
  () => props,
  () => {
    updateVisibleItems();
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div v-if="visibleItems.length === 0" class="text-card-title py-5 md:px-[2px] lg:px-1">
    無相關內容顯示
  </div>
  <div
    class="mb-[40px] grid w-full grid-cols-12 lg:px-[10vw]"
    v-for="(item, index) in visibleItems"
    :key="index"
  >
    <div class="col-span-12 mb-5 md:mb-[40px]" v-if="index !== 0">
      <hr class="border-gray border" />
    </div>
    <div
      class="col-span-12 w-full cursor-pointer flex-col items-start justify-start py-5"
      :class="item?.showType === 'full' ? 'md:col-span-12' : 'md:col-span-8 md:px-[40px] md:py-0'"
      @click="emitNewsCardData(item)"
    >
      <a
        :href="helpers.generateHref(item)"
        :target="helpers.generateTarget(item)"
        class="text-auction-title"
      >
        {{ item.title }}
      </a>
      <div class="w-full flex-col items-center justify-between">
        <span
          class="border-secondary bg-secondary text-card-description my-4 inline-block rounded border-2 px-2 py-1 font-bold text-white"
          >{{ item.categoryTag }}</span
        >
      </div>
      <a
        :href="helpers.generateHref(item)"
        :target="helpers.generateTarget(item)"
        class="text-card-title line-clamp-3 h-[60px] font-normal md:h-[90px] md:py-3 lg:h-[100px] lg:py-5"
        :class="item?.showType === 'full' ? 'hidden' : ''"
      >
        {{ item.description }}
      </a>
      <div class="text-card-title mt-[40px] flex items-center justify-between font-normal">
        <p>
          {{ item.date }}
        </p>
        <p class="cursor-pointer underline">... 繼續閱讀</p>
      </div>
    </div>
    <div
      class="col-span-12 flex items-start justify-center"
      :class="item?.showType === 'full' ? 'mt-2 md:col-span-12' : 'md:col-span-4'"
    >
      <a
        class="w-full items-center justify-center overflow-hidden rounded"
        :href="helpers.generateHref(item)"
        :target="helpers.generateTarget(item)"
        :class="item?.postType === 'article' ? '' : 'hidden'"
      >
        <img
          class="w-full cursor-pointer"
          :src="item.image"
          :alt="item.title || 'category image'"
          loading="lazy"
          @click="emitNewsCardData(item)"
        />
      </a>
      <ElVideoEmbed :url="item.video" :class="item?.postType === 'video' ? '' : 'hidden'" />
    </div>
  </div>
</template>
