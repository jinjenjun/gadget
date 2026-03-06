<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { usePage } from '@inertiajs/vue3';

const props = usePage().props;
const result = ref(props.result || null);
const text = ref('');
const loading = ref(false);

const submit = async () => {
    if (!text.value) return;

    loading.value = true;

    try {
        const response = await axios.post('/transformation', { text: text.value });
        result.value = response.data;
        text.value = '';
    } catch (error) {
        console.error(error);
        alert('轉換失敗，請檢查控制台');
    } finally {
        loading.value = false;
    }
};
</script>

<template>
    <div class="p-4 max-w-xl mx-auto">
        <h1 class="text-2xl font-bold mb-4">轉換器範例</h1>

        <textarea
            v-model="text"
            class="border p-2 w-full h-32"
            placeholder="輸入文字..."
            :disabled="loading"
        ></textarea>

        <button
            @click="submit"
            class="mt-2 px-4 py-2 bg-blue-500 text-white rounded"
            :disabled="loading"
        >
            {{ loading ? '轉換中...' : '轉換' }}
        </button>

        <div v-if="result" class="mt-4 p-2 border bg-gray-100">
            <p><strong>原文:</strong> {{ result.original }}</p>
            <p><strong>轉換後:</strong> {{ result.transformed }}</p>
        </div>
    </div>
</template>
