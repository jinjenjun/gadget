<script setup>
import { computed, onMounted, ref } from 'vue';
import eventBus from '@/Composables/eventBus.js';
import * as APIs from '@/APIs';

// 定義 props
const props = defineProps({
  modelType: { type: String, required: true },
  modelId: { type: String, required: true },
  type: { type: String, default: 'default' },
  size: { type: String, required: false },
});

// 狀態管理
const count = ref(0);
const isReacted = ref(false);
const loading = ref(false);

// 計算屬性
const tooltip = computed(() => (isReacted.value ? '收回讚' : '讚'));
const formattedCount = computed(() => (count.value > 999 ? '999+' : count.value));

// 初始化資料
const fetchData = () => {
  APIs.unlock.main
    .getLikeCount(route('platform.like.show', { model: props.modelType, id: props.modelId }))
    .then((response) => {
      count.value = response.data.count;
      isReacted.value = response.data.isReacted;
    })
    .catch((error) => {
      console.error('取得讚數失敗:', error);
    });
};

// 切換按讚狀態
const toggleLike = () => {
  if (loading.value) return; // 防止重複點擊
  loading.value = true;

  APIs.unlock.main
    .addLike(route('platform.like.toggle', { model: props.modelType, id: props.modelId }))
    .then((response) => {
      if (response.data.success) {
        isReacted.value = !isReacted.value;
        count.value += isReacted.value ? 1 : -1;

        // 發送事件，通知其他組件同步
        eventBus.$emit('like-updated', {
          modelType: props.modelType,
          modelId: props.modelId,
          isReacted: isReacted.value,
          count: count.value,
        });

        if (isReacted.value) {
          ElNotification.success({
            title: '按讚成功',
            offset: 100,
          });
        } else {
          ElNotification.warning({
            title: '收回按讚',
            offset: 100,
          });
        }
      } else {
        console.error('更新按讚狀態失敗');
      }
    })
    .catch((error) => {
      console.error('更新按讚狀態失敗:', error);
    })
    .finally(() => {
      loading.value = false;
    });
};

// 掛載時監聽 EventBus
onMounted(() => {
  fetchData();

  eventBus.$on(
    'like-updated',
    ({ modelType, modelId, isReacted: newIsReacted, count: newCount }) => {
      if (modelType === props.modelType && modelId === props.modelId) {
        isReacted.value = newIsReacted;
        count.value = newCount;
      }
    },
  );
});
</script>
<template>
  <div class="flex items-center">
    <!-- Like 按鈕 -->
    <button
      @click="toggleLike"
      :title="tooltip"
      class="flex items-center justify-center text-xl focus:outline-none"
      :class="{
        'pr-2': type !== 'bg-circle',
        'h-12 w-12 rounded-full bg-light p-0 text-2xl': type === 'bg-circle',
      }"
    >
      <!-- 動態切換 SVG -->
      <svg
        v-if="!isReacted"
        class="h-4 w-4 outline-none transition-all md:h-5 md:w-5"
        :class="{
          'h-5! w-5!': size === 'large',
        }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="3"
        tabindex="0"
      >
        <path
          d="M16.5 3C19.5376 3 22 5.5 22 9C22 16 14.5 20 12 21.5C9.5 20 2 16 2 9C2 5.5 4.5 3 7.5 3C9.35997 3 11 4 12 5C13 4 14.64 3 16.5 3Z"
        />
      </svg>
      <svg
        v-else
        class="h-4 w-4 outline-none transition-all md:h-5 md:w-5"
        :class="{
          'h-5! w-5!': size === 'large',
        }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="currentColor"
        stroke-width="3"
        tabindex="0"
      >
        <path
          d="M16.5 3C19.5376 3 22 5.5 22 9C22 16 14.5 20 12 21.5C9.5 20 2 16 2 9C2 5.5 4.5 3 7.5 3C9.35997 3 11 4 12 5C13 4 14.64 3 16.5 3Z"
        />
      </svg>
    </button>
    <!-- 按讚總數量 -->
    <span v-if="type === 'default'">
      {{ formattedCount }}
    </span>
  </div>
</template>
