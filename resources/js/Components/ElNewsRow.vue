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
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateVisibleItems();
  });
});
</script>
<template>
  <div v-if="props.infoRowProp.textContent.length === 0" class="text-card-title p-5">無相關內容顯示</div>
  <div
    class="info-row row-span-1 flex w-full items-center justify-center py-1 lg:py-0"
    :class="[
    props.infoRowProp.textContent.length > 1 && index !== props.infoRowProp.textContent.length - 1
      ? 'border-gray border-b-2'
      : ''
  ]"
    :style="{ height: containerHeight }"
    v-for="(item, index) in props.infoRowProp.textContent"
    :key="index"
    @click="emitInfoRowData"
  >
    <div class="grid w-full grid-cols-12 items-center">
      <div
        class="border-gray col-span-12 flex md:border-r"
        :class="{ 'pr-4 md:col-span-8': props.infoRowProp.commentHidden !== true }"
      >
        <div
          class="bg-light-brown mx-2 inline-block min-w-[13%] rounded-sm p-1 text-center text-xs lg:min-w-[5%]"
        >
          <div class="text-xs">{{ item.tag }}</div>
        </div>
        <div class="line-clamp-1 w-[75%] pl-2 text-base font-bold md:text-base lg:text-xl">
          <p @click="helpers.forwardRouteBlank(item.route)" class="cursor-pointer">
            {{ item.title }}
          </p>
        </div>
      </div>

      <div
        class="col-span-12 line-clamp-1 flex hidden items-center justify-start pl-2 md:col-span-4 md:block"
        :class="{ hidden: props.infoRowProp.commentHidden === true }"
      >
        <div class="text-card-description flex w-full flex-wrap">{{ item.date }}</div>
      </div>
    </div>
  </div>
</template>
