<script setup>
import { onMounted, watch, ref } from 'vue';
const props = defineProps({ cartListProp: [Array, Object] });
const listData = ref();

const listDataTransfer = (data) => {
  const items = Object?.values(data || []);
  return items?.map((item) => {
    return {
      id: item?.id || '',
      name: item?.name || '',
      price: item?.price || '',
      quantity: item?.quantity || '',
    };
  });
};

const generateInitData = () => {
  listData.value = listDataTransfer(props.cartListProp);
};

onMounted(() => {
  generateInitData();
});

watch(
  () => props,
  () => {
    generateInitData();
  },
  { immediate: true },
);
</script>
<template>
  <div class="p-5 border-2 flex flex-col items-start justify-start">
    <div class="w-full py-2 rounded text-card-description flex items-start justify-between" v-for="(item, index) in listData" :key="index">
      <span>名稱:{{ item.name }}</span>
      <span><span class="pr-5">價格:NTD {{ item.price }}</span>數量:{{ item.quantity }}</span>
    </div>
  </div>
</template>
