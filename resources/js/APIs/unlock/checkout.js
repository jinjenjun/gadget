import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_debug.js';

export const addOrder = (data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url: '/order/create',
      data,
    }),
  );

export const setMemberCouponCode = (data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url: '/coupon/set-member-coupon',
      data,
    }),
  );

export const setPromotionCouponCode = (data, { handleError = true } = {}) => {
  const request = UNLOCKRequest(
    {
      method: 'POST',
      url: '/coupon/set-promotion-coupon',
      data,
    },
    { handleError: false },
  );

  return handleError ? useErrorHandler(request) : request;
};
