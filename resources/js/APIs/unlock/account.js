import { UNLOCKRequest, useErrorHandler } from '@/Libs/axios_vue.js';

export const login = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const logout = (url) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
    }),
  );

export const register = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const resetPassword = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const verifyEmail = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const forgotPassword = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const confirmPassword = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'POST',
      url,
      data,
    }),
  );

export const reviseProfile = (url, data) =>
  useErrorHandler(
    UNLOCKRequest({
      method: 'PATCH',
      url,
      data,
    }),
  );
