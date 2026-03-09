<script setup>
import { ref } from 'vue';
import '@/../scss/main.scss';

const toolList = ref([
    {
        name: 'Epub檔案轉換器',
        route: '/transformation',
    },
]);
</script>
<template>
    <div
        class="text-primary h-[100vh] bg-light-brown flex w-full flex-col items-center justify-center overflow-hidden p-[30px] py-[100px] lg:px-[100px]"
    >
        <ol
            class="pl-10 list-disc text-card-title flex flex-col w-full items-start justify-start rounded-lg border-2 bg-white p-5 md:w-[50vw]"
        >
            <li
                v-for="(item, index) in toolList"
                :key="index"
            >
                <a class="underline" :href="item.route">
                    {{ item.name }}
                </a>
            </li>
        </ol>
    </div>
</template>


