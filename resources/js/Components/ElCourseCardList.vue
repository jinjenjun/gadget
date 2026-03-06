<script setup>
import { ref, onMounted, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';
import ElInfoBookmark from '@/Components/ElInfoBookmark.vue';

const props = defineProps({
  courseCardProp: [Array, Object],
});
const emit = defineEmits(['courseCardEmit']);

const emitInfoCardData = () => {
  emit('courseCardEmit', 'courseCardList元件傳出資料');
};

const emitInfoBookmark = (data) => {
  if (data.isReacted === false) {
    router.reload();
  }
};

const screenWidth = ref(window.innerWidth);
const backgroundImageRatio = ref();
const visibleItems = ref([]);
const backgroundImageHeight = ref(props.courseCardProp.backgroundImageHeightLg);
const updateVisibleItems = () => {
  if (screenWidth.value >= 1024) {
    visibleItems.value = props.courseCardProp.textContent;
    backgroundImageHeight.value = props.courseCardProp.backgroundImageHeightLg;
  } else if (screenWidth.value >= 768) {
    visibleItems.value = props.courseCardProp.textContent;
    backgroundImageHeight.value = props.courseCardProp.backgroundImageHeightMd;
  } else {
    visibleItems.value = props.courseCardProp.textContent;
    backgroundImageHeight.value = props.courseCardProp.backgroundImageHeightSm;
  }
};

onMounted(() => {
  helpers.devConsole.log('course card list:', props.courseCardProp);
  updateVisibleItems();
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateVisibleItems();
  });
});
watch(
  () => props,
  () => {
    updateVisibleItems();
    backgroundImageRatio.value = props?.courseCardProp?.backgroundImageRatio || '4/3';
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="border-gray grid w-full grid-cols-12">
    <div
      class="border-gray relative col-span-6 cursor-pointer border-r p-3 pb-5 lg:col-span-4"
      v-for="(item, index) in visibleItems"
      :key="index"
      @click="emitInfoCardData(item)"
    >
      <ElInfoBookmark
        class="absolute right-5 top-5 z-10"
        :modelType="item.modelType"
        :modelId="String(item.id)"
        type="bg-circle"
        @info-bookmark-emit="emitInfoBookmark"
        v-if="item.bookmarkStatus"
      />
      <div
        class="flex w-full items-end justify-center rounded bg-cover bg-center bg-no-repeat"
        :style="{
          backgroundImage: `url(${item.image})`,
          aspectRatio: backgroundImageRatio,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }"
        @click="helpers.forwardRoute(item?.link)"
      />
      <div class="overflow-hidden">
        <div class="my-2">
          <ElPopover trigger="click" placement="bottom" :width="100">
            <template #reference>
              <div class="h-full w-full cursor-pointer overflow-hidden truncate">
                <span
                  v-for="(item, index) in item.tag"
                  :key="index"
                  class="bg-light-brown mr-2 inline-block rounded-sm p-1 text-xs"
                >
                  <span class="line-clamp-1 text-xs">{{ item }}</span>
                </span>
              </div>
            </template>
            <template #default>
              <div class="h-full w-full cursor-pointer overflow-hidden">
                <span
                  v-for="(item, index) in item.tag"
                  :key="index"
                  class="bg-light-brown m-1 inline-block rounded-sm p-1 text-xs"
                >
                  <span class="text-xs">{{ item }}</span>
                </span>
              </div>
            </template>
          </ElPopover>
        </div>
        <div
          class="text-card-title mb-2 line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]"
          @click="helpers.forwardRoute(item.link)"
        >
          {{ item.title }}
        </div>
        <!--        <div-->
        <!--          class="mb-2 line-clamp-3 whitespace-normal wrap-break-word break-all text-xs lg:text-base"-->
        <!--          @click="helpers.forwardRoute(item.link)"-->
        <!--        >-->
        <!--          時間：{{ item.duration }}-->
        <!--        </div>-->

        <div class="flex w-full flex-col items-start justify-start overflow-hidden">
          <p class="mt-2 line-clamp-1 text-sm font-bold">{{ item.readPercentage }} %</p>

          <div
            class="border-primary mt-2 flex w-full items-center justify-start overflow-hidden rounded border bg-white"
          >
            <div class="bg-show-success h-[10px]" :style="{ width: item.readProgressBar }"></div>
          </div>
          <a
            class="border-secondary text-card-description mt-2 w-full cursor-pointer rounded border-2 p-1 text-center font-bold"
            @click="helpers.forwardRoute(item.link)"
          >
            <span class="pr-2">進入課程</span>
            <i class="ri-arrow-right-s-line text-primary text-card-description text-white" />
          </a>
        </div>
      </div>
    </div>
  </div>
</template>
