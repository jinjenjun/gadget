<script setup>
import '@/../scss/main.scss';
import { ref } from 'vue';

const props = defineProps({
  infoButtonProp: [Array, Object]
});

const buttonData = ref({
  disable: props.infoButtonProp?.disable || false
});
</script>

<template>
  <button
    class="flex justify-center items-center bg-secondary rounded text-card-description text-white font-bold whitespace-nowrap cursor-pointer p-2 active:brightness-110"
    :class="buttonData.disable ? 'disable-execution' : ''"
    :disabled="buttonData.disable"
  >
    <slot />
  </button>
</template>
