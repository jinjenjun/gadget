import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_debug.js';

export const setReadData = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const getReadData = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
    }),
  );

export const getEpubKey = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
    }),
  );

export const getEpubFile = (url, config = {}) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
      ...config,
    }),
  );

export const getEpubBootstrap = (url, config = {}) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
      ...config,
    }),
  );

export const getDownloadToken = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const getDownloadUrl = (url, params) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'GET',
      url,
      params,
    }),
  );

export const syncHighlights = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const docToEpub = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const epubTransformation = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const epubFix = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const clearTempData = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );
