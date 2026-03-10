<script setup>
import { ref, onMounted } from 'vue';
import { Head } from '@inertiajs/vue3';
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
        const res = await APIs.unlock.reader.epubTransformation(
            route('transformation.epub'),
            fd,
        );

        ElNotification({
            title: '轉檔完成',
            message: 'Epub檔案內容已成功轉換。',
            type: 'success',
            offset: 100,
        });

        epubReaderData.value.outputFileUrl = res.data.epub_url;
        helpers.devConsole.log('Epub轉檔成功結果:', res.data);
    } catch (err) {
        const logData = err.response?.data || err.message || err;
        ElNotification({
            title: '轉檔失敗',
            message: '轉換Epub檔案時發生錯誤，請稍後再試。',
            type: 'error',
            offset: 100,
        });
        helpers.devConsole.error('Epub轉檔失敗結果:', logData);
    } finally {
        uploading.value = false;
        isLoading.value = false;
    }
}

const clearEpubData = async () => {
    try {
        await APIs.unlock.reader.clearTempData(
            route('transformation.cleanup')
        );

        helpers.devConsole.log('清除暫存檔案成功');

    } catch (err) {
        const logData = err.response?.data || err.message || err;

        ElNotification({
            title: '刪除失敗',
            message: '刪除檔案時發生錯誤，請稍後再試。',
            type: 'error',
            offset: 100,
        });

        helpers.devConsole.error('清除暫存檔案失敗', logData);
    }
};

const resetData = () => {
    epubReaderData.value = {
        outputFileUrl: '',
        active: false,
    };
    file.value = null;
    clearEpubData();
};

function downloadFile() {
    if (!epubReaderData.value.outputFileUrl) return;

    const timestamp = Date.now();
    const filename = `converted_${timestamp}.epub`;

    const link = document.createElement('a');
    link.href = epubReaderData.value.outputFileUrl;
    link.download = filename;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

onMounted(() => {
    resetData();
})
</script>
<template>
    <Head title="轉換器" />
    <ElInfoLoading v-if="isLoading" />
    <div
        class="text-primary flex w-full items-center justify-center bg-gray-300"
        :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
        v-if="!epubReaderData.active"
    >
        <div
            class="min-w-[344px] bg-light-brown flex w-full flex-col items-center justify-center overflow-hidden p-[30px] py-[100px] lg:px-[100px]"
            :style="{ height: 'calc(var(--vh, 1vh) * 100)' }"
        >
            <div ref="viewer" class="slow-blur-transition hidden h-full w-full" />
            <div class="text-card-title flex w-full flex-col items-center justify-center">
                <div
                    class="flex flex-col w-full items-center justify-start rounded-lg border-2 bg-white p-5 md:w-[50vw]"
                >
                    <div
                        class="flex w-full flex-col items-start justify-center p-5 md:w-[50vw]"
                        v-if="!epubReaderData.outputFileUrl"
                    >
                        <p class="mb-5">Epub檔案轉換器:</p>
                        <div class="flex space-x-2 justify-center items-center">
                            <input
                                type="file"
                                accept=".epub"
                                @change="onChange"
                                class="cursor-pointer w-full rounded !text-xs md:mb-0 p-[6px] lg:p-3 file:p-1 file:border-0 file:text-white file:rounded file:bg-orange-700 hover:file:cursor-pointer"
                            />
                            <ElInfoButton @click="upload" :disabled="uploading">
                                {{ uploading ? '轉檔中...' : '開始轉換' }}
                            </ElInfoButton>
                        </div>
                    </div>
                    <div class="flex flex-col w-full items-start justify-center p-5 md:w-[50vw]" v-if="epubReaderData.outputFileUrl">
                        <div class="flex justify-start items-center py-3 space-x-2">
                            <p>下載檔案:</p>
                            <ElInfoButton @click="downloadFile">下載</ElInfoButton>
                        </div>
                        <div class="flex justify-start items-center py-3 space-x-2">
                            <p>返回轉換器:</p>
                            <ElInfoButton @click="resetData">返回</ElInfoButton>
                        </div>
                    </div>
                </div>
                <!--        TODO: 隱藏閱讀完成版的按鈕, 開發需要時再打開-->
                <!--        <div class="w-full flex flex-col items-start justify-start md:w-[50vw] opacity-0">-->
                <!--          <ElInfoButton @click="epubReaderData.active = true">閱讀</ElInfoButton>-->
                <!--        </div>-->
                <ElEpubReaderTrial v-if="epubReaderData.active" />
                <div class="w-full flex flex-col items-end justify-end md:w-[50vw] mt-5 underline">
                    <a href="/">返回首頁</a>
                </div>
            </div>
        </div>
    </div>
</template>

