import ePub from "epubjs";

export const analyzeEpubFile = async (book) => {
  const result = {
    tocOutcome: "尚未檢測",
    spineOutcome: "尚未檢測",
    metadataOutcome: "尚未檢測",
    manifestOutcome: "尚未檢測",
    writingMode: "橫式",
    metadata: {
      title: "",
      creator: "",
      language: "",
      publisher: "",
      date: "",
    },
    errorDetails: [],
    finalVerifiedOutcome: "尚未檢測",
  };

  try {
    // ===== EPUB 初始化（很重要）=====
    await book.ready;
    await book.loaded.package;
    await book.loaded.spine;
    await book.loaded.navigation;

    const nav = book.navigation;
    const pkg = book.package;

    // ===== TOC 檢查 =====
    const rawToc = Array.isArray(nav?.toc) ? nav.toc : [];

    if (rawToc.length === 0) {
      result.tocOutcome = "目錄檔案缺失，請檢查TOC檔案並補上目錄，並確認每個章節的連結(href)是否正確指向內容頁面";
    } else {
      const normalizePath = (path) => {
        if (typeof path !== "string" || path === "") return "";
        const cleaned = path.split("#")[0].split("?")[0];
        let resolved = cleaned;
        try {
          const base =
            typeof window !== "undefined"
              ? window.location.href
              : "http://localhost/";
          resolved = new URL(cleaned, base).pathname;
        } catch {
          resolved = cleaned;
        }
        return decodeURIComponent(resolved)
          .replace(/^\/+/, "")
          .replace(/^\.?\//, "");
      };

      const resolveBookPath = (href) => {
        if (typeof href !== "string" || href === "") return "";
        const cleanHref = href.split("#")[0];
        let resolved = cleanHref;
        try {
          resolved = book.resolve(cleanHref, false) || cleanHref;
        } catch {
          resolved = cleanHref;
        }
        return normalizePath(resolved);
      };

      const manifestSet = new Set(
        Object.values(pkg.manifest || {}).map((item) =>
          resolveBookPath(item?.href),
        ),
      );
      let tocError = null;

      for (const item of rawToc) {
        if (!item) {
          tocError = "目錄檔案缺失，請檢查TOC檔案並補上目錄，並確認每個章節的連結(href)是否正確指向內容頁面";
          break;
        }

        if (typeof item.label !== "string" || item.label.trim() === "") {
          tocError = "目錄內標題資料缺失，請檢查TOC檔案並補上目錄，並確認每個章節的標題(label)是否正確填寫";
          break;
        }

        if (typeof item.href !== "string" || item.href.trim() === "") {
          tocError = "目錄內連結無法執行(連結資料格式有誤)，請檢查 TOC 檔案並補上目錄，並確認每個章節的連結(href)是否正確指向內容頁面";
          break;
        }

        const tocPath = resolveBookPath(item.href);

        // TODO: 此為過於嚴格的檢查條件, 先註解起來, 有需要時再打開
        // if (!tocPath || !manifestSet.has(tocPath)) {
        //   tocError = "目錄內連結無法執行，請檢查 TOC 和 Manifest 檔案資料，並確認每個章節的連結(href)是否正確指向內容頁面";
        //   break;
        // }
      }

      result.tocOutcome = tocError || "通過";
    }

    // ===== Spine 檢查 =====
    const spineItems = book.spine?.items || [];

    if (spineItems.length === 0) {
      result.spineOutcome = "章節順序無法讀取，閱讀器無法正確排序內容頁面。請確認 EPUB 內的 Spine 檔案資料是否存在並且含有有效連結(href)";
    } else {
      let spineError = null;

      for (const item of spineItems) {
        if (!item) {
          spineError = "章節順序無法讀取，閱讀器無法正確排序內容頁面。請確認 EPUB 內的 Spine 檔案資料是否存在並且含有有效連結(href)";
          break;
        }
      }

      result.spineOutcome = spineError || "通過";
    }

    // ===== Metadata / Manifest =====
    const meta = pkg.metadata || {};

    const pick = (v) => {
      if (Array.isArray(v)) return v[0] || "";
      if (typeof v === "object" && v !== null) return v.name || "";
      return v || "";
    };

    Object.assign(result.metadata, {
      title: pick(meta.title),
      creator: pick(meta.creator),
      language: pick(meta.language),
      publisher: pick(meta.publisher),
      date: pick(meta.date),
    });

    result.metadataOutcome =
      Object.keys(meta).length > 0 ? "通過" : "書籍基本資訊缺失，請在 EPUB 內的 OPF metadata 檔案中補齊標題，作者和語言欄位";

    result.manifestOutcome =
      pkg.manifest && Object.keys(pkg.manifest).length > 0
        ? "通過"
        : "檔案清單缺失或無法讀取，導致閱讀器無法找到內容檔。請確認 EPUB 內的 OPF manifest 是否存在，且每個項目都須包含連結(href)與類別(media-type)";

    // ===== writing-mode =====
    const detectWritingMode = (htmlText, cssText = "") => {
      const dom = new DOMParser().parseFromString(htmlText, "text/html");
      const inlineMatch = Array.from(dom.querySelectorAll("[style]")).some(
        (el) => {
          const style = el.getAttribute("style") || "";
          return style.toLowerCase().includes("writing-mode: vertical-rl");
        },
      );
      if (inlineMatch) return "直式";

      const styleText = [...dom.querySelectorAll("style")]
        .map((el) => el.textContent || "")
        .join("\n");
      const allCss = (styleText + "\n" + cssText).toLowerCase();

      const classMap = {};
      const classRegex =
        /\.([a-zA-Z0-9_-]+)[^{]*\{[^}]*writing-mode\s*:\s*vertical-rl[^}]*\}/g;
      let match;
      while ((match = classRegex.exec(allCss))) {
        classMap[match[1]] = true;
      }

      for (const cls in classMap) {
        if (dom.querySelector(`.${cls}`)) {
          return "直式";
        }
      }

      const lowerHtml = htmlText.toLowerCase();
      if (lowerHtml.includes("writing-mode: vertical-rl")) return "直式";
      if (lowerHtml.includes("writing-mode: horizontal")) return "橫式";

      return null;
    };

    try {
      const writingModeFromMetadata =
        meta?.["rendition:writing-mode"] ||
        (meta.rendition && meta.rendition["writing-mode"]) ||
        null;

      if (writingModeFromMetadata) {
        const mode = writingModeFromMetadata.toLowerCase();
        if (mode.includes("vertical")) result.writingMode = "直式";
        else if (mode.includes("horizontal")) result.writingMode = "橫式";
      } else {
        let detected = false;

        const tryDetectFromItem = async (item, type = "html") => {
          try {
            const content = await item.load(book.load.bind(book));
            const html =
              content?.documentElement?.outerHTML || content?.text || "";
            item.unload?.();
            return detectWritingMode(html);
          } catch (e) {
            result.errorDetails.push(
              `${type.toUpperCase()} 讀取失敗: ${e.message}`,
            );
            result.writingMode = "無法判斷直/橫式，請確認 EPUB 是否包含直/橫式相關設定(rendition:writing-mode 或 CSS writing-mode 設定)";
            return null;
          }
        };

        for (let i = 0; i < Math.min(10, spineItems.length); i++) {
          const item = spineItems[i];
          if (!item || !item.mediaType) continue;
          const props = item.properties || [];

          if (props.includes("rendition:orientation:upright")) {
            result.writingMode = "直式";
            detected = true;
            break;
          }

          if (props.includes("rendition:orientation:sideways")) {
            result.writingMode = "橫式";
            detected = true;
            break;
          }

          if (
            item.mediaType.includes("html") ||
            item.mediaType.includes("xhtml")
          ) {
            const mode = await tryDetectFromItem(item, "html");
            if (mode) {
              result.writingMode = mode;
              detected = true;
              break;
            }
          }
        }

        if (!detected && meta["rendition:layout"] === "pre-paginated") {
          if (meta["rendition:orientation"] === "upright") {
            result.writingMode = "直式";
            detected = true;
          }
        }

        if (!detected && pkg.manifest) {
          const cssItems = Object.values(pkg.manifest).filter(
            (item) => item.mediaType === "text/css",
          );
          for (const css of cssItems) {
            try {
              const text = await book.load(css.href);
              const mode = detectWritingMode("", text);
              if (mode) {
                result.writingMode = mode;
                break;
              }
            } catch (e) {
              result.errorDetails.push(
                `manifest CSS ${css.href} 讀取失敗: ${e.message}`,
              );
              result.writingMode = "無法判斷直/橫式，請確認 EPUB 是否包含直/橫式相關設定(rendition:writing-mode 或 CSS writing-mode 設定)";
            }
          }
        }
      }
    } catch (e) {
      result.errorDetails.push(
        "讀取 writing-mode 發生錯誤: " + (e.message || e),
      );
      result.writingMode = "無法判斷直/橫式，請確認 EPUB 是否包含直/橫式相關設定(rendition:writing-mode 或 CSS writing-mode 設定)";
    }
  } catch (err) {
    console.error("JS自動分析EPUB失敗", err);
    result.errorDetails.push(err.message || "[unknown error]");
    result.tocOutcome = "檔案損毀或遺失，無法分析，請重新上傳";
    result.spineOutcome = "檔案損毀或遺失，無法分析，請重新上傳";
    result.metadataOutcome = "檔案損毀或遺失，無法分析，請重新上傳";
    result.manifestOutcome = "檔案損毀或遺失，無法分析，請重新上傳";
    result.writingMode = "檔案損毀或遺失，無法分析，請重新上傳";
  }

  const epubCheckMapping = [
    "tocOutcome",
    "spineOutcome",
    "metadataOutcome",
    "manifestOutcome",
  ];

  const allPassed = epubCheckMapping.every((key) => result[key] === "通過");

  result.finalVerifiedOutcome = allPassed ? "通過" : "不通過";

  return result;
};

