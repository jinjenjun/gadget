import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const updateRating = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const updateReview = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );
