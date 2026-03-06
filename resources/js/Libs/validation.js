import validator from 'validator';

export const messageContent = {
  checkEmpty: (itemContent, itemName) => {
    if (!itemName) {
      itemName = '此欄位';
    }
    return validator.isEmpty(itemContent) ? `* ${itemName}為必填` : '';
  },

  checkEmail: (emailContent, emailName) => {
    if (!emailName) {
      emailName = '此欄位';
    }
    if (validator.isEmpty(emailContent)) {
      return `* ${emailName}為必填`;
    }
    return validator.isEmail(emailContent) ? '' : `* ${emailName}網址格式錯誤`;
  },

  checkPassword: (passwordContent, passwordName) => {
    if (!passwordName) {
      passwordName = '此欄位';
    }
    return validator.isEmpty(passwordContent) ? `* ${passwordName}為必填` : '';
  },

  checkPasswordConfirm: (passwordContent, passwordConfirmContent, passwordConfirmName) => {
    if (!passwordConfirmName) {
      passwordConfirmName = '此欄位';
    }
    return validator.isEmpty(passwordConfirmContent)
      ? `* ${passwordConfirmName}為必填`
      : passwordContent !== passwordConfirmContent
        ? '* 密碼不一致'
        : '';
  },
};
