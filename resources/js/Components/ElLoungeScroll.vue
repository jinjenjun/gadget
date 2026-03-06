<script setup>
import { ref, onMounted } from 'vue';
import { useStore } from 'vuex';
import { usePage } from '@inertiajs/vue3';
import { vuexData } from '@/../store';
import '@/../scss/main.scss';
import * as utils from '@/Libs/utils.js';

const props = defineProps({
  scrollProp: String,
});

const emit = defineEmits(['scrollEmit']);

const store = useStore();
const page = usePage();
const categorySelector = ref('');
const categoryOption = ref([]);
const tagList = ref([]);

const generateMenuData = async () => {
  let originalCategories = await vuexData?.unlock?.category?.getCategoryData(store) ;
  let categoryItems;
  if(!originalCategories?.post){
    originalCategories = await utils.getAllCategories();
    vuexData?.unlock?.category?.setCategoryData(store, originalCategories);
  }

  categoryItems = originalCategories.post || [];

  tagList.value = [
    ...categoryItems.map((item) => ({
      name: item.name,
      value: String(item.id),
    })),
  ];

  categoryOption.value = [
    ...categoryItems.map((item) => ({
      label: item.name,
      value: String(item.id),
    })),
  ];

  if(props?.scrollProp){
    categorySelector.value = props.scrollProp;
  }
};

const forwardRoute = (item) => {
  window.location.href = `/posts/category/${item}`;
};

onMounted(async() => {
  await generateMenuData();
});
</script>
<template>
  <div class="mt-2 flex w-full items-center justify-center" v-if="tagList.length > 1">
    <ElScrollbar class="hidden lg:block">
      <div class="flex w-full min-w-max gap-4 pb-3 whitespace-nowrap">
        <div
          v-for="(item, index) in tagList"
          :key="index"
          class="text-card-title inline-block cursor-pointer rounded px-5 py-2"
          :class="
                  item.name === categorySelector
                    ? 'bg-secondary text-white'
                    : 'bg-light-brown text-primary'
                "
          @click="forwardRoute(item.value)"
        >
          {{ item.name }}
        </div>
      </div>
    </ElScrollbar>
  </div>
  <div class="custom-page block flex w-full items-center justify-end lg:hidden mt-2">
    <ElSelect
      v-model="categorySelector"
      placeholder="請選擇分類"
      class="!w-[150px] custom-select-small"
    >
      <ElOption
        v-for="item in categoryOption"
        :key="item.value"
        :label="item.label"
        :value="item.value"
        :class="{
              'text-secondary font-bold': categorySelector === item.label,
              'text-primary': categorySelector !== item.label,
            }"
        class="my-2 text-[18px]!"
        @click="forwardRoute(item.value)"
      />
    </ElSelect>
  </div>
</template>
