<script setup>
import { ref, watch, computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true
  },
  pageSize: {
    type: Number,
    default: 10
  },
  total: {
    type: Number,
    required: true
  },
  pagerCount: {
    type: Number,
    default: 5
  }
});

const emit = defineEmits(['page-change']);

const totalPages = computed(() => Math.ceil(props.total / props.pageSize));

const isFirstPage = computed(() => props.currentPage <= 1);
const isLastPage = computed(() => props.currentPage >= totalPages.value);

const getPages = computed(() => {
  const pages = [];
  const half = Math.floor(props.pagerCount / 2);
  let start = Math.max(1, props.currentPage - half);
  let end = Math.min(totalPages.value, props.currentPage + half);

  if (end - start + 1 < props.pagerCount) {
    if (start === 1) {
      end = Math.min(totalPages.value, start + props.pagerCount - 1);
    } else if (end === totalPages.value) {
      start = Math.max(1, end - props.pagerCount + 1);
    }
  }

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  return pages;
});

const goToPage = (page) => {
  if (page !== props.currentPage && page >= 1 && page <= totalPages.value) {
    emit('page-change', page);
  }
};

</script>

<template>
  <nav class="custom-pagination text-card-title font-normal" v-if="props.total > 0">
    <button :disabled="isFirstPage" @click="goToPage(currentPage - 1)">
      <i class="ri-arrow-left-s-line" />
    </button>

    <button
      v-if="getPages[0] > 1"
      @click="goToPage(1)"
    >1</button>

    <span v-if="getPages[0] > 2">...</span>

    <button
      v-for="page in getPages"
      :key="page"
      :class="{ active: page === currentPage }"
      @click="goToPage(page)"
    >
      {{ page }}
    </button>

    <span v-if="getPages[getPages.length - 1] < totalPages">...</span>

    <button
      v-if="getPages[getPages.length - 1] < totalPages"
      @click="goToPage(totalPages)"
    >{{ totalPages }}</button>

    <button :disabled="isLastPage" @click="goToPage(currentPage + 1)">
      <i class="ri-arrow-right-s-line" />
    </button>
  </nav>
</template>

<style scoped>
.custom-pagination {
  display: flex;
  gap: 6px;
  justify-content: center;
  align-items: center;
  flex-wrap: wrap;
}
.custom-pagination button {
  padding: 5px 10px;
  cursor: pointer;
  transition: 0.2s;
}
.custom-pagination button.active {
  color: #d55928;
}
.custom-pagination button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.custom-pagination span {
  padding: 5px 10px;
}
</style>
