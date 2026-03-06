<script setup>
import { ref, defineExpose } from 'vue';
import '@/../scss/main.scss';

const visible = ref(false)
const message = ref('')
let resolve

function open(htmlMessage) {
  message.value = htmlMessage
  visible.value = true

  return new Promise((res) => {
    resolve = res
  })
}

function confirm() {
  visible.value = false
  resolve('confirm')
}

function cancel() {
  visible.value = false
  resolve('cancel')
}

defineExpose({ open })
</script>
<template>
  <Teleport to="body">
    <div v-if="visible" class="fast-blur-transition fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg shadow-xl p-6 w-[90%] max-w-lg">
        <div v-html="message" class="text-gray-800 leading-relaxed"></div>

        <div class="mt-6 flex justify-end space-x-3">
          <button @click="cancel" class="px-4 py-2 bg-gray-300 text-gray-700 rounded">取消</button>
          <button @click="confirm" class="px-4 py-2 bg-secondary text-white rounded">確認</button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
