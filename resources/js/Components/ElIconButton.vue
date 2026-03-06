<script setup>
import '@/../scss/main.scss';
import { ref } from 'vue';

const props = defineProps({
  iconButtonProp: [Array, Object]
});

const buttonData = ref({
  name: props.iconButtonProp?.name || '',
  icon: props.iconButtonProp?.icon || '',
  paddingRight: props.iconButtonProp?.paddingRight || '',
  disable: props.iconButtonProp?.disable || false
});
</script>

<template>
  <button
    class="flex justify-center items-center bg-secondary rounded text-card-description text-white font-bold whitespace-nowrap cursor-pointer p-2 active:brightness-110"
    :class="buttonData.disable ? 'disable-execution' : ''"
    :disabled="buttonData.disable"
  >
    <span :style="{ paddingRight: buttonData.paddingRight }">{{ buttonData.name }}</span>
    <i class="text-xl md:text-2xl text-white" :class="buttonData.icon" />
  </button>
</template>
