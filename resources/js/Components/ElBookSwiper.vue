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
  bookSwiperProp: [Array, Object],
});
const emit = defineEmits(['bookSwiperEmit']);

const emitBookSwiperData = () => {
  emit('bookSwiperEmit', 'bookSwiper元件傳出資料');
};
const modules = [Autoplay, Pagination, Navigation];
const onSwiper = () => {
  return true;
};
const onSlideChange = () => {
  return true;
};

const swiperSetting = ref({
  spaceBetween: props.bookSwiperProp.spaceBetween,
  slidesPerView: props.bookSwiperProp.slidesPerViewLg,
  autoplay: props.bookSwiperProp?.autoplay || false,
  pagination: {
    clickable: props.bookSwiperProp.pagination.clickable,
  },
  navigation: props.bookSwiperProp.navigation,
});

const slides = computed(() => {
  return Array.isArray(props.bookSwiperProp?.textContent) ? props.bookSwiperProp.textContent : [];
});
const slidesPerGroup = computed(() => Number(props.bookSwiperProp?.slidesPerGroup ?? 1) || 1);
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
const backgroundImageRatio = ref(props.bookSwiperProp.backgroundImageRatio);
const textHeight = ref(props.bookSwiperProp.textHeightLg);
const updateSwiperItems = () => {
  if (screenWidth.value >= 1024) {
    swiperSetting.value.slidesPerView = props.bookSwiperProp.slidesPerViewLg;
    textHeight.value = props.bookSwiperProp.textHeightLg;
  } else if (screenWidth.value >= 768) {
    swiperSetting.value.slidesPerView = props.bookSwiperProp.slidesPerViewMd;
    textHeight.value = props.bookSwiperProp.textHeightMd;
  } else {
    swiperSetting.value.slidesPerView = props.bookSwiperProp.slidesPerViewSm;
    textHeight.value = props.bookSwiperProp.textHeightSm;
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
    @click="emitBookSwiperData"
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
              :alt="item.title || 'book image'"
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
                    class="bg-light-brown mr-2 inline-block rounded-sm px-1"
                    v-for="(item, index) in item.category"
                    :key="index"
                  >
                    <span class="text-xs">{{ item.name }}</span>
                  </span>
                </div>
              </template>
              <template #default>
                <div class="h-full w-full cursor-pointer overflow-hidden">
                  <span
                    class="bg-light-brown m-1 inline-block rounded-sm p-1"
                    v-for="(item, index) in item.category"
                    :key="index"
                  >
                    <span class="text-xs">{{ item.name }}</span>
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
          <div class="my-2">
            <ElPopover trigger="click" placement="bottom" :width="100">
              <template #reference>
                <div class="h-full w-full cursor-pointer overflow-hidden truncate">
                  <span
                    class="border-secondary mr-2 inline-block rounded-sm border p-1"
                    v-for="(item, index) in item.event"
                    :key="index"
                  >
                    <span class="line-clamp-1 text-xs">{{ item.title }}</span>
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
                    <span class="text-xs">{{ item.title }}</span>
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
