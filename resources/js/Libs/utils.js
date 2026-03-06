import CryptoJS from 'crypto-js';
import { ElNotification } from 'element-plus';
import * as APIs from '@/APIs/index.js';

export function encryptAES(text, password) {
  if (!text || !password) throw new Error('text和password不可為空');
  return CryptoJS.AES.encrypt(text, password).toString();
}

export function decryptAES(ciphertext, password) {
  if (!ciphertext || !password) throw new Error('ciphertext和password不可為空');
  try {
    const bytes = CryptoJS.AES.decrypt(ciphertext, password);
    const decryptedText = bytes.toString(CryptoJS.enc.Utf8);
    if (!decryptedText) throw new Error('解密失敗');
    return decryptedText;
  } catch (error) {
    throw new Error('解密錯誤：' + error.message);
  }
}

export const pointRedeem = async (modelType, productId, gtmEvent, productName, quantity) => {
  try {
    const { data } = await APIs.unlock.point.purchase({
      model: modelType,
      id: productId,
    });

    ElNotification.success({
      title: '送出成功',
      message: `${data.message}`,
      offset: 100,
    });

    window.dataLayer = window.dataLayer || [];

    if (gtmEvent) {
      window.dataLayer.push({
        event: gtmEvent,
        ecommerce: {
          items: [
            {
              item_id: productId || '無相關資料',
              item_name: productName || '無相關資料',
              model_type: modelType || '無相關資料',
              list_price: '無相關資料',
              sales_price: '無相關資料',
              quantity: quantity || '無相關資料',
            },
          ],
        },
      });
    }
    return true;
  } catch (error) {
    return false;
  }
};

export const getAllCategories = async () => {
  const paths = {
    post: '/posts/categories',
    section: '/sections/categories',
    serial: '/serials/categories',
  };

  const entries = await Promise.all(
    Object.entries(paths).map(async ([key, path]) => {
      const res = await APIs.unlock.category.getCategory(path);
      return [key, res?.data?.data ?? []];
    }),
  );

  return Object.fromEntries(entries);
};
