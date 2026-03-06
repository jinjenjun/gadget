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
  postSwiperProp: [Array, Object],
});
const emit = defineEmits(['postSwiperEmit']);

const emitSerialSwiperData = () => {
  emit('postSwiperEmit', 'serialSwiper元件傳出資料');
};
const modules = [Autoplay, Pagination, Navigation];
const onSwiper = () => {
  return true;
};
const onSlideChange = () => {
  return true;
};

const swiperSetting = ref({
  spaceBetween: props.postSwiperProp.spaceBetween,
  slidesPerView: props.postSwiperProp.slidesPerViewLg,
  autoplay: props.postSwiperProp?.autoplay || false,
  pagination: {
    clickable: props.postSwiperProp.pagination.clickable,
  },
  navigation: props.postSwiperProp.navigation,
});

const slides = computed(() => {
  return Array.isArray(props.postSwiperProp?.textContent)
    ? props.postSwiperProp.textContent
    : [];
});
const slidesPerGroup = computed(() => Number(props.postSwiperProp?.slidesPerGroup ?? 1) || 1);
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
const backgroundImageRatio = ref(props.postSwiperProp.backgroundImageRatio);
const textHeight = ref(props.postSwiperProp.textHeightLg);
const updateSwiperItems = () => {
  if (screenWidth.value >= 1024) {
    swiperSetting.value.slidesPerView = props.postSwiperProp.slidesPerViewLg;
    textHeight.value = props.postSwiperProp.textHeightLg;
  } else if (screenWidth.value >= 768) {
    swiperSetting.value.slidesPerView = props.postSwiperProp.slidesPerViewMd;
    textHeight.value = props.postSwiperProp.textHeightMd;
  } else {
    swiperSetting.value.slidesPerView = props.postSwiperProp.slidesPerViewSm;
    textHeight.value = props.postSwiperProp.textHeightSm;
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
    @click="emitSerialSwiperData"
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
              :alt="item.title || 'post image'"
              loading="lazy"
            />
          </div>
        </a>
        <div class="overflow-hidden" :style="{ height: textHeight }">
          <div class="mt-2 flex items-start justify-start">
            <span
              class="bg-light-brown mr-2 block w-[60px] shrink-0 truncate rounded-sm p-1 text-center text-xs font-bold lg:mt-1"
              >{{ item.tag }}</span
            >
            <a
              :href="helpers.generateHref(item)"
              :target="helpers.generateTarget(item)"
              class="text-card-title line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]"
            >
              {{ item.title }}
            </a>
          </div>

          <div class="mb-2 flex items-center justify-start">
            <span
              class="border-secondary mr-2 block w-[60px] shrink-0 truncate rounded-sm border p-1 text-center text-xs font-bold"
              >類別</span
            >
            <div class="text-card-description line-clamp-1 overflow-hidden font-bold">
              {{ item.category }}
            </div>
          </div>

          <div class="mb-2 flex items-center justify-start">
            <span
              class="border-secondary mr-2 block w-[60px] shrink-0 truncate rounded-sm border p-1 text-center text-xs font-bold"
              >作者</span
            >
            <a
              :href="helpers.generateHref(item)"
              :target="helpers.generateTarget(item)"
              class="text-card-description line-clamp-1 overflow-hidden font-bold"
            >
              {{ item.author }}
            </a>
          </div>

          <div class="mb-1 flex items-start justify-start">
            <span
              class="border-secondary mr-2 block w-[60px] shrink-0 truncate rounded-sm border p-1 text-center text-xs font-bold"
              >作品介紹</span
            >
            <a
              :href="helpers.generateHref(item)"
              :target="helpers.generateTarget(item)"
              class="text-card-description line-clamp-2 overflow-hidden leading-snug"
            >
              {{ item.description }}
            </a>
          </div>
        </div>
      </div>
    </swiper-slide>
  </swiper>
</template>
