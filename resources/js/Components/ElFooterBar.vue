<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useStore } from 'vuex';
import { vuexData } from '@/../store';
import "@/../scss/main.scss";

const store = useStore();
const screenWidth = ref(window.innerWidth);
const showBackToTop = ref(false);

const props = defineProps({
  footerBarProp: Array,
});

const emit = defineEmits(['footerBarEmit']);

const handleScroll = () => {
  showBackToTop.value = window.scrollY > 100;
  updateIcon();
};

const updateIcon = () => {
  const backToTopBtn = document.querySelector('.back-to-top');
  if (backToTopBtn) {
    backToTopBtn.style.bottom = showBackToTop.value
      ? screenWidth.value >= 1024 ? '50px'
        : screenWidth.value >= 768 ? '50px'
          : '80px'
      : '-100px';
  }
};

const backToTop = (e) => {
  e.preventDefault();
  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const forwardInfoRoute = (data) => {
  vuexData.unlock.information.setTitle(store, data);
  window.open('/information', '_blank', 'noopener,noreferrer');
};

onMounted(() => {
  updateIcon();
  window.addEventListener('scroll', handleScroll);
  window.addEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateIcon();
  });
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  window.removeEventListener('resize', () => {
    screenWidth.value = window.innerWidth;
    updateIcon();
  });
});
</script>

<template>
  <div class="blur-transition flex flex-col items-center justify-between sm:w-full md:flex-row px-5 pt-[40px] pb-[20px] md:pb-[50px]">
    <div class="w-[50%] md:w-[35%] lg:w-[25%]">
      <div class="text-start flex justify-between items-start">
        <div class="flex flex-col" v-for="(categoryItem, categoryIndex) in footerBarProp" :key="categoryIndex">
          <span class="block font-bold text-sm lg:text-base py-1">{{ categoryItem.category }}</span>
          <div v-for="(contentItem, contentIndex) in categoryItem.content" :key="contentIndex">
            <div class="col-span-12 flex justify-start items-center" :class="{ 'disable-execution': !contentItem.allow }">
              <a class="text-xs lg:text-sm py-1 cursor-pointer" @click="forwardInfoRoute(contentItem.title)">{{ contentItem.title }}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="flex py-[30px]">
      <span class="text-xs lg:text-sm">Copyright © Unlocking today. All Rights Reserved.</span>
    </div>
  </div>
  <div
    v-if="showBackToTop"
    class="back-to-top blur-transition text-secondary border-secondary fixed bottom-[-100px] right-[10px] z-10 flex h-[100px] w-[100px] scale-50 cursor-pointer items-center justify-center rounded-full border-2 bg-white lg:scale-75 active:scale-[40%] transition-all duration-500 ease-in-out"
    @click="backToTop"
  >
    <i class="ri-arrow-up-double-fill text-6xl" />
  </div>
</template>
