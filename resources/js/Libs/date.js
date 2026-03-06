export const months = [
  "1月",
  "2月",
  "3月",
  "4月",
  "5月",
  "6月",
  "7月",
  "8月",
  "9月",
  "10月",
  "11月",
  "12月",
];

export const weeks = ["W1", "W2", "W3", "W4"];

export const getRecentMonths = (count) => {
  const now = new Date();
  return [...Array(count)].map((_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (count - 1 - i), 1);
    return `${d.getFullYear()}/${d.getMonth() + 1}`;
  });
};
