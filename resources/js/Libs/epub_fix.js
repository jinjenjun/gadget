#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';
import * as cheerio from 'cheerio';

const [, , input, output] = process.argv;
if (!input || !output) {
  console.log('用法: node epub_doctor_cover.js input.epub output.epub');
  process.exit(1);
}
if (!fs.existsSync(input)) {
  console.log('找不到 epub');
  process.exit(1);
}

// 建立暫存資料夾
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'epubdoc_'));
const zip = new AdmZip(input);
zip.extractAllTo(tmp, true);

const OEBPS = path.join(tmp, 'OEBPS');
const META = path.join(tmp, 'META-INF');
if (!fs.existsSync(OEBPS)) fs.mkdirSync(OEBPS, { recursive: true });
if (!fs.existsSync(META)) fs.mkdirSync(META, { recursive: true });

// log 紀錄
const log = [];

//----------------------------
// 掃描檔案
//----------------------------
function scan(dir) {
  let list = [];
  for (const f of fs.readdirSync(dir)) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) list = list.concat(scan(full));
    else list.push(path.relative(OEBPS, full));
  }
  return list;
}
const files = scan(OEBPS);
log.push(`掃描 OEBPS，找到 ${files.length} 個檔案`);

//----------------------------
// 分類
//----------------------------
const html = [],
  css = [],
  img = [];
for (const f of files) {
  const ext = f.split('.').pop().toLowerCase();
  if (['xhtml', 'html'].includes(ext)) html.push(f);
  else if (ext === 'css') css.push(f);
  else if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(ext)) img.push(f);
}
log.push(`分類檔案：HTML=${html.length} CSS=${css.length} Images=${img.length}`);

//----------------------------
// 封面 cover
//----------------------------
let cover = html.find((f) => f.toLowerCase().includes('cover'));
const chapters = html
  .filter(
    (f) => !f.toLowerCase().includes('toc') && !f.toLowerCase().includes('nav') && f !== cover,
  )
  .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));

if (chapters.length === 0) {
  console.log('沒有章節');
  process.exit(1);
}
log.push(`封面檔案：${cover || '無'}，章節數：${chapters.length}`);

//----------------------------
// 修 HTML
//----------------------------
function fixHTML(file) {
  const full = path.join(OEBPS, file);
  let html = fs.readFileSync(full, 'utf8');
  const $ = cheerio.load(html, { xmlMode: true });
  if ($('html').length === 0) html = `<html><head></head><body>${html}</body></html>`;
  else if ($('body').length === 0)
    $('html')
      .append(`<body>${$('html').html()}</body>`)
      .children()
      .not('body')
      .remove();
  fs.writeFileSync(full, html);
  log.push(`修正 HTML：${file}`);
}
if (cover) fixHTML(cover);
chapters.forEach(fixHTML);

//----------------------------
// 抓標題
//----------------------------
function getTitle(file) {
  const full = path.join(OEBPS, file);
  const html = fs.readFileSync(full, 'utf8');
  const $ = cheerio.load(html, { xmlMode: true });

  const h1 = $('h1').first().text().trim();
  if (h1) return h1;

  const titleTag = $('title').first().text().trim();
  if (titleTag) return titleTag;

  const h2 = $('h2').first().text().trim();
  if (h2) return h2;

  return path.basename(file);
}
const titles = chapters.map(getTitle);
log.push(`抓取章節標題完成`);

//----------------------------
// manifest
//----------------------------
let manifest = [];
let counter = 1; // 從 1 開始

// cover
let coverId = null;
if (cover) {
  coverId = `cover${counter}`;
  manifest.push({ id: coverId, href: cover, type: 'application/xhtml+xml' });
  log.push(`加入封面到 manifest (id=${coverId})`);
}

// chapters
chapters.forEach((f, i) =>
  manifest.push({ id: `chap${i + 1}`, href: f, type: 'application/xhtml+xml' }),
);
log.push(`加入 ${chapters.length} 章節到 manifest`);

// CSS
css.forEach((f, i) => manifest.push({ id: `css${i + 1}`, href: f, type: 'text/css' }));
if (css.length) log.push(`加入 ${css.length} CSS 到 manifest`);

