import * as helpers from "@/Libs/helpers";

export const forwardRoute = (route) => {
  window.location.assign(route);
};

export const forwardRouteBlank = (route) =>
  window.open(route, "_blank", "noopener", "noreferrer");

export const generateHref = (item) => {
  if (item?.href) return item.href;
  if (!item?.route) return null;
  if (typeof route === "function") {
    if (item?.routeParams) return route(item.route, item.routeParams);
    return route(item.route, { id: item.id });
  }
  return "#";
};

export const generateUlidHref = (item) => {
  if (typeof route === "function") {
    return item.route ? route(item.route, { id: item.ulid }) : null;
  }
  return "#";
};

export const generateTarget = (item) =>
  item.isTargetBlank ? "_blank" : "_self";

export const priceTag = (listPrice, salesPrice) => {
  const list = Number(String(listPrice).replace(/,/g, ""));
  const sale = Number(String(salesPrice).replace(/,/g, ""));

  if (isNaN(list) || isNaN(sale)) return "價格";

  if (list === 0 || sale === 0) return "免費";
  return list === sale ? "售價" : "優惠價";
};

export const showPrice = (listPrice, salesPrice) => {
  const list = Number(String(listPrice).replace(/,/g, ""));
  const sale = Number(String(salesPrice).replace(/,/g, ""));

  if (isNaN(list) || isNaN(sale)) return "尚無資料";
  return list === sale ? list.toLocaleString() : sale.toLocaleString();
};

export const parseNumber = (input) => {
  if (input === undefined || input === null) return 0;

  const str = String(input).replace(/,/g, "").trim();
  const num = Number(str);

  return isNaN(num) ? 0 : num;
};

export const withComma = (num) => {
  const parsed = Number(String(num).replace(/,/g, ""));
  if (isNaN(parsed)) return "尚無資料";
  return parsed.toLocaleString();
};

export const largeNumberComma = (num) => {
  const parsed = Number(String(num).replace(/,/g, ""));
  if (isNaN(parsed)) return "尚無資料";
  return parsed >= 1000000000 ? "1B+" : parsed.toLocaleString();
};

export const numberComma = (num) => {
  const parsed = Number(String(num).replace(/,/g, ""));
  if (isNaN(parsed)) return "尚無資料";
  return parsed >= 10000000 ? "10M+" : parsed.toLocaleString();
};

export const postNumComma = (num) => {
  const parsed = Number(String(num).replace(/,/g, ""));
  if (isNaN(parsed)) return "尚無資料";
  return parsed >= 1000 ? "1K+" : parsed.toLocaleString();
};

export const postNumClass = (price) => {
  const parsed = Number(String(price).replace(/,/g, ""));
  const p = Number(parsed);
  if (isNaN(p)) return "";

  if (p > 999) {
    return "text-xl font-bold";
  } else {
    return "text-page-title";
  }
};

export const priceTitleClass = (price, screenWidth) => {
  const parsed = Number(String(price).replace(/,/g, ""));
  const p = Number(parsed);
  if (isNaN(p)) return "text-page-title";

  if (p > 99999) {
    return "text-xs font-bold";
  } else if (p > 9999 && screenWidth < 1024) {
    return "text-xs font-bold";
  } else {
    return "text-page-title";
  }
};

export const cartCountClass = (count) => (count > 99 ? "99+" : count);

export const dateTransfer = (date) => {
  const utcDate = new Date(date);
  const options = {
    timeZone: "Asia/Taipei",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return utcDate.toLocaleDateString("zh-TW", options);
};

export const multiTitleTransfer = (name, title) => {
  if (name && title) {
    return `${name} | ${title}`;
  } else if (name && !title) {
    return `${name}`;
  } else {
    return "尚無資料";
  }
};

export const setCopyForbidden = () => {
  const preventDefault = (e) => {
    if (e.type === "copy") {
      helpers.devConsole.log(" 阻擋複製：使用者可能按了右鍵選單的「複製」");
    } else if (e.type === "contextmenu") {
      helpers.devConsole.log("阻擋右鍵選單（contextmenu）");
    } else {
      helpers.devConsole.log(`阻擋事件：${e.type}`);
    }
    e.preventDefault();
  };

  ["contextmenu", "copy", "cut", "paste", "selectstart"].forEach(
    function (event) {
      document.addEventListener(event, preventDefault);
      helpers.devConsole.log(`已監聽事件：${event}`);
    },
  );

  document.addEventListener("keydown", function (e) {
    const key = e.key.toLowerCase();
    if ((e.ctrlKey || e.metaKey) && ["a", "c", "v", "x"].includes(key)) {
      e.preventDefault();
      if (key === "c") {
        helpers.devConsole.log("阻擋 Ctrl + C 快捷鍵複製");
      } else {
        helpers.devConsole.log(`阻擋 Ctrl + ${key.toUpperCase()}`);
      }
    }
  });

  helpers.devConsole.log("setCopyForbidden 已啟用");
};

export const sanitizeInput = (input) => {
  return input.replace(/[^a-zA-Z0-9\u4e00-\u9fa5\s]/g, "");
};

export const sanitizeEmailInput = (input) => {
  return input.replace(/[<>"'&]/g, "");
};

export const sanitizeLooseInput = (input) => {
  return input.replace(/[<>"'&]/g, "");
};

export const htmlTransfer = (html) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  return doc.body.textContent || "";
};

export const getOriginUrl = () => {
  return decodeURIComponent(location.href.replace(location.origin, ""));
};

function logIfDevelopment(logFunction) {
  return (message, ...optionalParams) => {
    if (window.location.hostname === "unlocking.test") {
      logFunction(message, ...optionalParams);
    }
  };
}

export const devConsole = {
  log: logIfDevelopment(console.log),
  error: logIfDevelopment(console.error),
  warn: logIfDevelopment(console.warn),
  info: logIfDevelopment(console.info),
  debug: logIfDevelopment(console.debug),
  table: logIfDevelopment(console.table),
};

export const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const transferUTC = (utcString) => {
  if (!utcString || utcString === 0) {
    return "無限制";
  }

  const utcDate = new Date(utcString);

  if (isNaN(utcDate.getTime())) {
    return "無限制";
  }

  const taiwanDate = new Date(utcDate.getTime() + 8 * 60 * 60 * 1000);

  const year = taiwanDate.getUTCFullYear();
  const month = String(taiwanDate.getUTCMonth() + 1).padStart(2, "0");
  const day = String(taiwanDate.getUTCDate()).padStart(2, "0");
  const hours = String(taiwanDate.getUTCHours()).padStart(2, "0");
  const minutes = String(taiwanDate.getUTCMinutes()).padStart(2, "0");
  const seconds = String(taiwanDate.getUTCSeconds()).padStart(2, "0");

  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