export const getEpubLocation = async (book) => {
  try {
    await book.ready;
    await book.loaded.package;

    if (!book.locations || book.locations.total <= 0) {
      await book.locations.generate(1000);
    }

    const totalPages = book.locations.total;
    const location = JSON.stringify(book.locations._locations);

    return {
      totalPages,
      location,
    };
  } catch (err) {
    console.error("JS自動取得頁數和位置 錯誤：", err);
    return {
      totalPages: 0,
      location: "[]",
      error: err.message || "未知錯誤",
    };
  }
};

export const getEpubLocationByUrl = async (url) => {
  const book = ePub(url);
  await book.ready;
  await book.locations.generate(1000);
  const totalPages = book.locations?.length?.();
  const location = JSON.stringify(book.locations._locations);
  return {
    totalPages,
    location,
  };
};

export async function getEpubCover(book) {
  const result = { fileName: "", ext: "", base64: "", error: null, url: "" };

  const mimeExt = (mime = "") => {
    switch (mime.toLowerCase()) {
      case "image/jpeg":
        return "jpg";
      case "image/png":
        return "png";
      case "image/svg+xml":
        return "svg";
      case "image/webp":
        return "webp";
      default:
        return "";
    }
  };

  const detectImageMime = (buffer) => {
    if (
      !buffer ||
      !(buffer instanceof ArrayBuffer || buffer.buffer instanceof ArrayBuffer)
    ) {
      return "application/octet-stream";
    }
    const arr = new Uint8Array(buffer);
    if (arr[0] === 0xff && arr[1] === 0xd8 && arr[2] === 0xff)
      return "image/jpeg";
    if (
      arr[0] === 0x89 &&
      arr[1] === 0x50 &&
      arr[2] === 0x4e &&
      arr[3] === 0x47
    )
      return "image/png";
    if (
      arr[0] === 0x52 &&
      arr[1] === 0x49 &&
      arr[2] === 0x46 &&
      arr[3] === 0x46
    )
      return "image/webp";
    const text = new TextDecoder().decode(arr.slice(0, 100)).toLowerCase();
    if (text.includes("<svg")) return "image/svg+xml";
    return "image/jpeg";
  };

  const arrayBufferToDataUrl = (buffer, mime) => {
    const blob = new Blob([buffer], { type: mime });
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () =>
        typeof reader.result === "string"
          ? resolve(reader.result)
          : reject("轉換失敗");
      reader.onerror = () => reject("FileReader 錯誤");
      reader.readAsDataURL(blob);
    });
  };

  try {
    await book.ready;
    await book.loaded.package;

    let cov = await book.coverUrl?.();
    if (!cov) {
      const manifestItems = Object.values(book.package?.manifest || {});
      const coverItem = manifestItems.find(
        (item) =>
          item.properties?.includes("cover-image") ||
          /cover/i.test(item.id || ""),
      );
      if (!coverItem) {
        result.error = "找不到封面資源";
        return result;
      }
      cov = { href: coverItem.href, type: coverItem.mediaType || "image/jpeg" };
    }

    let buffer, mime, fileName, rawName;

    if (typeof cov === "string") {
      result.url = cov;
      const response = await fetch(cov);
      if (!response.ok) throw new Error(`封面下載失敗: ${response.status}`);
      buffer = await response.arrayBuffer();
      mime = response.headers.get("content-type") || detectImageMime(buffer);
      rawName = cov.split("/").pop() || "cover";
    } else if (cov.href) {
      const coverRes = await book.resources.get(cov.href);
      if (!coverRes) throw new Error(`封面資源讀取失敗: ${cov.href}`);

      if (coverRes instanceof Blob) {
        buffer = await coverRes.arrayBuffer();
      } else {
        buffer = coverRes;
      }

      mime = cov.type || detectImageMime(buffer);
      rawName = cov.href.split("/").pop() || "cover";
      result.url = cov.href;
    } else {
      result.error = "coverUrl 無效（缺少 href 或 url）";
      return result;
    }

    const ext = mimeExt(mime) || "jpg";
    fileName = rawName.includes(".") ? rawName : `${rawName}.${ext}`;
    const dataUrl = await arrayBufferToDataUrl(buffer, mime);

    result.fileName = fileName;
    result.ext = ext;
    result.base64 = dataUrl;
    return result;
  } catch (e) {
    result.error = `JS自動抓取封面失敗：${e.message || e}`;
    return result;
  }
}
