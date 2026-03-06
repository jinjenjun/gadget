<script setup>
import { onMounted, ref } from 'vue';
import * as helpers from '@/Libs/helpers.js';
import '@/../scss/main.scss';

const props = defineProps({
  infoRowProp: [Array, Object],
});
const emit = defineEmits(['infoRowEmit']);

const emitInfoRowData = () => {
  emit('infoRowEmit', 'infoRow元件傳出資料');
};

const screenWidth = ref(window.innerWidth);
const containerHeight = ref(props.infoRowProp.containerHeightLg);

const updateVisibleItems = () => {
  if (screenWidth.value >= 1024) {
    containerHeight.value = props.infoRowProp.containerHeightLg;
  } else if (screenWidth.value >= 768) {
    containerHeight.value = props.infoRowProp.containerHeightMd;
  } else {
    containerHeight.value = props.infoRowProp.containerHeightSm;
  }
};

onMounted(() => {
  updateVisibleItems();
  document.querySelectorAll('.info-row')[props.infoRowProp.textContent.length - 1].style.border =
    'none';
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateVisibleItems();
  });
});
</script>
<template>
  <div
    class="info-row border-gray row-span-1 flex w-full items-center justify-center border-b-2 py-1 lg:py-0"
    :style="{
      height: containerHeight,
    }"
    v-for="(item, index) in props.infoRowProp.textContent"
    :key="index"
    @click="emitInfoRowData"
  >
    <div class="grid w-full grid-cols-12 items-center">
      <div
        class="col-span-12 line-clamp-1 pl-2 text-base font-bold md:text-base lg:text-xl"
        :class="{ 'pr-4 md:col-span-7 lg:col-span-8': props.infoRowProp.commentHidden !== true }"
      >
        <a
          :href="helpers.generateHref(item)"
          :target="helpers.generateTarget(item)"
          class="block cursor-pointer"
          >{{ item.title }}</a
        >
      </div>

      <div
        class="col-span-12 line-clamp-1 flex items-center justify-start md:col-span-5 lg:col-span-4"
        :class="{ hidden: props.infoRowProp.commentHidden === true }"
      >
        <div class="flex w-full flex-wrap">
          <div class="flex items-center justify-center pr-5">
            <i class="ri-heart-fill text-row-title mr-2" />
            <p class="text-xs wrap-break-word break-all whitespace-normal md:text-base">
              {{ item.likeCount > 99 ? '99' : item.likeCount }}
              <span v-if="item.likeCount > 99" class="text-xs">+</span>
            </p>
          </div>
          <div class="flex items-center justify-center pr-5">
            <i class="ri-message-line text-row-title mr-2" />
            <p class="text-xs wrap-break-word break-all whitespace-normal md:text-base">
              {{ item.commentCount > 99 ? '99' : item.commentCount }}
              <span v-if="item.commentCount > 99" class="text-xs">+</span>
            </p>
          </div>
          <!--          TODO: 等後端補上觀看數，再取消註解-->
          <!--          <div class="flex items-center justify-center pr-5">-->
          <!--            <i class="ri-eye-fill text-row-title" />-->
          <!--            <p class="wrap-break-word text-xs md:text-base">{{ item.viewCount }}</p>-->
          <!--          </div>-->
        </div>
      </div>
    </div>
  </div>
</template>
