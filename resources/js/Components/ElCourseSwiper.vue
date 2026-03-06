<script setup>
import { computed, ref, onMounted } from 'vue';
import * as helpers from '@/Libs/helpers.js';
import { Swiper, SwiperSlide } from 'swiper/vue';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import '@/../scss/main.scss';

const props = defineProps({
  courseSwiperProp: [Array, Object],
});
const emit = defineEmits(['courseSwiperEmit']);

const emitBookSwiperData = () => {
  emit('courseSwiperEmit', 'courseSwiper元件傳出資料');
};
const modules = [Autoplay, Pagination, Navigation];
const onSwiper = () => {
  return true;
};
const onSlideChange = () => {
  return true;
};

const swiperSetting = ref({
  spaceBetween: props.courseSwiperProp.spaceBetween,
  slidesPerView: props.courseSwiperProp.slidesPerViewLg,
  autoplay: props.courseSwiperProp?.autoplay || false,
  pagination: {
    clickable: props.courseSwiperProp.pagination.clickable,
  },
  navigation: props.courseSwiperProp.navigation,
});

const slides = computed(() => {
  return Array.isArray(props.courseSwiperProp?.textContent)
    ? props.courseSwiperProp.textContent
    : [];
});
const slidesPerGroup = computed(() => Number(props.courseSwiperProp?.slidesPerGroup ?? 1) || 1);
const resolveSlidesPerView = () => {
  const perView = swiperSetting.value.slidesPerView;
  if (typeof perView === 'number') {
    return perView;
  }

  if (perView === 'auto') {
    return slides.value.length || 1;
  }

  return Number(perView) || 1;
};
const shouldLoop = computed(() => {
  const perViewCount = resolveSlidesPerView();
  const minimumSlides = Math.max(perViewCount, slidesPerGroup.value, 2);
  return slides.value.length >= minimumSlides;
});

const handlePublishStatus = (item) => [6, 7].includes(item.publishStatus);

const screenWidth = ref(window.innerWidth);
const backgroundImageRatio = ref(props.courseSwiperProp.backgroundImageRatio);
const textHeight = ref(props.courseSwiperProp.textHeightLg);

const updateSwiperItems = () => {
  if (screenWidth.value >= 1024) {
    swiperSetting.value.slidesPerView = props.courseSwiperProp.slidesPerViewLg;
    textHeight.value = props.courseSwiperProp.textHeightLg;
  } else if (screenWidth.value >= 768) {
    swiperSetting.value.slidesPerView = props.courseSwiperProp.slidesPerViewMd;
    textHeight.value = props.courseSwiperProp.textHeightMd;
  } else {
    swiperSetting.value.slidesPerView = props.courseSwiperProp.slidesPerViewSm;
    textHeight.value = props.courseSwiperProp.textHeightSm;
  }
};

onMounted(() => {
  updateSwiperItems();
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateSwiperItems();
  });
});
</script>

<template>
  <swiper
    @swiper="onSwiper"
    @slideChange="onSlideChange"
    :modules="modules"
    :space-between="swiperSetting.spaceBetween"
    :slides-per-view="swiperSetting.slidesPerView"
    :loop="shouldLoop"
    :autoplay="swiperSetting.autoplay"
    :pagination="swiperSetting.pagination"
    :navigation="swiperSetting.navigation"
    @click="emitBookSwiperData"
  >
    <swiper-slide v-for="(item, index) in props.courseSwiperProp.textContent" :key="index">
      <div class="border-gray mr-px flex flex-col border-r p-3">
        <a
          class="mb-1 block overflow-hidden rounded"
          :href="helpers.generateHref(item)"
          :target="helpers.generateTarget(item)"
        >
          <div class="relative w-full" :style="{ paddingTop: backgroundImageRatio }">
            <img
              class="absolute left-0 top-0 h-full w-full object-cover"
              :src="item.image"
              :alt="item.title || 'course image'"
              loading="lazy"
            />
          </div>
        </a>
        <div class="overflow-hidden" :style="{ height: textHeight }">
          <div class="my-2">
            <ElPopover trigger="click" placement="bottom" :width="100">
              <template #reference>
                <div
                  class="flex h-full w-full cursor-pointer items-start justify-start overflow-hidden truncate"
                >
                  <span
                    class="bg-secondary mr-2 line-clamp-1 inline-block min-w-[58px] whitespace-normal wrap-break-word break-all rounded-sm p-1 text-xs text-white"
                    v-if="!handlePublishStatus(item)"
                    >即將開課</span
                  >
                  <span
                    class="bg-light-brown mr-2 inline-block rounded-sm p-1"
                    v-for="(item, index) in item.tag"
                    :key="index"
                  >
                    <span class="line-clamp-1 whitespace-normal wrap-break-word break-all text-xs">{{
                      item
                    }}</span>
                  </span>
                </div>
              </template>
              <template #default>
                <div class="line-clamp-1 h-full w-full cursor-pointer overflow-hidden">
                  <span
                    class="bg-light-brown m-1 inline-block rounded-sm p-1"
                    v-for="(item, index) in item.tag"
                    :key="index"
                  >
                    <span class="line-clamp-1 whitespace-normal wrap-break-word break-all text-xs">{{
                      item
                    }}</span>
                  </span>
                </div>
              </template>
            </ElPopover>
          </div>

          <div class="mb-2 flex flex-col items-start justify-start">
            <span class="text-card-description line-clamp-1 w-full">講師：{{ item.teacher }}</span>
            <span class="text-card-description">時長：{{ item.duration }}</span>
          </div>
          <a
            :href="helpers.generateHref(item)"
            :target="helpers.generateTarget(item)"
            class="text-card-title mb-2 line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]"
          >
            {{ item.title }}
          </a>
          <div class="flex-col items-center justify-between">
            <span
              class="border-secondary bg-secondary text-card-description my-2 inline-block rounded border-2 p-1 px-2 font-bold text-white"
              >{{ helpers.priceTag(item.salesPrice, item.listPrice) }}</span
            >
            <div class="flex h-[40px] flex-col items-end justify-end md:h-[45px] lg:h-[50px]">
              <a
                :href="helpers.generateHref(item)"
                :target="helpers.generateTarget(item)"
                class="text-xs line-through"
                v-if="helpers.parseNumber(item.listPrice) !== helpers.parseNumber(item.salesPrice)"
              >
                NTD {{ helpers.numberComma(item.listPrice) }}
              </a>
              <a
                :href="helpers.generateHref(item)"
                :target="helpers.generateTarget(item)"
                class="text-card-description font-bold"
              >
                NTD {{ helpers.numberComma(item.salesPrice) }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </swiper-slide>
  </swiper>
</template>
