import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const getLikeCount = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
    }),
  );

export const addLike = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
    }),
  );

export const getBookmarkCount = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
    }),
  );

export const addBookmark = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
    }),
  );

export const getCommentMessage = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
    }),
  );

export const addCommentMessage = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );
