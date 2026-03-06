<script setup>
import { reactive, ref } from 'vue';
import { usePage } from '@inertiajs/vue3';
import * as APIs from '@/APIs';
import * as helpers from '@/Libs/helpers.js';

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
});

const addStatus = ref(false);

const emit = defineEmits(['addToCartEmit']);

const emitCartButtonData = () => {
  emit('addToCartEmit', {
    cartContent: props.cartContent,
    addStatus: addStatus.value,
    order: {
      item_id: props?.productId || '無相關資料',
      item_name: props?.productTitle || '無相關資料',
      price: props?.productSalesPrice || 0,
      discount: (props?.productListPrice ?? 0) - (props?.productSalesPrice ?? 0),
      quantity: 1,
      currency: 'TWD',
    },
  });
};

const form = reactive({
  id: props.productId,
  quantity: 1,
});

const submit = () => {
  APIs.unlock.cart.addToCart(form).then(() => {
    ElNotification.success({
      title: '送出成功',
      message: '成功加入購物車',
      offset: 100,
    });
    addStatus.value = true;

    emitCartButtonData();
  });
};

function redirectGuestToLogin() {
  ElNotification.warning({
    title: '未登入會員',
    message: '使用此服務請先進行會員登入',
    offset: 100,
  });

  setTimeout(() => {
    const currentPath = `${window.location.pathname}${window.location.search}`;
    const loginUrl = `/login?redirect=${encodeURIComponent(currentPath)}`;
    helpers.forwardRoute(loginUrl);
  }, 1500);
}

function addToCart(productId) {
  if (!page?.props?.auth?.user) {
    redirectGuestToLogin();
    return;
  }

  if (props.alreadyBought) {
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
}
</script>
<template>
  <div @click="addToCart(productId)" :class="classes">
    <slot />
  </div>
</template>
