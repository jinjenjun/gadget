<script setup>
import { ref } from 'vue';
import * as helpers from '@/Libs/helpers';
import * as APIs from '@/APIs';
import ElEpubReaderTrial from '@/Components/ElEpubReaderTrial.vue';
import ElInfoButton from '@/Components/ElInfoButton.vue';
import ElInfoLoading from '@/Components/ElInfoLoading.vue';

const isLoading = ref(false);
const file = ref(null);
const uploading = ref(false);
const epubReaderData = ref({
  outputFileUrl: '',
  active: false,
});

function onChange(e) {
  file.value = e.target.files[0];
}

async function upload() {
  if (!file.value) {
    ElNotification({
      title: '請選擇檔案',
      message: '請於本機選擇上傳檔案',
      type: 'warning',
      offset: 100,
    });
    return;
  }

  const fd = new FormData();
  fd.append('file', file.value);

  uploading.value = true;
  isLoading.value = true;
  try {
    const res = await APIs.unlock.reader.docToEpub(route('test.epub.docx-to-epub'), fd);
    ElNotification({
      title: '轉檔完成',
      message: '已成功轉換為Epub檔案，請點擊觀看電子書按鈕。',
      type: 'success',
      offset: 100,
    });
    epubReaderData.value.outputFileUrl = res.data.epub_url;
    helpers.devConsole.log('Epub轉檔成功結果:', res.data);
  } catch (err) {
    ElNotification({
      title: '轉檔失敗',
      message: '轉換Epub檔案時發生錯誤，請稍後再試。',
      type: 'error',
      offset: 100,
    });
    helpers.devConsole.error('Epub轉檔失敗結果:', res.data);
  } finally {
    uploading.value = false;
  }
  isLoading.value = false;
}

const emitEpubReader = async (data) => {
  epubReaderData.value = data;
  file.value = null;
  APIs.unlock.reader.clearTempData(route('test.epub.cleanup-all'));
};
</script>

<template>
  <ElInfoLoading v-if="isLoading" />
  <div
    class="text-primary flex w-full items-center justify-center bg-gray-300"
    :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
    v-if="!epubReaderData.active"
  >
    <div
      class="bg-light-brown flex w-full flex-col items-center justify-center overflow-hidden p-[30px] py-[100px] lg:px-[100px]"
      :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
    >
      <div ref="viewer" class="slow-blur-transition hidden h-full w-full" />
      <div class="text-card-title flex w-full flex-col items-center justify-center">
        <div
          class="flex w-full flex-col items-start justify-center rounded-lg border-2 bg-white p-5 md:w-[50vw]"
          v-if="!epubReaderData.outputFileUrl"
        >
          <p class="mb-5">Word轉換Epub檔案:</p>
          <div class="flex flex-col space-x-2 md:flex-row">
            <input
              type="file"
              accept=".doc,.docx"
              @change="onChange"
              class="mb-2 w-full rounded !text-xs md:mb-0 md:py-1"
            />
            <ElInfoButton @click="upload" :disabled="uploading">
              {{ uploading ? '轉檔中...' : '轉換Epub' }}
            </ElInfoButton>
          </div>
        </div>
        <div
          class="flex w-full items-center justify-start rounded-lg border-2 bg-white p-5 md:w-[50vw]"
          v-if="epubReaderData.outputFileUrl"
        >
          <p class="pr-5">Epub電子書檔案:</p>
          <ElInfoButton @click="epubReaderData.active = true">觀看電子書</ElInfoButton>
        </div>
      </div>
    </div>
  </div>
  <ElEpubReaderTrial
    :epub-reader-prop="epubReaderData"
    @epub-reader-emit="emitEpubReader"
    v-if="epubReaderData.active"
  />
</template>
