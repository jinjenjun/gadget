<script setup>
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { vuexData } from '@/../store';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';
import ElIconButton from '@/Components/ElIconButton.vue';

const store = useStore();
const props = defineProps({
  bookCardProp: [Array, Object],
});
const emit = defineEmits(['bookCardEmit', 'bookRatingEmit', 'bookReviewEmit']);

const emitInfoCardData = () => {
  emit('bookCardEmit', 'bookCardList元件傳出資料');
};

const emitBookReview = (item) => {
  emit('bookReviewEmit', item);
};

const backgroundImageRatio = ref();
const visibleItems = ref([]);

const titleTransfer = () => {
  if (props?.bookCardProp?.productType === 1) {
    bookCardData.value.progressTitle = '閱讀進度';
  } else if (props?.bookCardProp?.productType === 3) {
    bookCardData.value.progressTitle = '聆聽進度';
  }
};

const buttonNameTransfer = () => {
  if (props?.bookCardProp?.productType === 1) {
    bookCardData.value.finishingButtonName = '閱讀電子書';
  } else if (props?.bookCardProp?.productType === 3) {
    bookCardData.value.finishingButtonName = '聆聽有聲書';
  }
};
const updateVisibleItems = () => {
  visibleItems.value = props.bookCardProp.textContent;
  titleTransfer();
  buttonNameTransfer();
};

const bookCardData = ref({
  progressTitle: '',
  finishingButtonName: '',
});

const watchAllReviews = (data) => {
  vuexData.unlock.headMenu.setMenu(store, {
    startMenuItem: { name: '讀者書評' }
  });
  helpers.forwardRouteBlank(`/book/${ data.id }`);
};

onMounted(() => {
  updateVisibleItems();
});

watch(
  () => props,
  () => {
    updateVisibleItems();
    backgroundImageRatio.value = props?.bookCardProp?.backgroundImageRatio || '3/4';
    helpers.devConsole.log('book card list prop:', props);
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="border-gray grid w-full grid-cols-12">
    <div
      class="border-gray col-span-6 flex flex-col items-start justify-between border-r p-3 pb-5 lg:col-span-4"
      v-for="(item, index) in visibleItems"
      :key="index"
      @click="emitInfoCardData(item)"
    >
      <div class="flex w-full flex-col items-start justify-start overflow-hidden">
        <a
          class="w-full cursor-pointer items-end justify-center rounded bg-cover bg-center bg-no-repeat mb-2"
          :style="{
              backgroundImage: `url(${item.image})`,
              aspectRatio: backgroundImageRatio,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
          @click="helpers.forwardRoute(item.route)"
        />
        <p class="text-card-title mb-2 line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]">
          {{ item.title }}
        </p>
        <p class="mb-2 line-clamp-1 text-sm font-bold">
          {{ bookCardData.progressTitle }} {{ item.readPercentage }} %
        </p>
        <div
          class="border-primary mb-2 flex w-full items-center justify-start overflow-hidden rounded border bg-white"
        >
          <div class="bg-show-success h-[10px]" :style="{ width: item.readProgressBar }"></div>
        </div>
        <a
          class="border-secondary text-card-description mb-3 w-full cursor-pointer rounded border-2 p-1 text-center font-bold"
          @click="helpers.forwardRoute(item.route)"
        >
          <span class="pr-2">{{ bookCardData.finishingButtonName }}</span>
          <i class="ri-arrow-right-s-line text-primary text-card-description text-white" />
        </a>
        <ElIconButton
          :icon-button-prop="{
            name: item.review ? '編輯書評' : '撰寫書評',
            icon: 'ri-pencil-line',
            paddingRight: '5px',
          }"
          class="w-full mb-3"
          @click.stop="emitBookReview(item)"
        />
        <span class="w-full text-end text-xs md:text-sm font-bold underline cursor-pointer" @click="watchAllReviews(item)">觀看全部書評</span>
      </div>
    </div>
  </div>
</template>
