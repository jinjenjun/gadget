import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const addComment = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'PATCH',
      url,
      data,
    }),
  );

export const getRate = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
      data,
    }),
  );

export const fastCheckout = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );
