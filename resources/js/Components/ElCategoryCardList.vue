<script setup>
import { ref, onMounted, watch } from 'vue';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';
import ElVideoEmbed from '@/Components/ElVideoEmbed.vue';

const props = defineProps({
  categoryCardProp: [Array, Object],
});
const emit = defineEmits(['categoryCardEmit']);

const emitCategoryCardData = () => {
  emit('categoryCardEmit', 'categoryCardList元件傳出資料');
};

const screenWidth = ref(window.innerWidth);
const backgroundImageRatio = ref();

const videoData = ref({
  title: '精彩影片介紹',
  url: '',
  width: '50vw',
  active: false,
});

const visibleItems = ref([]);

const openVideoModal = (subItem, subIndex, videoLength) => {
  let videoIndex;
  videoLength > 1 ? (videoIndex = subIndex + 1) : (videoIndex = '');
  videoData.value.title = `精彩影片介紹 ${videoIndex}`;
  videoData.value.url = subItem;
  videoData.value.active = true;
};

const handleProductType = (item) => {
  if (item.productType === 1) {
    return '電子書';
  } else if (item.productType === 3) {
    return '有聲書';
  } else if (item.productType === 4) {
    return '課程';
  } else if (item.productType === 5) {
    return '點數卡';
  } else {
    return '產品';
  }
};

const updateVisibleItems = () => {
  visibleItems.value = props.categoryCardProp.textContent;
  if (screenWidth.value >= 1024) {
    videoData.value.width = '50vw';
  } else if (screenWidth.value >= 768) {
    videoData.value.width = '80vw';
  } else {
    videoData.value.width = '90vw';
  }
};

onMounted(() => {
  updateVisibleItems();
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateVisibleItems();
  });
  helpers.devConsole.log('categoryCardProp: ', props.categoryCardProp);
});

watch(
  () => videoData.value.active,
  (newValue) => {
    !newValue ? (videoData.value.url = '') : null;
  },
);

watch(
  () => props,
  () => {
    updateVisibleItems();
    backgroundImageRatio.value = props?.categoryCardProp?.backgroundImageRatio || '3/4';
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div v-if="visibleItems.length === 0" class="text-card-title py-5 md:px-[2px] lg:px-1">
    無相關內容顯示
  </div>
  <div class="border-gray grid w-full grid-cols-12 border-l">
    <div
      class="border-gray col-span-6 flex flex-col items-end justify-between border-r px-3 pb-5 md:col-span-4 lg:col-span-3"
      :class="props.categoryCardProp.showRank ? 'pt-0' : 'pt-3'"
      v-for="(item, index) in visibleItems"
      :key="index"
      @click="emitCategoryCardData(item)"
    >
      <div class="flex w-full flex-col items-start justify-start">
        <div
          class="text-card-title pb-2"
          :class="{ 'opacity-0': index > 2 }"
          v-if="props.categoryCardProp.showRank"
        >
          NO. <span class="text-secondary text-xl md:text-2xl lg:text-3xl"> {{ index + 1 }} </span>
        </div>
        <a
          class="mb-2 flex w-full items-end justify-center overflow-hidden rounded"
          :href="helpers.generateHref(item)"
          :target="helpers.generateTarget(item)"
        >
          <img
            class="h-full w-full object-cover"
            :style="{ aspectRatio: backgroundImageRatio }"
            :src="item.image"
            :alt="item.title || 'category image'"
            loading="lazy"
          />
        </a>
        <div
          class="text-primary border-gray bg-light-brown my-2 inline-block rounded border-2 p-1 text-xs font-bold"
          v-if="props.categoryCardProp.showProductType"
        >
          {{ handleProductType(item) }}
        </div>
        <a
          :href="helpers.generateHref(item)"
          :target="helpers.generateTarget(item)"
          class="text-card-title mt-2 line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]"
        >
          {{ item.title }}
        </a>
        <div v-if="item.teacher" class="text-secondary mb-1 text-sm font-medium">
          {{ item.teacher }}
        </div>
        <div class="w-full flex-col items-center justify-between">
          <span
            class="border-secondary bg-secondary text-card-description my-4 inline-block rounded border-2 px-2 py-1 font-bold text-white"
            >{{ helpers.priceTag(item.listPrice, item.salesPrice) }}</span
          >
          <div class="flex h-[50px] flex-col items-end justify-end">
            <a
              :href="helpers.generateHref(item)"
              :target="helpers.generateTarget(item)"
              class="text-sm line-through"
              v-if="Number(item.listPrice) !== Number(item.salesPrice)"
            >
              NTD {{ helpers.numberComma(item.listPrice) }}
            </a>
            <a
              :href="helpers.generateHref(item)"
              :target="helpers.generateTarget(item)"
              class="text-card-description text-base font-bold"
            >
              NTD {{ helpers.numberComma(item.salesPrice) }}
            </a>
          </div>
        </div>
        <div class="my-2">
          <ElPopover trigger="click" placement="bottom" :width="100">
            <template #reference>
              <div class="line-clamp-1 h-full w-full cursor-pointer overflow-hidden">
                <span
                  class="border-secondary mr-2 inline-block rounded-sm border p-1"
                  v-for="(item, index) in item.event"
                  :key="index"
                >
                  <span class="line-clamp-1 text-xs font-bold">{{ item.title }}</span>
                </span>
              </div>
            </template>
            <template #default>
              <div class="h-full w-full cursor-pointer overflow-hidden">
                <span
                  class="border-secondary m-1 inline-block rounded-sm border p-1"
                  v-for="(item, index) in item.event"
                  :key="index"
                >
                  <span class="text-xs font-bold">{{ item.title }}</span>
                </span>
              </div>
            </template>
          </ElPopover>
        </div>
      </div>
      <div class="flex h-full w-full flex-col items-start justify-end">
        <div v-for="(subItem, subIndex) in item?.video" :key="subIndex">
          <div
            class="mt-2 flex cursor-pointer items-center justify-start"
            @click="openVideoModal(subItem, subIndex, item?.video?.length)"
          >
            <i class="ri-youtube-fill color-alert-danger text-2xl" />
            <p class="line-clamp-1 text-base font-bold">
              精彩影片介紹 <span v-if="item?.video?.length > 1">{{ subIndex + 1 }}</span>
            </p>
          </div>
        </div>
        <a
          class="border-secondary mt-2 flex w-full items-center justify-center rounded border-2 p-2"
          :href="helpers.generateHref(item)"
          :target="helpers.generateTarget(item)"
        >
          <p class="text-card-description pr-2 font-bold">前往購買</p>
          <i class="ri-arrow-right-s-line text-primary text-sm text-white" />
        </a>
      </div>
    </div>
  </div>
  <teleport to="body">
    <ElDialog
      v-model="videoData.active"
      :title="videoData.title"
      :close-on-click-modal="false"
      :width="videoData.width"
    >
      <ElVideoEmbed :url="videoData.url" />
    </ElDialog>
  </teleport>
</template>
