<script setup>
import { onMounted, reactive, ref, watch } from 'vue';
import { usePage } from '@inertiajs/vue3';
import * as APIs from '@/APIs';

const page = usePage();

const props = defineProps({
  alreadyBought: {
    type: Boolean,
    required: true,
  },
  cartContent: {
    type: Object,
    required: true,
  },
  classes: {
    type: String,
    required: true,
  },
  productId: {
    type: String,
    required: true,
  },
  productTitle: {
    type: String,
    required: true,
  },
  productListPrice: {
    type: Number,
    required: true,
  },
  productSalesPrice: {
    type: Number,
    required: true,
  },
  productQuantity: {
    type: Number,
    required: true,
  },
  productType: {
    type: Number,
    required: true,
  },
});

const addStatus = ref(false);
const boughtStatus = ref(false);

const emit = defineEmits(['addToCartEmit']);

const emitCartButtonData = () => {
  const productTypeMapping = {
    1: '電子書',
    2: '電子書',
    3: '有聲書',
    4: '課程',
  };

  emit('addToCartEmit', {
    cartContent: props.cartContent,
    addStatus: addStatus.value,
    order: {
      item_id: props?.productId || '無相關資料',
      item_name:
        `${productTypeMapping[props?.productType] || '其他產品'} - ${props?.productTitle}` ||
        '無相關資料',
      price: props?.productSalesPrice,
      discount: (props?.productListPrice ?? 0) - (props?.productSalesPrice ?? 0),
      quantity: form?.quantity,
      currency: 'TWD',
    },
  });
};

const form = reactive({
  id: props?.productId,
  quantity: props?.productQuantity || 1,
});

const submit = () => {
  APIs.unlock.cart.addToCart(form).then((res) => {
    ElNotification.success({
      title: '送出成功',
      message: '成功加入購物車',
      offset: 100,
    });
    addStatus.value = true;

    emitCartButtonData();
  });
};

const sendToCart = (productId) => {
  if (boughtStatus.value) {
    ElNotification.warning({
      title: '送出失敗',
      message: '過去已購買本產品，無法重覆購買',
      offset: 100,
    });
  } else if (productId in props.cartContent) {
    ElNotification.warning({
      title: '送出失敗',
      message: '本產品已加入過購物車囉！',
      offset: 100,
    });
    addStatus.value = false;
  } else {
    submit();
  }
};

onMounted(() => {
  boughtStatus.value = props.alreadyBought;
});

watch(
  () => props.productQuantity,
  (newVal) => {
    form.quantity = newVal;
  },
  { immediate: true },
);

watch(
  () => props.alreadyBought,
  (newVal) => {
    boughtStatus.value = newVal;
  },
  { immediate: true },
);
</script>
<template>
  <div @click="sendToCart(productId)" :class="classes">
    <slot />
  </div>
</template>
