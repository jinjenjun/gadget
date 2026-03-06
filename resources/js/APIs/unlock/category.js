import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const getCategory = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
    }),
  );
