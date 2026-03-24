import * as helpers from '@/Libs/helpers';
import { getCookie } from '@/Libs/cookie';
import { createUnlockClient, normalizeError } from '@/Libs/axios_core';

const tokenCookieKey = import.meta.env.VITE_API_UNLOCK_TOKEN_KEY || '';
const AUTH_REDIRECT_DELAY_MS = 2000;
const AUTH_REDIRECT_LOCK_KEY = '__EPUB_AUTH_REDIRECT_LOCK__';

const resolveAppBaseUrl = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  return window.__APP_API_BASE__ || '';
};

const resolveAppToken = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  const storageKey = window.__APP_TOKEN_STORAGE_KEY__;
  if (!storageKey) {
    return '';
  }

  const token = window.localStorage?.getItem(storageKey) || '';
  if (!token) {
    return '';
  }

  return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
};

const resolveCurrentPath = () => {
  if (typeof window === 'undefined') {
    return '/';
  }

  return `${window.location.pathname}${window.location.search}${window.location.hash}`;
};

const resolveLoginRedirectUrl = () => {
  const currentPath = resolveCurrentPath();
  const encodedPath = encodeURIComponent(currentPath || '/');

  return `/login?redirect=${encodedPath}`;
};

const scheduleLoginRedirect = () => {
  if (typeof window === 'undefined') {
    return;
  }

  if (window.location.pathname.startsWith('/login')) {
    return;
  }

  if (window[AUTH_REDIRECT_LOCK_KEY]) {
    return;
  }

  window[AUTH_REDIRECT_LOCK_KEY] = true;
  const loginUrl = resolveLoginRedirectUrl();

  window.setTimeout(() => {
    helpers.forwardRoute(loginUrl);
  }, AUTH_REDIRECT_DELAY_MS);
};

const authReactions = {
  401: {
    title: '登入狀態失效',
    message: '登入狀態已失效，請重新登入',
    action: scheduleLoginRedirect,
  },
  419: {
    title: '登入狀態失效',
    message: '登入狀態已失效，請重新登入',
    action: scheduleLoginRedirect,
  },
};

export const useErrorHandler = (promise) => {
  return promise.catch((error) => {
    const { statusCode, message } = normalizeError(error);
    const mapping = authReactions[statusCode] || null;

    // 🔥 原本錯誤
    console.error(
      `title: ${mapping?.title || '發生錯誤'}, message: ${mapping?.message || message || '請稍後再試'}`
    );

    // 🔥 加這段（關鍵）
    console.log("🔥 完整錯誤:", error);

    if (error.response) {
      console.log("🔥 後端回傳:", error.response.data);
    }

    mapping?.action?.();

    throw error;
  });
};

export const UNLOCKService = createUnlockClient({
  baseURL: import.meta.env.VITE_API_UNLOCK_ENDPOINT || '',
  tokenCookieKey,
  getCookieToken: getCookie,
  includeAppToken: true,
  resolveAppToken,
  resolveBaseUrl: resolveAppBaseUrl,
});

export const UNLOCKRequest = (config, { handleError = false } = {}) => {
  const request = UNLOCKService(config);
  return handleError ? useErrorHandler(request) : request;
};
