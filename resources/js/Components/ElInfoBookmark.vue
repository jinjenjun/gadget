<script setup>
import { computed, onMounted, ref } from 'vue';
import eventBus from '@/Composables/eventBus.js';
import '@/../scss/main.scss';
import * as APIs from '@/APIs';

// 定義 props
const props = defineProps({
  modelType: { type: String, required: true },
  modelId: { type: String, required: true },
  type: { type: String, default: 'default' },
  size: { type: String, required: false },
});

const emit = defineEmits(['infoBookmarkEmit']);

const emitInfoBookmarkData = () => {
  emit('infoBookmarkEmit', {
    modelType: props.modelType,
    modelId: props.modelId,
    isReacted: isReacted.value,
    count: count.value,
  });
};

// 狀態管理
const count = ref(0);
const isReacted = ref(false);
const loading = ref(false);

// 計算屬性
const tooltip = computed(() => (isReacted.value ? '取消收藏' : '收藏書籤'));
const formattedCount = computed(() => (count.value > 999 ? '999+' : count.value));

// 取得初始資料
const fetchData = () => {
  APIs.unlock.main
    .getBookmarkCount(
      route('platform.bookmark.show', { model: props.modelType, id: props.modelId }),
    )
    .then((response) => {
      count.value = response.data.count;
      isReacted.value = response.data.isReacted;
    })
    .catch((error) => {
      console.error('取得書籤總數失敗:', error);
    });
};

// 切換書籤狀態
const toggleBookmark = () => {
  if (loading.value) return; // 防止重複點擊
  loading.value = true;

  APIs.unlock.main
    .addBookmark(route('platform.bookmark.toggle', { model: props.modelType, id: props.modelId }))
    .then((response) => {
      if (response.data.success) {
        isReacted.value = !isReacted.value;
        count.value += isReacted.value ? 1 : -1;

        // 發送同步事件
        eventBus.$emit('bookmark-updated', {
          modelType: props.modelType,
          modelId: props.modelId,
          isReacted: isReacted.value,
          count: count.value,
        });

        if (isReacted.value) {
          ElNotification.success({
            title: '收藏成功',
            offset: 100,
          });
        } else {
          ElNotification.warning({
            title: '取消收藏',
            offset: 100,
          });
        }

        emitInfoBookmarkData();
      } else {
        console.error('更新書籤狀態失敗');
      }
    })
    .catch((error) => {
      console.error('更新書籤狀態失敗:', error);
    })
    .finally(() => {
      loading.value = false;
    });
};

// 掛載後取得初始資料，並監聽 EventBus
onMounted(() => {
  fetchData();
  eventBus.$on('bookmark-updated', (payload) => {
    if (payload.modelType === props.modelType && payload.modelId === props.modelId) {
      isReacted.value = payload.isReacted;
      count.value = payload.count;
    }
  });
});
</script>
<template>
  <div class="flex items-center">
    <!-- Bookmark 按鈕 -->
    <button
      @click="toggleBookmark"
      :title="tooltip"
      class="flex items-center justify-center text-xl focus:outline-none"
      :class="{
        'pr-2': type !== 'bg-circle',
        'h-7 w-7 rounded-full bg-light p-0 text-2xl md:h-8 md:w-8 lg:h-9 lg:w-9':
          type === 'bg-circle',
        'md:h-13! md:w-13! h-12! w-12! rounded-full bg-light p-0 text-2xl lg:h-14! lg:w-14!':
          type === 'bg-circle' && size === 'large',
      }"
    >
      <!-- 動態切換 SVG -->
      <svg
        v-if="!isReacted"
        class="h-5 w-5 outline-none transition-all md:h-6 md:w-6"
        :class="{
          'h-6! w-6!': size === 'large',
        }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path
          d="M5 2H19C19.5523 2 20 2.44772 20 3V22.1433C20 22.4194 19.7761 22.6434 19.5 22.6434C19.4061 22.6434 19.314 22.6168 19.2344 22.5669L12 18.0313L4.76559 22.5669C4.53163 22.7136 4.22306 22.6429 4.07637 22.4089C4.02647 22.3293 4 22.2373 4 22.1433V3C4 2.44772 4.44772 2 5 2ZM8 9V11H16V9H8Z"
        ></path>
      </svg>
      <svg
        v-else
        class="h-5 w-5 outline-none transition-all md:h-6 md:w-6"
        :class="{
          'h-6! w-6!': size === 'large',
        }"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="currentColor"
        stroke="white"
        stroke-width="1"
      >
        <path
          d="M5 2H19C19.5523 2 20 2.44772 20 3V22.1433C20 22.4194 19.7761 22.6434 19.5 22.6434C19.4061 22.6434 19.314 22.6168 19.2344 22.5669L12 18.0313L4.76559 22.5669C4.53163 22.7136 4.22306 22.6429 4.07637 22.4089C4.02647 22.3293 4 22.2373 4 22.1433V3C4 2.44772 4.44772 2 5 2ZM8 9V11H16V9H8Z"
        ></path>
      </svg>
    </button>
    <!-- 書籤總數量 -->
    <span v-if="type === 'default'">
      {{ formattedCount }}
    </span>
  </div>
</template>
