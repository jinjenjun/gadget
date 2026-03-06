<script setup>
import { ref, onMounted, computed } from 'vue';
import { usePage } from '@inertiajs/vue3';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';
const currentRoute = helpers.getOriginUrl();
const routeString = window.location.pathname;
const pathParts = routeString.split('/');
const route = pathParts[1];
const activeTab = ref();
const screenWidth = ref(window.innerWidth);
const menuBarWidth = ref();

const page = usePage();
const menuData = computed(() => page.props);
const urlParams = new URLSearchParams(window.location.search);

const generateMenuData = async () => {
  categoryMenuData.value.menu.menuItem = [
    ...menuData?.value?.shop_menu?.map((category) => ({
      name: category.title,
      route: `/${category.slug || ''}`,
    })) || [],
  ];

  const setActiveTab = (type) => {
    const category = menuData?.value?.shop_menu?.find(item => item.slug.toLowerCase().includes(type));
    if (category) activeTab.value = category.title;
  };

  const type = urlParams.get('type');

  if (type === 'ebook' || type === 'audio') {
    setActiveTab(type);
  } else if (currentRoute.startsWith('/courses/category/')) {
    setActiveTab('courses');
  } else {
    menuData?.value?.shop_menu?.find(item => {
      `/${item?.slug || ''}` === currentRoute ? activeTab.value = item.title : null;
    });
  }

  updateMenuBar();
};

const categoryMenuData = ref({
  menu: {
    menuItem: [],
    disabledMenuItem: [],
    startMenuItem: {}
  },
});

const props = defineProps({
  menuProp: [Array, Object],
});

const emit = defineEmits(['menuEmit']);

const emitMenuBarData = (tabPane) => {
  const tabName = tabPane.props.name;
  const tab = categoryMenuData.value.menu.menuItem.find(
    (item) => item.name === tabName
  );
  if (!tab) return;
  activeTab.value = tab.name;
  categoryMenuData.value.menu.startMenuItem = tab;
  emit('menuEmit', activeTab.value);
  helpers.forwardRoute(tab.route);
};

const forwardRoute = (optionRoute) => {
  window.location.href = optionRoute;
};

const updateMenuBar = () => {
  let textCount = categoryMenuData.value.menu.menuItem.reduce(
    (total, item) => total + item.name.length,
    0,
  );
  let marginCount = categoryMenuData.value.menu.menuItem.length * 2;
  let totalWidth;

  if (screenWidth.value > 1200) {
    totalWidth = textCount * 20 + marginCount * 14 * 3.8;
    menuBarWidth.value = totalWidth >= 1000 ? '1000px' : totalWidth + 'px';
  } else if (screenWidth.value >= 1024) {
    totalWidth = textCount * 20 + marginCount * 14 * 3.5;
    menuBarWidth.value = totalWidth >= 900 ? '900px' : totalWidth + 'px';
  } else if (screenWidth.value >= 768) {
    totalWidth = textCount * 20 + marginCount * 14 * 3.5;
    menuBarWidth.value = totalWidth >= 500 ? '500px' : totalWidth + 'px';
  } else {
    totalWidth = textCount * 20 + marginCount * 14;
    menuBarWidth.value = totalWidth >= 330 ? '330px' : totalWidth + 'px';
  }
};

const disabledTabs = ref(categoryMenuData.value.menu.disabledMenuItem.map((item) => item.name));
const isTabDisabled = (tabName) => {
  return disabledTabs.value.includes(tabName);
};

onMounted(async() => {
  await generateMenuData();
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateMenuBar();
  });
});
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
        v-for="(item, index) in categoryMenuData.menu.menuItem"
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
