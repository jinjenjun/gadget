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
  infoSwiperProp: [Array, Object],
});
const emit = defineEmits(['infoSwiperEmit']);

const emitInfoSwiperData = () => {
  emit('infoSwiperEmit', 'infoSwiper元件傳出資料');
};

const modules = [Autoplay, Pagination, Navigation];
const onSwiper = () => {
  return true;
};
const onSlideChange = () => {
  return true;
};
const swiperSetting = ref({
  spaceBetween: props.infoSwiperProp.spaceBetween,
  slidesPerView: props.infoSwiperProp.slidesPerViewLg,
  autoplay: props.infoSwiperProp?.autoplay || false,
  pagination: {
    clickable: props.infoSwiperProp.pagination.clickable,
  },
  navigation: props.infoSwiperProp.navigation,
});

const slides = computed(() => {
  return Array.isArray(props.infoSwiperProp?.textContent)
    ? props.infoSwiperProp.textContent
    : [];
});
const slidesPerGroup = computed(() => Number(props.infoSwiperProp?.slidesPerGroup ?? 1) || 1);
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

const screenWidth = ref(window.innerWidth);
const backgroundImageRatio = ref(props.infoSwiperProp.backgroundImageRatio);
const textHeight = ref(props.infoSwiperProp.textHeightLg);
const updateSwiperItems = () => {
  if (screenWidth.value >= 1024) {
    swiperSetting.value.slidesPerView = props.infoSwiperProp.slidesPerViewLg;
    textHeight.value = props.infoSwiperProp.textHeightLg;
  } else if (screenWidth.value >= 768) {
    swiperSetting.value.slidesPerView = props.infoSwiperProp.slidesPerViewMd;
    textHeight.value = props.infoSwiperProp.textHeightMd;
  } else {
    swiperSetting.value.slidesPerView = props.infoSwiperProp.slidesPerViewSm;
    textHeight.value = props.infoSwiperProp.textHeightSm;
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
    @click="emitInfoSwiperData"
  >
    <swiper-slide v-for="(item, index) in slides" :key="index">
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
              :alt="item.title || 'info image'"
              loading="lazy"
            />
          </div>
        </a>
        <div class="overflow-hidden" :style="{ height: textHeight }">
          <div class="my-2">
            <ElPopover trigger="click" placement="bottom" :width="100">
              <template #reference>
                <div class="h-full w-full cursor-pointer overflow-hidden truncate">
                  <span
                    class="bg-light-brown mr-2 inline-block rounded-sm p-1 text-xs"
                    v-for="(item, index) in item.tag"
                    :key="index"
                  >
                    <span class="line-clamp-1 text-xs">{{ item }}</span>
                  </span>
                </div>
              </template>
              <template #default>
                <div class="h-full w-full cursor-pointer overflow-hidden">
                  <span
                    class="bg-light-brown m-1 inline-block rounded-sm p-1 text-xs"
                    v-for="(item, index) in item.tag"
                    :key="index"
                  >
                    <span class="text-xs">{{ item }}</span>
                  </span>
                </div>
              </template>
            </ElPopover>
          </div>
          <a
            :href="helpers.generateHref(item)"
            :target="helpers.generateTarget(item)"
            class="text-card-title mb-2 line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]"
          >
            {{ item.title }}
          </a>
          <a
            :href="helpers.generateHref(item)"
            :target="helpers.generateTarget(item)"
            class="mb-2 line-clamp-3 whitespace-normal wrap-break-word break-all text-xs lg:text-base"
            >{{ item.description }}</a
          >
          <div class="py-3">
            <ElPopover trigger="click" placement="bottom" :width="100">
              <template #reference>
                <div class="w-full cursor-pointer overflow-hidden truncate">
                  <span class="mr-2" v-for="(item, index) in item.hashtag" :key="index">
                    <span class="text-secondary text-xs lg:text-base">#</span>
                    <span class="text-xs lg:text-base">{{ item }}</span>
                  </span>
                </div>
              </template>
              <template #default>
                <div class="w-full cursor-pointer overflow-hidden">
                  <span class="m-1" v-for="(item, index) in item.hashtag" :key="index">
                    <span class="text-secondary text-xs lg:text-base">#</span>
                    <span class="text-xs lg:text-base">{{ item }}</span>
                  </span>
                </div>
              </template>
            </ElPopover>
          </div>
        </div>
      </div>
    </swiper-slide>
  </swiper>
</template>
