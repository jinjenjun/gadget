#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';
import { JSDOM } from 'jsdom';

/**
 * 用法：
 * node analyze-epub-v2.js /full/path/book.epub
 */

const epubPath = process.argv[2];

const result = {
  tocOutcome: '尚未檢測',
  spineOutcome: '尚未檢測',
  metadataOutcome: '尚未檢測',
  manifestOutcome: '尚未檢測',
  writingMode: '橫式',
  metadata: {
    title: '',
    creator: '',
    language: '',
    publisher: '',
    date: '',
  },
  errorDetails: [],
  finalVerifiedOutcome: '尚未檢測',
};

if (!epubPath || !fs.existsSync(epubPath)) {
  fatal('檔案損毀或遺失，無法分析，請重新上傳');
}

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
});

try {
  /* ===============================
   * 1. 解壓 EPUB
   * =============================== */
  const zip = new AdmZip(epubPath);
  const entries = zip.getEntries();

  /* ===============================
   * 2. container.xml → OPF
   * =============================== */
  const containerEntry = entries.find((e) => e.entryName === 'META-INF/container.xml');
  if (!containerEntry) {
    throw new Error('container.xml 不存在');
  }

  const containerXml = parser.parse(containerEntry.getData().toString());

  const opfPath = containerXml.container.rootfiles.rootfile['full-path'];

  const opfEntry = entries.find((e) => e.entryName === opfPath);
  if (!opfEntry) {
    throw new Error('OPF 檔案不存在');
  }

  const opfDir = path.dirname(opfPath);
  const opf = parser.parse(opfEntry.getData().toString());
  const pkg = opf.package || {};

  /* ===============================
   * 3. Metadata
   * =============================== */
  const meta = pkg.metadata || {};
  const pick = (v) => (Array.isArray(v) ? v[0] : v) || '';

  result.metadata = {
    title: pick(meta['dc:title']),
    creator: pick(meta['dc:creator']),
    language: pick(meta['dc:language']),
    publisher: pick(meta['dc:publisher']),
    date: pick(meta['dc:date']),
  };

  result.metadataOutcome =
    Object.keys(meta).length > 0
      ? '通過'
      : '書籍基本資訊缺失，請在 EPUB 內的 OPF metadata 檔案中補齊標題，作者和語言欄位';

  /* ===============================
   * 4. Manifest
   * =============================== */
  const manifestItems = pkg.manifest?.item || [];
  const manifestArr = Array.isArray(manifestItems) ? manifestItems : [manifestItems];

  result.manifestOutcome =
    manifestArr.length > 0
      ? '通過'
      : '檔案清單缺失或無法讀取，導致閱讀器無法找到內容檔。請確認 EPUB 內的 OPF manifest 是否存在，且每個項目都須包含連結(href)與類別(media-type)';

  /* ===============================
   * 5. Spine
   * =============================== */
  const spineItems = pkg.spine?.itemref || [];
  const spineArr = Array.isArray(spineItems) ? spineItems : [spineItems];

  result.spineOutcome =
    spineArr.length > 0
      ? '通過'
      : '章節順序無法讀取，閱讀器無法正確排序內容頁面。請確認 EPUB 內的 Spine 檔案資料是否存在並且含有有效連結(href)';

  /* ===============================
   * 6. TOC（模擬前端邏輯）
   * =============================== */
  let tocError = null;

  // EPUB3 nav
  const navItem = manifestArr.find((i) => i.properties?.includes('nav'));

  if (!navItem) {
    // EPUB2 ncx
    const ncxItem = manifestArr.find((i) => i['media-type'] === 'application/x-dtbncx+xml');
    if (!ncxItem) {
      tocError =
        '目錄檔案缺失，請檢查TOC檔案並補上目錄，並確認每個章節的連結(href)是否正確指向內容頁面';
    }
  }

  result.tocOutcome = tocError || '通過';

  /* ===============================
   * 7. writing-mode（Node 版）
   * =============================== */
  const htmlItems = manifestArr.filter((i) => i['media-type']?.includes('html'));

  for (const item of htmlItems.slice(0, 10)) {
    const htmlPath = path.join(opfDir, item.href);
    const entry = entries.find((e) => e.entryName === htmlPath);
    if (!entry) continue;

    try {
      const html = entry.getData().toString();
      const dom = new JSDOM(html);
      const doc = dom.window.document;

      // inline style
      const inlineMatch = [...doc.querySelectorAll('[style]')].some((el) =>
        el.getAttribute('style')?.toLowerCase().includes('writing-mode: vertical-rl'),
      );
      if (inlineMatch) {
        result.writingMode = '直式';
        break;
      }

      // <style>
      const styleText = [...doc.querySelectorAll('style')]
        .map((s) => s.textContent || '')
        .join('\n')
        .toLowerCase();

      if (styleText.includes('writing-mode: vertical-rl')) {
        result.writingMode = '直式';
        break;
      }
    } catch (e) {
      result.errorDetails.push(`HTML 讀取失敗: ${e.message}`);
      result.writingMode =
        '無法判斷直/橫式，請確認 EPUB 是否包含直/橫式相關設定(rendition:writing-mode 或 CSS writing-mode 設定)';
    }
  }
} catch (e) {
  fatal(e.message);
}

/* ===============================
 * 8. Final Outcome（完全對齊前端）
 * =============================== */
const epubCheckMapping = ['tocOutcome', 'spineOutcome', 'metadataOutcome', 'manifestOutcome'];

const allPassed = epubCheckMapping.every((key) => result[key] === '通過');

result.finalVerifiedOutcome = allPassed ? '通過' : '不通過';

console.log(JSON.stringify(result, null, 2));
process.exit(0);

/* ===============================
 * 共用錯誤處理
 * =============================== */
function fatal(msg) {
  result.errorDetails.push(msg || '[unknown error]');
  result.tocOutcome = '檔案損毀或遺失，無法分析，請重新上傳';
  result.spineOutcome = '檔案損毀或遺失，無法分析，請重新上傳';
  result.metadataOutcome = '檔案損毀或遺失，無法分析，請重新上傳';
  result.manifestOutcome = '檔案損毀或遺失，無法分析，請重新上傳';
  result.writingMode = '檔案損毀或遺失，無法分析，請重新上傳';
  result.finalVerifiedOutcome = '不通過';

  console.log(JSON.stringify(result, null, 2));
  process.exit(1);
}
