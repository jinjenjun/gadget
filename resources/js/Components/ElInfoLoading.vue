<script setup>
import { computed } from 'vue';
import '@/../scss/main.scss';

const props = defineProps({
  title: {
    type: String,
    default: '資料載入中',
  },
  stageLabel: {
    type: String,
    default: '',
  },
  progress: {
    type: Number,
    default: null,
  },
  etaSeconds: {
    type: Number,
    default: null,
  },
  showRetry: {
    type: Boolean,
    default: false,
  },
  retryLabel: {
    type: String,
    default: '重新載入',
  },
});

const emit = defineEmits(['retry']);

const progressPercent = computed(() => {
  if (typeof props.progress !== 'number' || Number.isNaN(props.progress)) {
    return null;
  }
  return Math.min(Math.max(props.progress, 0), 1);
});

const readableEta = computed(() => {
  if (typeof props.etaSeconds !== 'number' || Number.isNaN(props.etaSeconds)) return null;
  if (props.etaSeconds <= 0) return null;
  if (props.etaSeconds < 60) return `${Math.ceil(props.etaSeconds)}s`;
  const minutes = Math.floor(props.etaSeconds / 60);
  const seconds = Math.ceil(props.etaSeconds % 60);
  return `${minutes}m ${seconds}s`;
});

const handleRetry = () => {
  emit('retry');
};
</script>

<template>
  <div
    class="fixed inset-0 z-50 z-2000 flex flex-col items-center justify-center bg-black/40 text-white backdrop-blur"
  >
    <div class="text-page-title mb-3">{{ title }}</div>
    <div v-if="stageLabel" class="mb-3 text-sm text-white/80">
      {{ stageLabel }}
    </div>
    <div v-if="progressPercent !== null" class="mb-4 w-full max-w-[360px] px-6">
      <div class="h-2 w-full rounded-full bg-white/20">
        <div
          class="h-2 rounded-full bg-white transition-all duration-300 ease-out"
          :style="{ width: `${Math.round(progressPercent * 100)}%` }"
        />
      </div>
      <div class="mt-2 flex items-center justify-between text-xs text-white/70">
        <span>{{ Math.round(progressPercent * 100) }}%</span>
        <span v-if="readableEta">約 {{ readableEta }}</span>
      </div>
    </div>
    <div v-else class="mb-4 flex space-x-2">
      <span class="dot h-3 w-3 animate-bounce rounded-full bg-white delay-0"></span>
      <span class="dot h-3 w-3 animate-bounce rounded-full bg-white delay-200"></span>
      <span class="dot delay-400 h-3 w-3 animate-bounce rounded-full bg-white"></span>
    </div>
    <button
      v-if="showRetry"
      type="button"
      class="rounded-full border border-white/60 px-4 py-1 text-xs text-white/90 transition hover:border-white hover:text-white"
      @click="handleRetry"
    >
      {{ retryLabel }}
    </button>
  </div>
</template>
