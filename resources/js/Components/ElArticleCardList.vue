<script setup>
import { ref, onMounted, watch } from 'vue';
import * as helpers from '@/Libs/helpers.js';
import '@/../scss/main.scss';

const props = defineProps({
  articleCardListProp: [Array, Object],
});
const emit = defineEmits(['articleCardListEmit']);

const emitArticleCardList = () => {
  emit('articleCardListEmit', 'infoCard元件傳出資料');
};

const backgroundImageRatio = ref();
const visibleItems = ref([]);

const updateVisibleItems = () => {
  visibleItems.value = props.articleCardListProp.textContent;
  backgroundImageRatio.value = props.articleCardListProp?.backgroundImageRatio || '4/3';
};

onMounted(() => {
  updateVisibleItems();
});
watch(
  () => props,
  () => {
    updateVisibleItems();
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
      @click="emitArticleCardList(item)"
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
        >
          {{ item.description }}</a
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
