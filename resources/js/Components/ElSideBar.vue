<script setup>
import { ref } from 'vue';
import '@/../scss/main.scss';

const props = defineProps({
  sideBarProp: [Array, Object],
  activeItem: String,
});
const emit = defineEmits(['sideBarEmit']);

const disabledTabs = ref(props?.sideBarProp?.disabledMenuItem?.map((item) => item.title));
const isTabDisabled = (tabName) => {
  return disabledTabs?.value?.includes(tabName);
};

const emitSideBarData = (data) => {
  emit('sideBarEmit', data);
};
</script>

<template>
  <ul class="sidebar-menu">
    <li
      v-for="(item, index) in props?.sideBarProp?.menuItem"
      :key="index"
      @click="!isTabDisabled(item.title) && emitSideBarData(item.title)"
      :class="[
        'menu-item',
        {
          disabled: isTabDisabled(item.title),
          'bg-light-brown text-primary': item.title === props?.activeItem,
          'text-primary': item.title !== props?.activeItem,
        },
      ]"
    >
      <span class="pr-5 text-2xl">{{ item.title }}</span>
      <span class="text-xl">{{ item.subtitle }}</span>
    </li>
  </ul>
</template>

<style scoped>
.sidebar-menu {
  list-style: none;
  padding: 0;
  margin: 0;
}

.menu-item {
  cursor: pointer;
  padding: 12px;
  user-select: none;
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.menu-item:hover {
  color: #d55928 !important;
}

.menu-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
  pointer-events: none;
}
</style>
