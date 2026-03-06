<script setup>
import { onMounted, watch, nextTick } from 'vue';
import { useStore } from 'vuex';
import { vuexData } from '@/../store/index.js';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';

const store = useStore();

const props = defineProps({
  infoSidebarProp: [Array, Object],
});

const emit = defineEmits(['infoSidebarEmit']);

const emitInfoSidebar = (data) => {
  if (data.route) {
    vuexData.unlock.head.setHeadTitle(store, data.name);
    helpers.forwardRoute(data.route);
  } else {
    emit('infoSidebarEmit', data);
  }
};

watch(
  () => props.infoSidebarProp.menu.startMenuItem,
  async (newItem) => {
    if (!newItem) return;
    await nextTick();
    const targetId = `category-${newItem.number}`;
    const targetElement = document.getElementById(targetId);
    if (targetElement && props?.infoSidebarProp?.menu?.startMenuItem?.route) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  },
);
</script>

<template>
  <div class="w-full" v-for="(item, index) in props.infoSidebarProp.menu.menuItem" :key="index">
    <div
      class="flex flex-col items-center justify-start"
      :class="categoryItem.allow ? '' : 'disable-execution'"
      v-for="(categoryItem, categoryIndex) in item"
      :key="categoryIndex"
    >
      <a
        class="border-gray bg-light-brown w-full cursor-pointer border-x-2 border-b-2 px-3 py-5"
        :class="
          categoryItem.number === props.infoSidebarProp.menu.startMenuItem.number
            ? 'text-secondary'
            : 'text-primary'
        "
        :id="`category-${categoryItem.number}`"
        @click="emitInfoSidebar(categoryItem)"
      >
        <span class="text-page-subtitle">
          {{ categoryItem.name }}
        </span>
      </a>
    </div>
  </div>
</template>
