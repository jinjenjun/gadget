<script setup>
import { computed, onMounted, ref } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import * as helpers from '@/Libs/helpers.js';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay, Navigation, Pagination } from 'swiper/modules';
import '@/../scss/main.scss';

const props = defineProps({
  imgSwiperProp: [Array, Object],
});
const emit = defineEmits(['imgSwiperEmit']);

const emitImgSwiperData = () => {
  emit('imgSwiperEmit', 'imgSwiper元件傳出資料');
};

const modules = [Autoplay, Pagination, Navigation];
const onSwiper = () => {
  return true;
};
const onSlideChange = () => {
  return true;
};
const swiperSetting = ref({
  spaceBetween: props.imgSwiperProp.spaceBetween,
  slidesPerView: props.imgSwiperProp.slidesPerViewLg,
  autoplay: props.imgSwiperProp.autoplay || false,
  pagination: {
    clickable: props.imgSwiperProp.pagination.clickable,
  },
  navigation: props.imgSwiperProp.navigation,
});

const slides = computed(() => {
  return Array.isArray(props.imgSwiperProp?.textContent)
    ? props.imgSwiperProp.textContent
    : [];
});
const slidesPerGroup = computed(() => Number(props.imgSwiperProp?.slidesPerGroup ?? 1) || 1);
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
const backgroundImageRatio = ref(props.imgSwiperProp.backgroundImageRatio);
const textHeight = ref(props.imgSwiperProp.textHeightLg);
const updateSwiperItems = () => {
  if (screenWidth.value >= 1024) {
    swiperSetting.value.slidesPerView = props.imgSwiperProp.slidesPerViewLg;
    textHeight.value = props.imgSwiperProp.textHeightLg;
  } else if (screenWidth.value >= 768) {
    swiperSetting.value.slidesPerView = props.imgSwiperProp.slidesPerViewMd;
    textHeight.value = props.imgSwiperProp.textHeightMd;
  } else {
    swiperSetting.value.slidesPerView = props.imgSwiperProp.slidesPerViewSm;
    textHeight.value = props.imgSwiperProp.textHeightSm;
  }
};

const routeForward = (item) => item?.url ? helpers.forwardRouteBlank(item.url) : null;

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
    @click="emitImgSwiperData"
  >
    <swiper-slide v-for="(item, index) in props.imgSwiperProp.textContent" :key="index">
      <div class="flex flex-col" @click="routeForward(item)">
        <div class="rounded overflow-hidden">
          <div class="relative w-full" :style="{ paddingTop: backgroundImageRatio }">
            <img
              class="absolute left-0 top-0 h-full w-full object-cover"
              :src="item.image"
              :alt="item.title || 'image'"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </swiper-slide>
  </swiper>
</template>
