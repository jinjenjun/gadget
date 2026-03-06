import { isDarkMode } from "@/Libs/theme";

export const chartPalette = () => {
  if (isDarkMode()) {
    return {
      text: "#f8fafc",
      subtext: "#94a3b8",
      grid: "rgba(148, 163, 184, 0.2)",
      bar: "#38bdf8",
      barBackground: "rgba(56, 189, 248, 0.3)",
      border: "#f97316",
      borderBackground: "rgba(249, 115, 22, 0.35)",
      background: "#0f172a",
    };
  }

  return {
    text: "#1f2937",
    subtext: "#475569",
    grid: "#eeeeee",
    bar: "#03a9fc",
    barBackground: "rgba(3, 169, 252, 0.3)",
    border: "#f97316",
    borderBackground: "#f97316",
    background: "#ffffff",
  };
};
