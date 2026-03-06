import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const addToCart = (data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url: '/cart',
      data,
    }),
  );

export const removeCartItem = (data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url: '/cart/remove',
      data,
    }),
  );

export const addCheckoutItem = (data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url: '/checkout/add',
      data,
    }),
  );

export const removeCheckoutItem = (data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url: '/checkout/remove',
      data,
    }),
  );
