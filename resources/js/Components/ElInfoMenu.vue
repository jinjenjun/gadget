<script setup>
import { ref, onMounted, watch } from 'vue';
import '@/../scss/main.scss';

const props = defineProps({
  infoMenuProp: [Array, Object],
});
const emit = defineEmits(['infoMenuEmit']);
const emitInfoMenuData = (tab) => {
  activeTab.value = tab.paneName;
  emit('infoMenuEmit', activeTab.value);
};
const activeTab = ref(props.infoMenuProp.menu?.startMenuItem?.name || props.infoMenuProp.menu.menuItem[0].name);
const infoMenuSetting = ref({
  margin: props.infoMenuProp.marginLg,
});

const screenWidth = ref(window.innerWidth);

const updateMenuItems = () => {
  if (screenWidth.value >= 1024) {
    infoMenuSetting.value.margin = props.infoMenuProp.marginLg;
  } else if (screenWidth.value >= 768) {
    infoMenuSetting.value.margin = props.infoMenuProp.marginMd;
  } else {
    infoMenuSetting.value.margin = props.infoMenuProp.marginSm;
  }
};

const disabledTabs = ref(props.infoMenuProp.menu.disabledMenuItem.map((item) => item.name));
const isTabDisabled = (tabName) => {
  return disabledTabs.value.includes(tabName);
};

onMounted(() => {
  updateMenuItems();
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateMenuItems();
  });
});

watch(
  () => props,
  () => {
    activeTab.value = props.infoMenuProp.menu?.startMenuItem?.name || props.infoMenuProp.menu.menuItem[0].name;
    disabledTabs.value = props.infoMenuProp?.menu?.disabledMenuItem.map((item) => item.name);
  },
  { immediate: true, deep: true },
);

</script>
<template>
  <ElTabs class="head-tabs py-0 lg:py-2" v-model="activeTab" @tab-click="emitInfoMenuData">
    <ElTabPane
      :label="item.name"
      :name="item.name"
      v-for="(item, index) in props.infoMenuProp.menu.menuItem"
      :key="index"
      :disabled="isTabDisabled(item.name)"
    >
      <template #label>
        <div
          class="flex items-center justify-center"
          :class="{
            'font-bold': activeTab === item.name,
            'font-normal': activeTab !== item.name,
            'disable-execution': isTabDisabled(item.name)
          }"
          :style="{
            margin: infoMenuSetting.margin
          }"
        >
          <p class="mr-2" :class="props.infoMenuProp?.menu?.fontSize === 'large' ? 'text-base lg:text-xl' : 'text-sm lg:text-xl'">{{ item.name }}</p>
          <i class="ri-arrow-down-s-line text-page-subtitle lg:text-xl" />
        </div>
      </template>
    </ElTabPane>
  </ElTabs>
</template>
