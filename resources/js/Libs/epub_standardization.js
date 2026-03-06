#!/usr/bin/env node
import fs from 'fs';
import os from 'os';
import path from 'path';
import AdmZip from 'adm-zip';
import { XMLParser } from 'fast-xml-parser';

// ----------------------------
// 參數檢查
// ----------------------------
const [, , inputPath, outputPath] = process.argv;
if (!inputPath || !outputPath) {
  console.error('用法: node epub_auto_fix.js input.epub output.epub');
  process.exit(1);
}
if (!fs.existsSync(inputPath)) {
  console.error(`找不到輸入檔案: ${inputPath}`);
  process.exit(1);
}

// ----------------------------
// XML 解析器
// ----------------------------
const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '' });

try {
  // ----------------------------
  // 解壓 EPUB
  // ----------------------------
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'epub_'));
  const zip = new AdmZip(inputPath);
  zip.extractAllTo(tmpDir, true);

  const oebpsDir = path.join(tmpDir, 'OEBPS');
  const metaInfDir = path.join(tmpDir, 'META-INF');
  if (!fs.existsSync(oebpsDir)) fs.mkdirSync(oebpsDir, { recursive: true });
  if (!fs.existsSync(metaInfDir)) fs.mkdirSync(metaInfDir, { recursive: true });

  const entries = zip.getEntries();

  // ----------------------------
  // 讀 container.xml 找 OPF
  // ----------------------------
  const containerEntry = entries.find(e => e.entryName === 'META-INF/container.xml');
  let opfPath = 'OEBPS/content.opf';
  if (containerEntry) {
    const containerXml = parser.parse(containerEntry.getData().toString());
    opfPath = containerXml.container?.rootfiles?.rootfile?.['full-path'] || opfPath;
  }

  // ----------------------------
  // 讀 OPF，如果有的話
  // ----------------------------
  const opfEntry = entries.find(e => e.entryName === opfPath);
  let manifestArr = [];
  let spineArr = [];
  let metadata = { title: '', creator: '', language: '' };

  if (opfEntry) {
    const opf = parser.parse(opfEntry.getData().toString());
    const pkg = opf.package || {};
    metadata = {
      title: pkg.metadata?.['dc:title'] || '書名',
      creator: pkg.metadata?.['dc:creator'] || '作者',
      language: pkg.metadata?.['dc:language'] || 'zh-TW',
    };
    const items = pkg.manifest?.item || [];
    manifestArr = Array.isArray(items) ? items : [items];
    const itemrefs = pkg.spine?.itemref || [];
    spineArr = Array.isArray(itemrefs) ? itemrefs : [itemrefs];
  }

  // ----------------------------
  // 自動掃描章節 HTML
  // ----------------------------
  function findHtmlFiles(dir) {
    let files = [];
    for (const f of fs.readdirSync(dir)) {
      const full = path.join(dir, f);
      const stat = fs.statSync(full);
      if (stat.isDirectory()) {
        files = files.concat(findHtmlFiles(full));
      } else if (f.toLowerCase().endsWith('.xhtml') || f.toLowerCase().endsWith('.html')) {
        files.push(path.relative(oebpsDir, full));
      }
    }
    return files;
  }

  const htmlFiles = findHtmlFiles(oebpsDir);
  if (htmlFiles.length === 0) throw new Error('找不到章節 HTML');

  // ----------------------------
  // 整理 manifest
  // ----------------------------
  const manifestMap = new Map();
  manifestArr.forEach(i => i?.href && manifestMap.set(i.href, i));

  const newManifest = [];
  htmlFiles.forEach((file, i) => {
    if (!manifestMap.has(file)) {
      const id = `file${i+1}`;
      newManifest.push({ id, href: file, 'media-type': 'application/xhtml+xml' });
      manifestMap.set(file, { id, href: file, 'media-type': 'application/xhtml+xml' });
    }
  });

  // TOC
  if (!manifestMap.has('toc.ncx')) newManifest.push({ id: 'ncx', href: 'toc.ncx', 'media-type': 'application/x-dtbncx+xml' });
  if (!manifestMap.has('toc.xhtml')) newManifest.push({ id: 'toc', href: 'toc.xhtml', 'media-type': 'application/xhtml+xml' });

  manifestArr = [...manifestArr.filter(Boolean), ...newManifest];

  // ----------------------------
  // 整理 spine
  // ----------------------------
  const existingSpineIds = new Set(spineArr.map(s => s.idref));
  htmlFiles.forEach((file, i) => {
    const id = manifestMap.get(file).id;
    if (!existingSpineIds.has(id)) spineArr.push({ idref: id });
  });

  // ----------------------------
  // 補 toc.xhtml
  // ----------------------------
  const tocXhtmlPath = path.join(oebpsDir, 'toc.xhtml');
  if (!fs.existsSync(tocXhtmlPath)) {
        const tocXhtmlContent = `<?xml version="1.0" encoding="utf-8"?>
    <html xmlns="http://www.w3.org/1999/xhtml" lang="zh-TW">
    <head><meta charset="UTF-8"/><title>目錄</title></head>
    <body>
    <h1>目錄</h1>
    <ul>
    ${htmlFiles.map(file => `<li><a href="${file}">${file}</a></li>`).join('\n')}
    </ul>
    </body>
    </html>`;
    fs.writeFileSync(tocXhtmlPath, tocXhtmlContent, 'utf-8');
  }

  // ----------------------------
  // 補 toc.ncx
  // ----------------------------
  const tocNcxPath = path.join(oebpsDir, 'toc.ncx');
  if (!fs.existsSync(tocNcxPath)) {
    const ncxNavPoints = htmlFiles.map((file, i) => `
    <navPoint id="navPoint-${i+1}" playOrder="${i+1}">
      <navLabel><text>${file}</text></navLabel>
      <content src="${file}"/>
    </navPoint>`).join('\n');

    const tocNcxContent = `<?xml version="1.0" encoding="utf-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:12345"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <navMap>
${ncxNavPoints}
  </navMap>
</ncx>`;
    fs.writeFileSync(tocNcxPath, tocNcxContent, 'utf-8');
  }

  // ----------------------------
  // 生成 content.opf
  // ----------------------------
  const manifestXml = manifestArr.map(i => `<item id="${i.id}" href="${i.href}" media-type="${i['media-type']}"/>`).join('\n');
  const spineXml = `<spine toc="ncx">\n${spineArr.map(s => `  <itemref idref="${s.idref}"/>`).join('\n')}\n</spine>`;

  const opfContent = `<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:12345</dc:identifier>
    <dc:title>${metadata.title}</dc:title>
    <dc:creator>${metadata.creator}</dc:creator>
    <dc:language>${metadata.language}</dc:language>
  </metadata>
  <manifest>
${manifestXml}
  </manifest>
${spineXml}
</package>`;
  fs.writeFileSync(path.join(oebpsDir, 'content.opf'), opfContent, 'utf-8');

  // ----------------------------
  // 補 container.xml
  // ----------------------------
  const containerXmlPath = path.join(metaInfDir, 'container.xml');
  if (!fs.existsSync(containerXmlPath)) {
    const containerXml = `<?xml version="1.0"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
    fs.writeFileSync(containerXmlPath, containerXml, 'utf-8');
  }

  // ----------------------------
  // 補 mimetype
  // ----------------------------
  const mimetypePath = path.join(tmpDir, 'mimetype');
  fs.writeFileSync(mimetypePath, 'application/epub+zip', 'utf-8');

  // ----------------------------
  // 打包 EPUB
  // ----------------------------
  const newZip = new AdmZip();
  newZip.addFile('mimetype', Buffer.from('application/epub+zip'), '', 0);

  function addDir(dir, base='') {
    fs.readdirSync(dir).forEach(file => {
      if(file==='mimetype') return;
      const full = path.join(dir, file);
      const rel = path.join(base, file);
      if(fs.statSync(full).isDirectory()) addDir(full, rel);
      else newZip.addLocalFile(full, path.dirname(rel));
    });
  }
  addDir(tmpDir);
  newZip.writeZip(outputPath);

  console.log('EPUB 自動修復完成:', outputPath);

} catch(err) {
  console.error('發生錯誤:', err.message);
  console.error(err.stack);
  process.exit(1);
}
