<template>
  <div class="watermark-container print-watermark"></div>
</template>

<script setup lang="ts">
import treeImageUrl from '@/../images/tree.png';

const treeBackgroundImage = `url('${treeImageUrl}')`;
</script>

<style scoped>
.watermark-container {
  top: 10%;
  left: 0;
  width: 100%;
  height: 70%;
  pointer-events: none;
  user-select: none;
  z-index: 0;
  position: fixed;

  background-image: v-bind(treeBackgroundImage);
  background-repeat: space;
  background-size: 150px auto;
  opacity: 0.05;
  filter: grayscale(1);

  transform-origin: center center;
}

@media screen and (min-width: 768px) and (max-width: 1023px) {
  .watermark-container {
    background-size: 120px auto;
  }
}

@media screen and (max-width: 767px) {請協助 commit
  .watermark-container {
    background-size: 100px auto;
  }
}
</style>
<style>
@media print {
  .print-watermark {
    display: block !important;
    position: fixed !important;
    top: 10%;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-image: v-bind(treeBackgroundImage);
    background-repeat: space;
    background-size: 150px auto;
    opacity: 0.1 !important;
    z-index: 9999;
  }

  body {
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
}
</style>
