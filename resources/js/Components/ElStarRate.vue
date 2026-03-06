<script setup>
import { ref, watch, onMounted } from 'vue';
import "@/../scss/main.scss"

const props = defineProps({
  starRateProp:[Array, Object],
});

const emit = defineEmits(['starRateEmit']);

const emitStarRateData = (data) => {
  if(props.starRateProp.clickAllow){
    chooseStar.value = data;
    emit('starRateEmit', chooseStar.value);
  } else {
    return false;
  }
};
const chooseStar = ref( props.starRateProp?.defaultGrade || 0);
const starData = ref([
  { grade: 1 },
  { grade: 2 },
  { grade: 3 },
  { grade: 4 },
  { grade: 5 },
]);
const layoutSetting = ref({
  fontSize: props.starRateProp?.fontSize || 'text-card-title',
  color:  props.starRateProp?.color || 'text-primary',
  cursor: props.starRateProp?.cursor || 'cursor-pointer',
});

onMounted(() => {
  chooseStar.value = props.starRateProp.defaultGrade
})

watch(
  [props],
  () => {
    chooseStar.value = props.starRateProp?.defaultGrade || 0;
  },
  { immediate: true, deep: true },
);

</script>
<template>
  <div class="flex justify-start items-start">
    <button
      v-for="(item, index) in starData"
      :key="index"
      :class="['pr-2', layoutSetting.cursor]"
      @click="emitStarRateData(item.grade)"
    >
      <i :class="[layoutSetting.fontSize, layoutSetting.color, 'font-normal', item.grade <= chooseStar ? 'ri-star-fill' : 'ri-star-line']" />
    </button>
  </div>
</template>