// Images
img.forEach((f, i) => {
  const ext = f.split('.').pop().toLowerCase();
  let type = 'image/jpeg';
  if (ext === 'png') type = 'image/png';
  else if (ext === 'gif') type = 'image/gif';
  else if (ext === 'svg') type = 'image/svg+xml';
  else if (ext === 'webp') type = 'image/webp';
  manifest.push({ id: `img${i + 1}`, href: f, type });
});
if (img.length) log.push(`加入 ${img.length} 圖片到 manifest`);

// 固定項目
manifest.push({ id: 'ncx', href: 'toc.ncx', type: 'application/x-dtbncx+xml' });
manifest.push({ id: 'nav', href: 'nav.xhtml', type: 'application/xhtml+xml', properties: 'nav' });
log.push(`加入固定項目 (toc.ncx & nav.xhtml) 到 manifest`);

//----------------------------
// spine
//----------------------------
let spineItems = [];
if (cover) spineItems.push(`<itemref idref="${coverId}"/>`);
spineItems = spineItems.concat(chapters.map((f, i) => `<itemref idref="chap${i + 1}"/>`));
const spine = spineItems.join('\n');
log.push(`更新 spine，共 ${chapters.length} 章節${cover ? ' + 封面' : ''}`);

//----------------------------
// toc.ncx
//----------------------------
const navpoints = chapters
  .map(
    (f, i) => `
<navPoint id="nav${i + 1}" playOrder="${i + 1}">
  <navLabel><text>${titles[i]}</text></navLabel>
  <content src="${f}"/>
</navPoint>
`,
  )
  .join('\n');

const ncx = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
<head>
<meta name="dtb:uid" content="uid"/>
<meta name="dtb:depth" content="1"/>
</head>
<docTitle><text>Book</text></docTitle>
<navMap>
${navpoints}
</navMap>
</ncx>`;
fs.writeFileSync(path.join(OEBPS, 'toc.ncx'), ncx);
log.push('生成 toc.ncx');

//----------------------------
// nav.xhtml
//----------------------------
const navlinks = chapters.map((f, i) => `<li><a href="${f}">${titles[i]}</a></li>`).join('\n');
const nav = `<?xml version="1.0" encoding="utf-8"?>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head><title>TOC</title><meta charset="utf-8"/></head>
<body>
<h1>目錄</h1>
<nav epub:type="toc"><ol>${navlinks}</ol></nav>
</body>
</html>`;
fs.writeFileSync(path.join(OEBPS, 'nav.xhtml'), nav);
log.push('生成 nav.xhtml');

//----------------------------
// manifest xml
//----------------------------
const manifestXML = manifest
  .map((m) => {
    if (m.properties)
      return `<item id="${m.id}" href="${m.href}" media-type="${m.type}" properties="${m.properties}"/>`;
    return `<item id="${m.id}" href="${m.href}" media-type="${m.type}"/>`;
  })
  .join('\n');

//----------------------------
// content.opf
//----------------------------
const opf = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
<metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
<dc:identifier id="BookId">uid</dc:identifier>
<dc:title>Book</dc:title>
<dc:language>zh-TW</dc:language>
</metadata>
<manifest>
${manifestXML}
</manifest>
<spine toc="ncx">
${spine}
</spine>
</package>`;
fs.writeFileSync(path.join(OEBPS, 'content.opf'), opf);
log.push('更新 content.opf');

//----------------------------
// container.xml
//----------------------------
const container = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
<rootfiles>
<rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
</rootfiles>
</container>`;
fs.writeFileSync(path.join(META, 'container.xml'), container);
log.push('更新 container.xml');

//----------------------------
// mimetype
//----------------------------
fs.writeFileSync(path.join(tmp, 'mimetype'), 'application/epub+zip');
log.push('寫入 mimetype');

//----------------------------
// 打包
//----------------------------
const newZip = new AdmZip();
newZip.addFile('mimetype', Buffer.from('application/epub+zip'), '', 0);
function add(dir, base = '') {
  for (const f of fs.readdirSync(dir)) {
    if (f === 'mimetype') continue;
    const full = path.join(dir, f);
    const rel = path.join(base, f);
    if (fs.statSync(full).isDirectory()) add(full, rel);
    else newZip.addLocalFile(full, path.dirname(rel));
  }
}
add(tmp);
newZip.writeZip(output);
log.push('打包完成');

//----------------------------
// 最後輸出 log
//----------------------------
console.log(`EPUB 修復完成`);
console.log('執行紀錄：');
log.forEach((l) => console.log(l));
