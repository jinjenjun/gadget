export const isDarkMode = () => {
  if (typeof document === "undefined") {
    return false;
  }

  const root = document.documentElement;
  const body = document.body;

  return (
    root?.classList.contains("dark") ||
    body?.classList.contains("dark") ||
    root?.getAttribute("data-theme") === "dark" ||
    body?.getAttribute("data-theme") === "dark"
  );
};
