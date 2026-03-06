<script setup>
import { ref, onMounted, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';
import ElInfoBookmark from '@/Components/ElInfoBookmark.vue';

const props = defineProps({
  infoCardProp: [Array, Object],
});
const emit = defineEmits(['infoCardEmit']);

const emitInfoCardData = () => {
  emit('infoCardEmit', 'infoCardList元件傳出資料');
};

const emitInfoBookmark = (data) => {
  if (data.isReacted === false) {
    router.reload();
  }
};

const screenWidth = ref(window.innerWidth);
const backgroundImageRatio = ref();
const visibleItems = ref([]);
const backgroundImageHeight = ref(props.infoCardProp.backgroundImageHeightLg);
const updateVisibleItems = () => {
  if (screenWidth.value >= 1024) {
    visibleItems.value = props.infoCardProp.textContent;
    backgroundImageHeight.value = props.infoCardProp.backgroundImageHeightLg;
  } else if (screenWidth.value >= 768) {
    visibleItems.value = props.infoCardProp.textContent;
    backgroundImageHeight.value = props.infoCardProp.backgroundImageHeightMd;
  } else {
    visibleItems.value = props.infoCardProp.textContent;
    backgroundImageHeight.value = props.infoCardProp.backgroundImageHeightSm;
  }
};

const generateHref = (item) => (item.route ? route(item.route, { id: item.id }) : null);

onMounted(() => {
  helpers.devConsole.log('info card list:', props.infoCardProp);
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
    backgroundImageRatio.value = props?.infoCardProp?.backgroundImageRatio || '4/3';
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
      <a
        :href="generateHref(item)"
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
        <a
          :href="generateHref(item)"
          class="text-card-title mb-2 line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]"
          @click="helpers.forwardRoute(item.link)"
        >
          {{ item.title }}
        </a>
        <a
          :href="generateHref(item)"
          class="mb-2 line-clamp-3 whitespace-normal wrap-break-word break-all text-xs lg:text-base"
          @click="helpers.forwardRoute(item.link)"
          v-html="item.description"
        />
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
              <div class="w-full cursor-pointer">
                <span class="m-1" v-for="(item, index) in item.hashtag" :key="index">
                  <span class="text-secondary text-xs">#</span>
                  <span class="text-xs">{{ item }}</span>
                </span>
              </div>
            </template>
          </ElPopover>
        </div>
      </div>
    </div>
  </div>
</template>
