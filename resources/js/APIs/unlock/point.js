import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const purchase = (data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url: '/purchase',
      data,
    }),
  );
