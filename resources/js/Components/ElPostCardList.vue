<script setup>
import { ref, onMounted, watch } from 'vue';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';

const props = defineProps({
  postCardProp: [Array, Object],
});
const emit = defineEmits(['postCardEmit']);

const backgroundImageRatio = ref();
const visibleItems = ref([]);
const updateVisibleItems = () => {
  visibleItems.value = props.postCardProp.textContent;
};

onMounted(() => {
  updateVisibleItems();
});

watch(
  () => props,
  () => {
    updateVisibleItems();
    backgroundImageRatio.value = props?.postCardProp?.backgroundImageRatio || '3/4';
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="border-gray grid w-full grid-cols-12 border-l">
    <div
      class="border-gray col-span-6 cursor-pointer border-r p-3 pb-5 lg:col-span-3"
      v-for="(item, index) in visibleItems"
      :key="index"
    >
      <a
        :href="helpers.generateHref(item)"
        :target="helpers.generateTarget(item)"
        class="flex w-full items-end justify-center rounded bg-cover bg-center bg-no-repeat"
        :style="{
          backgroundImage: `url(${item.image})`,
          aspectRatio: backgroundImageRatio,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }"
      />

      <div class="overflow-hidden">
        <span
          class="bg-light-brown mt-2 block w-[60px] shrink-0 truncate rounded-sm p-1 text-center text-xs font-bold"
          >{{ item.category }}</span
        >
        <a
          :href="helpers.generateHref(item)"
          :target="helpers.generateTarget(item)"
          class="text-card-title mt-3 mb-2 line-clamp-2 h-[40px] md:h-[50px] lg:h-[55px]"
        >
          {{ item.title }}
        </a>
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
        <div class="flex items-start justify-start">
          <span
            class="border-secondary mr-2 mb-2 block w-[60px] shrink-0 rounded-sm border p-1 text-center text-xs font-bold"
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
        <div class="py-3">
          <ElPopover trigger="click" placement="bottom" :width="100">
            <template #reference>
              <div class="w-full cursor-pointer truncate overflow-hidden">
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
