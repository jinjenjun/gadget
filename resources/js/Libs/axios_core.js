import axios from 'axios';

export const getCsrfToken = () => {
  if (typeof document === 'undefined') {
    return undefined;
  }

  const token = document.head
    ?.querySelector('meta[name="csrf-token"]')
    ?.getAttribute('content');

  return token || undefined;
};

export const resolveLocale = () => {
  if (typeof document !== 'undefined') {
    const htmlLocale = document.documentElement?.lang;
    if (htmlLocale) {
      return htmlLocale;
    }
  }

  if (typeof navigator !== 'undefined' && navigator.language) {
    return navigator.language;
  }

  return 'zh-TW';
};

export const normalizeError = (error) => {
  const statusCode = error?.response?.status ?? error?.status ?? null;
  const responseData = error?.response?.data;

  let message = '';
  if (typeof responseData?.message === 'string') {
    message = responseData.message;
  } else if (typeof responseData === 'string') {
    message = responseData;
  } else if (typeof error?.message === 'string') {
    message = error.message;
  }

  return {
    statusCode,
    message,
    error,
  };
};

export const resolveAuthToken = ({
  headers,
  tokenCookieKey,
  getCookieToken,
  includeAppToken = false,
  resolveAppToken,
}) => {
  const headerToken = headers.Authorization || headers.authorization || '';
  const cookieToken =
    tokenCookieKey && typeof getCookieToken === 'function' ? getCookieToken(tokenCookieKey) : '';
  const appToken = includeAppToken && typeof resolveAppToken === 'function' ? resolveAppToken() : '';

  return headerToken || cookieToken || appToken || '';
};

export const createUnlockClient = ({
  baseURL,
  tokenCookieKey,
  getCookieToken,
  includeAppToken = false,
  resolveAppToken,
  includeLocale = false,
  resolveBaseUrl,
  onResponseError,
}) => {
  const instance = axios.create({
    baseURL,
    withCredentials: true,
    headers: {
      'X-Requested-With': 'XMLHttpRequest',
      Accept: 'application/json',
    },
  });

  instance.interceptors.request.use(
    (config) => {
      const headers = config.headers ?? {};

      if (typeof resolveBaseUrl === 'function') {
        const dynamicBaseUrl = resolveBaseUrl();
        if (dynamicBaseUrl) {
          config.baseURL = dynamicBaseUrl;
        }
      }

      headers['X-Requested-With'] = headers['X-Requested-With'] || 'XMLHttpRequest';
      headers.Accept = headers.Accept || 'application/json';

      if (includeLocale) {
        headers['Accept-Language'] = headers['Accept-Language'] || resolveLocale();
      }

      const authToken = resolveAuthToken({
        headers,
        tokenCookieKey,
        getCookieToken,
        includeAppToken,
        resolveAppToken,
      });

      if (authToken) {
        headers.Authorization = authToken;
      } else {
        delete headers.Authorization;
      }

      const csrfToken = headers['X-CSRF-TOKEN'] || getCsrfToken();
      if (csrfToken) {
        headers['X-CSRF-TOKEN'] = csrfToken;
      }

      config.headers = headers;
      return config;
    },
    (error) => Promise.reject(error),
  );

  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      if (typeof onResponseError === 'function') {
        onResponseError(error);
      }

      return Promise.reject(error);
    },
  );

  return instance;
};
