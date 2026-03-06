<script setup>
import { ref, onMounted, watch } from 'vue';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';

const props = defineProps({
  postCategoryProp: [Array, Object],
});
const emit = defineEmits(['postCategoryEmit']);

const backgroundImageRatio = ref();
const visibleItems = ref([]);
const updateVisibleItems = () => {
  visibleItems.value = props.postCategoryProp.textContent;
};

const goToTargetSection = (data) => {
  helpers.forwardRoute(`/serials/category/${data}`);
};

onMounted(() => {
  updateVisibleItems();
});

watch(
  () => props,
  () => {
    updateVisibleItems();
    backgroundImageRatio.value = props?.postCategoryProp?.backgroundImageRatio || '4/3';
  },
  { immediate: true, deep: true },
);
</script>

<template>
  <div class="border-gray grid w-full grid-cols-12 border-l">
    <div
      class="border-gray col-span-6 flex flex-col items-end justify-between border-r px-3 pb-5 lg:col-span-3"
      v-for="(item, index) in visibleItems"
      :key="index"
    >
      <div class="flex w-full cursor-pointer flex-col items-start justify-start">
        <span
          class="bg-light-brown text-card-title mb-4 block w-full truncate rounded-sm p-1 text-center font-bold hover:text-orange-400"
          @click="goToTargetSection(item.category)"
          >{{ item.category }}類</span
        >

        <p
          class="text-card-description p-2 font-bold opacity-50"
          v-if="item.listContent.length === 0"
        >
          創作待上架
        </p>

        <div
          v-for="(subItem, subIndex) in item.listContent"
          :key="subIndex"
          class="border-gray w-full border-t-2 py-3"
          :class="{ 'mb-5 border-none': subIndex === 0 }"
        >
          <a
            class="mb-2 flex items-end justify-center rounded bg-cover bg-center bg-no-repeat"
            :style="{
              backgroundImage: `url(${subItem.image})`,
              aspectRatio: backgroundImageRatio,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }"
            :href="helpers.generateHref(subItem)"
            :target="helpers.generateTarget(subItem)"
            v-if="subIndex === 0"
          />
          <div class="overflow-hidden">
            <div class="mt-2 mb-3 flex items-start justify-start">
              <span
                class="bg-light-brown mr-2 block w-[60px] shrink-0 truncate rounded-sm p-1 text-center text-xs font-bold lg:mt-1"
                >{{ subItem.tag }}</span
              >
              <a
                :href="helpers.generateHref(subItem)"
                :target="helpers.generateTarget(subItem)"
                class="text-card-title line-clamp-2 overflow-hidden underline hover:text-orange-400"
              >
                {{ subItem.title }}
              </a>
            </div>

            <div class="mb-1 flex items-center justify-start">
              <span
                class="border-secondary mr-2 block w-[60px] shrink-0 truncate rounded-sm border p-1 text-center text-xs font-bold"
                >作者</span
              >
              <a
                :href="helpers.generateHref(subItem)"
                :target="helpers.generateTarget(subItem)"
                class="text-card-description line-clamp-1 overflow-hidden font-bold"
              >
                {{ subItem.author }}
              </a>
            </div>

            <!--            TODO: 待後端提供最新篇章資料再開啟註解-->

            <!--            <div class="mb-1 flex items-start justify-start">-->
            <!--              <span-->
            <!--                class="border-secondary mr-2 block w-[60px] shrink-0 truncate rounded-sm border p-1 text-center text-xs font-bold"-->
            <!--                v-if="subIndex === 0"-->
            <!--                >最新篇章</span-->
            <!--              >-->
            <!--              <div-->
            <!--                class="text-secondary text-card-description line-clamp-2 overflow-hidden font-bold leading-snug"-->
            <!--              ></div>-->
            <!--            </div>-->

            <div class="flex items-start justify-start">
              <span
                class="border-secondary mr-2 mb-2 block w-[60px] shrink-0 truncate rounded-sm border p-1 text-center text-xs font-bold wrap-break-word break-all whitespace-normal"
                >作品介紹</span
              >
              <a
                :href="helpers.generateHref(subItem)"
                :target="helpers.generateTarget(subItem)"
                class="text-card-description line-clamp-2 overflow-hidden leading-snug"
              >
                {{ subItem.description }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
