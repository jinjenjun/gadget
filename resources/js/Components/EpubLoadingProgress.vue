<template>
  <div v-if="visible" class="epub-loading-overlay">
    <div class="loading-card">
      <!-- 書籍封面 -->
      <div v-if="bookInfo.cover" class="book-cover">
        <img :src="bookInfo.cover" :alt="bookInfo.title" />
      </div>

      <!-- 書籍資訊 -->
      <div class="book-info">
        <h2 class="book-title">{{ bookInfo.title || '載入中...' }}</h2>
        <p v-if="bookInfo.author" class="book-author">{{ bookInfo.author }}</p>
      </div>

      <!-- 進度條 -->
      <div class="progress-container">
        <div class="progress-circle">
          <svg viewBox="0 0 100 100">
            <circle class="progress-bg" cx="50" cy="50" r="45" />
            <circle
              class="progress-bar"
              cx="50"
              cy="50"
              r="45"
              :style="{ strokeDashoffset: progressOffset }"
            />
          </svg>
          <div class="progress-text">{{ Math.round(progress) }}%</div>
        </div>

        <!-- 階段文字 -->
        <p class="stage-text">{{ stageText }}</p>

        <!-- 預估時間 -->
        <p v-if="estimatedTimeLeft > 0" class="eta-text">
          預估剩餘時間：{{ estimatedTimeLeft }} 秒
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  visible: { type: Boolean, default: true },
  progress: { type: Number, default: 0 },
  stageText: { type: String, default: '載入中...' },
  estimatedTimeLeft: { type: Number, default: 0 },
  bookInfo: { type: Object, default: () => ({ title: '', author: '', cover: null }) },
});

// 圓形進度條偏移量
const circumference = 2 * Math.PI * 45;
const progressOffset = computed(() => {
  return circumference - (props.progress / 100) * circumference;
});
</script>

<style scoped>
.epub-loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.loading-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  max-width: 400px;
  width: 90%;
  text-align: center;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(30px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.book-cover {
  margin-bottom: 1.5rem;
}

.book-cover img {
  max-width: 120px;
  height: auto;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.book-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1a1a1a;
  line-height: 1.4;
}

.book-author {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 2rem;
}

.progress-circle {
  position: relative;
  width: 120px;
  height: 120px;
  margin: 0 auto 1rem;
}

.progress-circle svg {
  transform: rotate(-90deg);
}

.progress-bg {
  fill: none;
  stroke: #e0e0e0;
  stroke-width: 8;
}

.progress-bar {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 8;
  stroke-linecap: round;
  stroke-dasharray: 283;
  transition: stroke-dashoffset 0.3s ease;
}

.progress-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 1.5rem;
  font-weight: 600;
  color: #1a1a1a;
}

.stage-text {
  font-size: 1rem;
  color: #333;
  margin-bottom: 0.5rem;
  font-weight: 500;
}

.eta-text {
  font-size: 0.875rem;
  color: #666;
}

/* 深色模式 */
@media (prefers-color-scheme: dark) {
  .loading-card {
    background: #1f2937;
  }

  .book-title {
    color: #f3f4f6;
  }

  .book-author {
    color: #9ca3af;
  }

  .progress-text {
    color: #f3f4f6;
  }

  .stage-text {
    color: #d1d5db;
  }

  .eta-text {
    color: #9ca3af;
  }

  .progress-bg {
    stroke: #374151;
  }
}
</style>
