<script setup>
import { ref, onMounted, computed } from 'vue';
import * as APIs from '@/APIs';
import * as helpers from '@/Libs/helpers';
import UserAvatar from '@/Components/UserAvatar.vue';
import ElInfoLike from '@/Components/ElInfoLike.vue';
import ElIconButton from '@/Components/ElIconButton.vue';
import * as validation from '@/Libs/validation.js';

const props = defineProps({
  modelType: {
    type: String,
    required: true,
  },
  modelId: {
    type: String,
    required: true,
  },
  authorId: {
    type: [String, Number],
    default: null,
  },
});

const comments = ref({
  data: [],
  next_page_url: null,
});

const newComment = ref('');

const onInputSanitize = (event) => {
  newComment.value = helpers.sanitizeInput(event.target.value);
};

const checkStatus = ref(false);

const checkNameList = ref({
  comment: '留言',
});

const checkErrorList = ref({
  commentError: computed(() =>
    validation.messageContent.checkEmpty(newComment.value, checkNameList.value.comment),
  ),
});

const fetchComments = (url = null) => {
  APIs.unlock.main
    .getCommentMessage(
      url || route('platform.comment.index', { model: props.modelType, id: props.modelId }),
    )
    .then((res) => {
      if (url && url !== comments.value.first_page_url) {
        comments.value.data.push(...res.data.data);
        comments.value.next_page_url = res.data.next_page_url;
      } else {
        comments.value = res.data;
      }
    });
};

const submitComment = () => {
  checkStatus.value = true;
  const noErrors = Object.values(checkErrorList.value).every((error) => error === '');
  if (noErrors) {
    APIs.unlock.main
      .addCommentMessage(
        route('platform.comment.submit', { model: props.modelType, id: props.modelId }),
        {
          comment: newComment.value,
        },
      )
      .then((res) => {
        comments.value.data.unshift(res.data.comment);
        newComment.value = '';
        checkStatus.value = false;
        ElNotification.success({
          title: '留言發布成功',
          offset: 100,
        });
      });
  }
};

const loadMore = () => {
  if (comments.value.next_page_url) {
    fetchComments(comments.value.next_page_url);
  }
};

const removeMore = () => {
  if (comments.value.first_page_url) {
    fetchComments(comments.value.next_page_url);
  }
};

onMounted(() => {
  fetchComments();
});

const isCommentAuthor = (comment) => {
  if (props.authorId === null || props.authorId === undefined) {
    return false;
  }

  if (! comment?.user?.id) {
    return false;
  }

  return String(comment.user.id) === String(props.authorId);
};
</script>
<template>
  <div class="w-full">
    <div class="mb-10 flex w-full flex-col items-end">
      <div class="mb-6 flex w-full flex-row items-center">
        <i class="ri-message-3-line text-card-title pr-2"></i>
        <span class="text-card-title">{{ $t('cruds.comment.title') }}</span>
      </div>
      <textarea
        class="text-card-description bg-background placeholder:text-card-description focus:ring-primary-500 block h-[112px] w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-gray-300 ring-inset placeholder:text-gray-400 focus:ring-2 focus:ring-inset"
        :value="newComment"
        @input="onInputSanitize"
        placeholder="新增評論"
      ></textarea>
      <span
        class="color-alert-danger text-card-description mt-2 w-full font-bold"
        v-if="checkStatus"
        >{{ checkErrorList.commentError }}</span
      >
      <ElIconButton
        @click="submitComment"
        class="mt-5"
        :icon-button-prop="{ name: '回覆', icon: 'ri-arrow-right-s-line', paddingRight: '5px' }"
      />
    </div>
    <div
      v-for="(comment, index) in comments.data"
      :key="comment.id"
      :class="{ 'border-light-gray border-b-2': index !== comments.data.length - 1 }"
    >
      <div class="flex flex-col py-6">
        <div class="flex w-full flex-row items-center justify-between pb-5">
          <div class="flex flex-row items-center">
            <div class="relative">
              <UserAvatar
                :avatar-url="comment.user.avatar_url"
                width="md:w-12 sm:w-7 w-6"
                height="md:h-12 sm:h-7 h-6"
              />
              <i
                v-if="isCommentAuthor(comment)"
                class="ri-vip-crown-fill absolute md:-top-3 md:-left-1 md:text-lg sm:-top-2.5 sm:-left-1.5 sm:text-sm -top-2 -left-1 text-xs text-amber-400 drop-shadow"
                style="transform: rotate(-40deg);"
                aria-hidden="true"
              />
            </div>
            <span class="text-card-title pl-4">{{ comment.user.name }}</span>
          </div>
          <ElInfoLike :model-id="comment.id.toString()" model-type="filamentComment" />
        </div>
        <span class="text-card-description">{{ comment.comment }}</span>
      </div>
    </div>
    <div>
      <button
        v-if="comments.next_page_url"
        @click="loadMore"
        class="group text-primary-500 hover:text-bright relative flex w-full items-center justify-center py-2 text-lg font-bold"
      >
        <span class="relative flex w-full items-center justify-center">
          <span
            class="absolute inset-x-0 top-1/2 -translate-y-1/2 transform border-t border-gray-300"
          ></span>
          <span class="text-card-title bg-background relative z-10 px-4">
            展開更多
            <i class="ri-arrow-down-s-line ml-2" />
          </span>
        </span>
      </button>
      <button
        v-if="!comments.next_page_url && comments.total > comments.per_page"
        @click="removeMore"
        class="group hover:text-primary-500 relative flex w-full items-center justify-center py-2 text-lg font-bold"
      >
        <span class="relative flex w-full items-center justify-center">
          <span
            class="absolute inset-x-0 top-1/2 -translate-y-1/2 transform border-t border-gray-300"
          ></span>
          <span class="text-card-title bg-background relative z-10 px-4">
            收起內容
            <i class="ri-arrow-up-s-line ml-2" />
          </span>
        </span>
      </button>
    </div>
  </div>
</template>
