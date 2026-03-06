<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { usePage } from '@inertiajs/vue3';
import { vuexData } from '@/../store';
import '@/../scss/main.scss';
import * as utils from '@/Libs/utils.js';

const store = useStore();
const page = usePage();
const menuData = computed(() => page.props);
const categorySelector = ref('');
const categoryOption = ref([]);
const tagList = ref([]);

const mergeByCategory = (arr1 = [], arr2 = []) =>
  Object.values(
    [...arr1, ...arr2].reduce((map, { category_name }) => {
      const category = category_name ?? '未分類';
      map[category] ??= { category_name: category };
      return map;
    }, {})
  );

const generateMenuData = async () => {
  let originalCategories = await vuexData?.unlock?.category?.getCategoryData(store) ;
  let categoryItems;
  if(!originalCategories?.section){
    originalCategories = await utils.getAllCategories();
    vuexData?.unlock?.category?.setCategoryData(store, originalCategories);
  }
  const serialCategoryItems = originalCategories.serial || [];
  const sectionCategoryItems = originalCategories.section || [];
  categoryItems = mergeByCategory(serialCategoryItems, sectionCategoryItems);

  tagList.value = [
    ...categoryItems.map((item) => ({
      name: item.category_name,
      value: item.category_name,
    })),
  ];

  categoryOption.value = [
    ...categoryItems.map((item) => ({
      label: item.category_name,
      value: item.category_name,
    })),
  ];

  if(menuData?.value?.serial?.serial_category?.name){
    categorySelector.value = menuData?.value?.serial?.serial_category?.name;
  } else if(menuData?.value?.section?.section_category?.name){
    categorySelector.value = menuData?.value?.section?.section_category?.name;
  }else if(menuData?.value?.title){
    categorySelector.value = menuData?.value?.title;
  }
};

const forwardRoute = (item) => {
  window.location.href = `/serials/category/${item}`;
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
          @click="forwardRoute(item.name)"
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
              'text-secondary font-bold': categorySelector === item.value,
              'text-primary': categorySelector !== item.value,
            }"
        class="my-2 text-[18px]!"
        @click="forwardRoute(item.value)"
      />
    </ElSelect>
  </div>
</template>
