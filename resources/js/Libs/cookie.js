export function setCookie(name, value, expireDays) {
  const d = new Date();
  d.setTime(d.getTime() + expireDays * 24 * 60 * 60 * 1000);
  const expires = 'expires=' + d.toUTCString();
  document.cookie =
    name +
    '=' +
    (typeof value === 'string' ? value : JSON.stringify(value)) +
    ';' +
    expires +
    ';path=/';
}

export function getCookie(name) {
  const decodedCookie = decodeURIComponent(document.cookie);
  return decodedCookie
    ? decodedCookie
        .split(';')
        .map((str) => str.trim())
        .reduce((o, str) => {
          const [key, val] = str.split('=');
          try {
            o[key] = JSON.parse(val);
          } catch (error) {
            o[key] = val;
          }
          return o;
        }, {})[name]
    : null;
}

export function deleteCookie(name) {
  const d = new Date();
  const expires = 'expires=' + d.toUTCString();
  document.cookie = name + '=;' + expires + ';path=/';
}

export function clearAllCookies() {
  document.cookie.split(';').forEach((c) => {
    document.cookie = c
      .replace(/^ +/, '')
      .replace(/=.*/, '=;expires=' + new Date().toUTCString() + ';path=/');
  });
}
