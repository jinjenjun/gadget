import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const loadUnit = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
    }),
  );

export const fetchUnitHistory = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
    }),
  );

export const syncCourseHistoryToBackend = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const uploadVimeoLink = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
    }),
  );
