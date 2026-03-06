<script setup>
import { computed, ref, onMounted } from 'vue';
import * as helpers from '@/Libs/helpers.js';
import { Swiper, SwiperSlide } from 'swiper/vue';
import ElVideoEmbed from '@/Components/ElVideoEmbed.vue';
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';
import '@/../scss/main.scss';

const props = defineProps({
  newsSwiperProp: [Array, Object],
});
const emit = defineEmits(['newsSwiperEmit']);

const emitNewsSwiperData = () => {
  emit('newsSwiperEmit', 'newsSwiper元件傳出資料');
};

const modules = [Autoplay, Pagination, Navigation];
const onSwiper = () => {
  return true;
};
const onSlideChange = () => {
  return true;
};
const swiperSetting = ref({
  spaceBetween: props.newsSwiperProp.spaceBetween,
  slidesPerView: props.newsSwiperProp.slidesPerViewLg,
  autoplay: props.newsSwiperProp?.autoplay || false,
  pagination: {
    clickable: props.newsSwiperProp.pagination.clickable,
  },
  navigation: props.newsSwiperProp.navigation,
});

const slides = computed(() => {
  return Array.isArray(props.newsSwiperProp?.textContent) ? props.newsSwiperProp.textContent : [];
});
const slidesPerGroup = computed(() => Number(props.newsSwiperProp?.slidesPerGroup ?? 1) || 1);
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
const textHeight = ref(props.newsSwiperProp.textHeightLg);
const updateSwiperItems = () => {
  if (screenWidth.value >= 1024) {
    swiperSetting.value.slidesPerView = props.newsSwiperProp.slidesPerViewLg;
    textHeight.value = props.newsSwiperProp.textHeightLg;
  } else if (screenWidth.value >= 768) {
    swiperSetting.value.slidesPerView = props.newsSwiperProp.slidesPerViewMd;
    textHeight.value = props.newsSwiperProp.textHeightMd;
  } else {
    swiperSetting.value.slidesPerView = props.newsSwiperProp.slidesPerViewSm;
    textHeight.value = props.newsSwiperProp.textHeightSm;
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
  <div v-if="slides.length === 0" class="text-card-title p-5">無相關內容顯示</div>
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
    @click="emitNewsSwiperData"
  >
    <swiper-slide v-for="(item, index) in slides" :key="index">
      <div class="border-gray mr-px flex flex-col border-r p-3">
        <div
          class="mb-1 block overflow-hidden rounded"
          :class="item?.postType === 'article' ? '' : 'hidden'"
          @click="helpers.forwardRouteBlank(item.route)"
        >
          <div class="relative w-full" :style="{ paddingTop: item.backgroundImageRatio }">
            <img
              class="absolute top-0 left-0 h-full w-full object-cover"
              :src="item.image"
              :alt="item.title || 'info image'"
              loading="lazy"
            />
          </div>
        </div>
        <div
          class="mb-1 block overflow-hidden rounded"
          :class="item?.postType === 'video' ? '' : 'hidden'"
        >
          <div class="relative w-full" :style="{ paddingTop: item.backgroundImageRatio }">
            <ElVideoEmbed
              class="absolute top-0 left-0 h-full w-full object-cover"
              :url="item.video"
            />
          </div>
        </div>
        <div class="overflow-hidden" :style="{ height: textHeight }">
          <div class="my-2">
            <span class="bg-light-brown mr-2 inline-block rounded-sm p-1 text-xs">
              <span class="line-clamp-1 text-xs">{{ item.tag }}</span>
            </span>
          </div>
          <p
            class="text-card-title mb-2 line-clamp-2 h-[40px] cursor-pointer md:h-[50px] lg:h-[55px]"
            @click="helpers.forwardRouteBlank(item.route)"
          >
            {{ item.title }}
          </p>
          <div
            class="text-card-description mt-5 flex w-full cursor-pointer items-end justify-end font-bold underline"
            @click="helpers.forwardRouteBlank(item.route)"
          >
            <div>閱讀全文</div>
          </div>
        </div>
      </div>
    </swiper-slide>
  </swiper>
</template>
