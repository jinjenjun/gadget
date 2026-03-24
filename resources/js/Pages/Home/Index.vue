<script setup>
import { ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import '@/../scss/main.scss';

const toolList = ref([
    {
        name: 'Epub檔案轉換器',
        route: '/transformation',
    },

    // TODO: 隱藏開發中程式
    // {
    //     name: 'Epub檔案修復器',
    //     route: '/fix',
    // },
    {
        name: 'PDF亂碼添加器',
        route: '/protection',
    },
]);
</script>
<template>
    <Head title="首頁" />
    <div
        class="text-primary h-[100vh] bg-light-brown flex min-w-[344px] w-full flex-col items-center justify-center overflow-hidden p-[30px] py-[100px] lg:px-[100px]"
    >
        <ol
            class="space-y-5 pl-10 list-disc text-card-title flex flex-col w-full items-start justify-start rounded-lg border-2 bg-white p-5 md:w-[50vw]"
        >
            <li
                v-for="(item, index) in toolList"
                :key="index"
            >
               <a class="underline" :href="item.route">{{ item.name }}</a>
            </li>
        </ol>
    </div>
</template>


