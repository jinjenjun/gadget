import { ElNotification } from 'element-plus';
import * as helpers from '@/Libs/helpers';
import { getCookie } from '@/Libs/cookie';
import { createUnlockClient, normalizeError } from '@/Libs/axios_core';

const tokenCookieKey = import.meta.env.VITE_API_UNLOCK_TOKEN_KEY || '';

const authReactions = {
  401: {
    title: '登入狀態失效',
    message: '登入狀態已失效，請重新登入',
    action: () => {
      setTimeout(() => {
        helpers.forwardRoute('/login');
      }, 2000);
    },
  },
  419: {
    title: '登入狀態失效',
    message: '登入狀態已失效，請重新登入',
    action: () => {
      setTimeout(() => {
        helpers.forwardRoute('/login');
      }, 2000);
    },
  },
  403: {
    title: '未驗證會員',
    message: '不符合相關資格',
    action: () => {
      setTimeout(() => {
        helpers.forwardRoute('/verify-email');
      }, 2000);
    },
  },
};

export const useErrorHandler = (promise) => {
  return promise.catch((error) => {
    const { statusCode, message } = normalizeError(error);
    const mapping = authReactions[statusCode] || null;

    ElNotification.error({
      title: mapping?.title || '發生錯誤',
      message: mapping?.message || message || '請稍後再試',
      offset: 100,
    });

    mapping?.action?.();

    throw error;
  });
};

export const UNLOCKService = createUnlockClient({
  baseURL: import.meta.env.VITE_API_UNLOCK_ENDPOINT || '',
  tokenCookieKey,
  getCookieToken: getCookie,
  includeLocale: true,
});

export const UNLOCKRequest = (config, { handleError = false } = {}) => {
  const request = UNLOCKService(config);
  return handleError ? useErrorHandler(request) : request;
};
