<script setup>
import { ref, onMounted, watch } from 'vue';
import { router } from '@inertiajs/vue3';
import '@/../scss/main.scss';
import * as helpers from '@/Libs/helpers.js';
import ElAddToCart from '@/Components/ElAddToCart.vue';

const props = defineProps({
  auctionCardProp: [Array, Object],
  extraTextProp: Object,
});

const backgroundImageRatio = ref();
const visibleItems = ref([]);

const emit = defineEmits(['auctionCardEmit']);

const emitCategoryCardData = (data) => {
  emit('auctionCardEmit', data);
};

const emitAddToCart = (data) => {
  if (data.addStatus) {
    if (props.extraTextProp?.isFromChina !== true) {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({
        event: '活動頁 - 加入購物車',
        ecommerce: {
          items: [data.order],
        },
      });
    }
    router.reload();
    emitCategoryCardData(data);
  }
};

const updateVisibleItems = () => {
  visibleItems.value = props.auctionCardProp.textContent;
};

onMounted(() => {
  updateVisibleItems();
});

watch(
  () => props,
  () => {
    updateVisibleItems();
    backgroundImageRatio.value = props?.auctionCardProp?.backgroundImageRatio || '4/3';
  },
  { immediate: true, deep: true },
);
</script>
<template>
  <div
    v-for="(item, index) in visibleItems"
    :key="index"
    class="bg-light-brown m-2 grid grid-cols-12 rounded-lg p-2 shadow-lg lg:py-[15px]"
  >
    <div class="col-span-12 flex flex-col items-start justify-start">
      <a
        class="relative block w-full cursor-pointer overflow-hidden rounded"
        :style="{ aspectRatio: '3/4' }"
        @click="helpers.forwardRouteBlank(item.route)"
      >
        <img
          class="absolute left-0 top-0 h-full w-full object-cover"
          :src="item.image"
          :alt="item.title || 'auction image'"
          loading="lazy"
        />
      </a>
      <span
        class="mx-2 mt-4 inline-block w-[50px] rounded bg-gray-500 p-1 text-center text-sm font-bold text-white"
      >
        {{ item.productType }}
      </span>
      <p
        class="mx-2 mt-4 cursor-pointer text-sm md:text-card-title"
        @click="helpers.forwardRouteBlank(item.route)"
      >
        {{ item.title }}
      </p>
    </div>
    <div class="col-span-12 flex flex-col justify-between md:mt-2">
      <div class="flex grow flex-col justify-end">
        <span
          class="border-secondary bg-secondary my-2 inline-block w-[50px] rounded p-1 text-center text-sm font-bold text-white"
        >
          {{ helpers.priceTag(item.listPrice, item.salesPrice) }}
        </span>
        <div class="flex flex-col items-end justify-end">
          <a class="text-sm line-through" v-if="Number(item.listPrice) !== Number(item.salesPrice)">
            NTD {{ helpers.numberComma(item.listPrice) }}
          </a>
          <a class="mt-1 text-sm font-bold md:text-[18px]">
            NTD {{ helpers.numberComma(item.salesPrice) }}
          </a>
        </div>
        <ElAddToCart
          classes="mt-5 w-full text-card-description p-2 lg:py-2 bg-secondary cursor-pointer flex items-center justify-center rounded border border-none font-bold text-white shadow-none active:brightness-110"
          :cart-content="extraTextProp?.cartContent"
          :product-id="`${item?.id}`"
          :product-title="`${item?.productType} - ${item?.title}`"
          :product-list-price="helpers.parseNumber(item?.listPrice)"
          :product-sales-price="helpers.parseNumber(item?.salesPrice)"
          :already-bought="item?.alreadyBought"
          @add-to-cart-emit="emitAddToCart"
        >
          <span class="text-sm md:text-[18px]">加入購物車</span>
        </ElAddToCart>
      </div>
    </div>
  </div>
</template>
