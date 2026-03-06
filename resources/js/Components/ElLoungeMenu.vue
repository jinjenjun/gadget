<script setup>
import { ref, onMounted, computed } from 'vue';
import { useStore } from 'vuex';
import { usePage } from '@inertiajs/vue3';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';

const props = defineProps({
  menuProp: String,
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

const store = useStore();
const page = usePage();
const menuData = computed(() => page.props);
const activeTab = ref();
const screenWidth = ref(window.innerWidth);
const menuBarWidth = ref();

const currentRoute = helpers.getOriginUrl();
const categoryMenuData = ref({
  menu: {
    menuItem: [],
    disabledMenuItem: [],
    startMenuItem: {}
  },
});

const disabledTabs = ref(categoryMenuData.value.menu.disabledMenuItem.map((item) => item.name));
const isTabDisabled = (tabName) => {
  return disabledTabs.value.includes(tabName);
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
    menuBarWidth.value = totalWidth >= 800 ? '800px' : totalWidth + 'px';
  } else if (screenWidth.value >= 768) {
    totalWidth = textCount * 20 + marginCount * 14 * 3.5;
    menuBarWidth.value = totalWidth >= 500 ? '500px' : totalWidth + 'px';
  } else {
    totalWidth = textCount * 20 + marginCount * 14;
    menuBarWidth.value = totalWidth >= 290 ? '290px' : totalWidth + 'px';
  }
};

const matchCategoryAndUpdateTab = () => {
  let routePrefix = '';

  if (currentRoute.startsWith('/posts/search')) {
    activeTab.value = '';
  } else if (currentRoute.startsWith('/posts')) {
    routePrefix = 'posts/category';
  } else if (currentRoute.startsWith('/serials') || currentRoute.startsWith('/sections')) {
    routePrefix = 'serials/category';
  }

  if (routePrefix) {
    const matchedCategory = menuData?.value?.posts_menu?.find((category) =>
      category?.slug?.startsWith(routePrefix)
    );

    if (matchedCategory) {
      activeTab.value = matchedCategory.title;
    }
  }
};

const generateMenuData = async () => {
  categoryMenuData.value.menu.menuItem = [
    ...menuData?.value?.posts_menu?.map((category) => ({
      name: category.title,
      route: `/${category.slug || ''}`,
    })) || [],
  ]

  menuData?.value?.posts_menu?.find( item => {
    if(`/${item?.slug || ''}` === currentRoute) {
      activeTab.value = item.title;
    }
  });

  matchCategoryAndUpdateTab();
  updateMenuBar();
};

onMounted(async() => {
  if(props.menuProp){
    activeTab.value = props.menuProp;
  }
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
