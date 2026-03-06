<script setup>
import { ref, onMounted, watch } from 'vue';
import { useStore } from 'vuex';
import { vuexData } from '@/../store';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';

const store = useStore();
const categoryDialog = ref(false);

const props = defineProps({
  headMenuProp: [Array, Object],
});

const emit = defineEmits(['headMenuEmit']);

const emitMenuBarData = (tab) => {
  activeTab.value = tab.paneName;
  categoryDialog.value = true;
  vuexData.unlock.head.setHeadTitle(store, activeTab.value);
  emit('headMenuEmit', activeTab.value);
};

const forwardRoute = (optionRoute, optionName) => {
  vuexData.unlock.head.setHeadTitle(store, optionName);
  helpers.forwardRoute(optionRoute);
};

const activeTab = ref(
  props.headMenuProp.menu?.startMenuItem?.name || props.headMenuProp.menu.menuItem[0].name,
);
const screenWidth = ref(window.innerWidth);
const menuBarWidth = ref();

const updateMenuBar = () => {
  let textCount = props.headMenuProp.menu.menuItem.reduce(
    (total, item) => total + item.name.length,
    0,
  );
  let marginCount = props.headMenuProp.menu.menuItem.length * 2;
  let totalWidth;

  if (screenWidth.value > 1200) {
    totalWidth = textCount * 20 + marginCount * 14 * 3.2;
    menuBarWidth.value = totalWidth >= 900 ? '900px' : totalWidth + 'px';
  } else if (screenWidth.value > 1024) {
    totalWidth = textCount * 20 + marginCount * 14 * 3.2;
    menuBarWidth.value = totalWidth >= 800 ? '800px' : totalWidth + 'px';
  } else if (screenWidth.value >= 768) {
    totalWidth = textCount * 20 + marginCount * 14 * 3.2;
    menuBarWidth.value = totalWidth >= 768 ? '768px' : totalWidth + 'px';
  } else {
    totalWidth = textCount * 20 + marginCount * 14;
    menuBarWidth.value = totalWidth >= 310 ? '310px' : totalWidth + 'px';
  }
};

const disabledTabs = ref(props.headMenuProp.menu.disabledMenuItem.map((item) => item.name));
const isTabDisabled = (tabName) => {
  return disabledTabs.value.includes(tabName);
};

onMounted(() => {
  updateMenuBar();
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateMenuBar();
  });
});

watch(
  () => props.headMenuProp,
  () => {
    activeTab.value = props.headMenuProp?.menu?.startMenuItem?.name;
  },
  { immediate: true, deep: true },
);
</script>
<template>
  <div class="custom-page flex items-center justify-center">
    <ElTabs
      :style="{ width: menuBarWidth }"
      class="head-tabs mt-2 py-0 lg:py-2"
      v-model="activeTab"
      @tab-click="emitMenuBarData"
    >
      <ElTabPane
        v-for="(item, index) in props.headMenuProp.menu.menuItem"
        :key="index"
        :disabled="isTabDisabled(item.name)"
        :label="item.name"
        :name="item.name"
      >
        <template #label>
          <div class="flex items-center justify-center lg:mx-2">
            <ElDropdown class="custom-page mt-1 mb-[5px] md:mb-[9px] lg:mb-[12px]">
              <div class="flex items-center justify-center">
                <p
                  class="text-primary mr-2 text-sm md:text-base lg:text-xl"
                  :class="{
                    'font-bold': activeTab === item.name,
                    'font-normal': activeTab !== item.name,
                    'color-alert-disabled': isTabDisabled(item.name),
                  }"
                >
                  {{ item.name }}
                </p>
                <i class="text-primary text-page-subtitle" :class="item.icon" />
              </div>
              <template #dropdown>
                <div v-if="item.type === 'selector'">
                  <ElDropdownMenu>
                    <ElDropdownItem
                      v-for="(option, optionIndex) in item?.selectorOption"
                      :key="optionIndex"
                      @click="forwardRoute(option.route, option.name)"
                      >{{ option.name }}</ElDropdownItem
                    >
                  </ElDropdownMenu>
                </div>
              </template>
            </ElDropdown>
          </div>
        </template>
      </ElTabPane>
    </ElTabs>
  </div>
  <div class="relative">
    <hr
      class="border-light-gray absolute top-[-16px] right-0 left-0 border-t-2 px-5 lg:top-[-24px]"
    />
  </div>
</template>
<style scoped>
::v-deep(.el-tabs__nav-prev) {
  color: #5b5b5b;
  font-size: 16px;
}
::v-deep(.el-tabs__nav-next) {
  color: #5b5b5b;
  font-size: 16px;
}
</style>
