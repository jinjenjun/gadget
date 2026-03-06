#!/usr/bin/env node

import { JSDOM } from 'jsdom';
import { execSync } from 'child_process';
import fs from 'fs';
import os from 'os';
import mammoth from 'mammoth';
import path from 'path';
import createDOMPurify from 'dompurify';
import AdmZip from 'adm-zip';

// DOC -> DOCX
function docToDocx(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.doc') {
    const docxPath = filePath.replace(/\.doc$/i, '.docx');
    execSync(
      `soffice --headless --convert-to docx "${filePath}" --outdir "${path.dirname(filePath)}"`,
    );
    return docxPath;
  }
  return filePath;
}

// DOCX -> HTML
async function docxToHtml(inputPath) {
  const buffer = fs.readFileSync(inputPath);
  const result = await mammoth.convertToHtml(
    { buffer },
    {
      convertImage: mammoth.images.inline(async (image) => {
        const buffer = await image.read();
        const base64 = buffer.toString('base64');
        return { src: `data:${image.contentType};base64,${base64}` };
      }),
    },
  );
  return result.value;
}

// HTML sanitize
function cleanHtml(html) {
  const window = new JSDOM('').window;
  const DOMPurify = createDOMPurify(window);
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['h1', 'h2', 'h3', 'p', 'img', 'ul', 'ol', 'li', 'strong', 'em', 'blockquote'],
    ALLOWED_ATTR: ['src', 'alt'],
  });
}

// Split chapters by H1
function splitByH1(html) {
  const dom = new JSDOM(`<body>${html}</body>`);
  const body = dom.window.document.body;
  const chapters = [];
  let current = { title: '前言', content: '' };

  body.childNodes.forEach((node) => {
    if (node.nodeType === 1 && node.tagName === 'H1') {
      if (current.content.trim()) chapters.push(current);
      current = { title: node.textContent.trim(), content: `<h1>${node.textContent}</h1>` };
    } else {
      current.content += node.outerHTML || node.textContent;
    }
  });

  if (current.content.trim()) chapters.push(current);
  return chapters;
}

// Build EPUB manually (EPUB2 + TOC)
function createEpub(chapters, outputPath) {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'epub_tmp_'));

  try {
    const OEBPS = path.join(tmp, 'OEBPS');
    const Text = path.join(OEBPS, 'Text');
    const Images = path.join(OEBPS, 'Images');
    fs.mkdirSync(Text, { recursive: true });
    fs.mkdirSync(Images, { recursive: true });
    fs.mkdirSync(path.join(tmp, 'META-INF'), { recursive: true });

    const imgFiles = [];
    chapters.forEach((chap, i) => {
      let content = chap.content.replace(/<img[^>]+src="([^"]+)"[^>]*>/g, (match, src) => {
        if (src.startsWith('data:image/')) {
          const [meta, data] = src.split(',');
          const ext = meta.split('/')[1].split(';')[0] || 'png';
          const imgName = `img_${i + 1}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
          const imgPath = path.join(Images, imgName);
          fs.writeFileSync(imgPath, Buffer.from(data, 'base64'));
          imgFiles.push(imgName);
          return `<img src="../Images/${imgName}" />`;
        }
        return match;
      });

      fs.writeFileSync(
        path.join(Text, `chapter_${i + 1}.xhtml`),
        `<?xml version="1.0" encoding="UTF-8"?>
              <html xmlns="http://www.w3.org/1999/xhtml">
                <head>
                  <meta charset="UTF-8" />
                  <title>${chap.title}</title>
                </head>
                <body>${content}</body>
              </html>`,
      );
    });

    const navItems = chapters
      .map((c, i) => `<li><a href="Text/chapter_${i + 1}.xhtml">${c.title}</a></li>`)
      .join('\n');

    fs.writeFileSync(
      path.join(OEBPS, 'nav.xhtml'),
      `<?xml version="1.0" encoding="UTF-8"?>
            <html xmlns="http://www.w3.org/1999/xhtml"
                  xmlns:epub="http://www.idpf.org/2007/ops">
              <head>
                <meta charset="UTF-8" />
                <title>目錄</title>
              </head>
              <body>
                <nav epub:type="toc" id="toc">
                  <h1>目錄</h1>
                  <ol>
                    ${navItems}
                  </ol>
                </nav>
              </body>
            </html>`,
    );

    const ncxNavPoints = chapters
      .map(
        (c, i) =>
          `<navPoint id="navPoint-${i + 1}" playOrder="${i + 1}">
            <navLabel><text>${c.title}</text></navLabel>
            <content src="Text/chapter_${i + 1}.xhtml"/>
          </navPoint>`,
      )
      .join('\n');

    fs.writeFileSync(
      path.join(OEBPS, 'toc.ncx'),
      `<?xml version="1.0" encoding="UTF-8"?>
            <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
              <head>
                <meta name="dtb:uid" content="urn:uuid:12345"/>
                <meta name="dtb:depth" content="1"/>
                <meta name="dtb:totalPageCount" content="0"/>
                <meta name="dtb:maxPageNumber" content="0"/>
              </head>
              <docTitle><text>書名</text></docTitle>
              <navMap>
                ${ncxNavPoints}
              </navMap>
            </ncx>`,
    );

    fs.writeFileSync(path.join(tmp, 'mimetype'), 'application/epub+zip');

    fs.writeFileSync(
      path.join(tmp, 'META-INF', 'container.xml'),
      `<?xml version="1.0"?>
            <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
              <rootfiles>
                <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
              </rootfiles>
            </container>`,
    );

    let manifest = '';
    let spine = '';

    chapters.forEach((_, i) => {
      manifest += `<item id="chap${i + 1}" href="Text/chapter_${i + 1}.xhtml" media-type="application/xhtml+xml"/>\n`;
      spine += `<itemref idref="chap${i + 1}"/>\n`;
    });

    imgFiles.forEach((f, i) => {
      manifest += `<item id="img${i + 1}" href="Images/${f}" media-type="image/${path.extname(f).slice(1)}"/>\n`;
    });

    manifest += `<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>\n`;
    manifest += `<item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>\n`;

    const opf = `<?xml version="1.0" encoding="UTF-8"?>
    <package version="2.0" xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:title>書名</dc:title>
        <dc:language>zh-TW</dc:language>
        <dc:identifier id="BookId">urn:uuid:12345</dc:identifier>
        <dc:creator>作者</dc:creator>
      </metadata>
      <manifest>
        ${manifest}
      </manifest>
      <spine toc="ncx">
        ${spine}
      </spine>
    </package>`;
    fs.writeFileSync(path.join(OEBPS, 'content.opf'), opf);

    // zip
    const zip = new AdmZip();
    zip.addFile('mimetype', Buffer.from('application/epub+zip'), '', 0);

    function addDir(d, base = '') {
      fs.readdirSync(d).forEach((f) => {
        const full = path.join(d, f);
        const rel = path.join(base, f);
        if (fs.statSync(full).isDirectory()) addDir(full, rel);
        else if (rel !== 'mimetype') zip.addLocalFile(full, path.dirname(rel));
      });
    }

    addDir(tmp);
    zip.writeZip(outputPath);

    console.log('🎉 EPUB 生成完成:', outputPath);
  } finally {
    if (fs.existsSync(tmp)) {
      fs.rmSync(tmp, { recursive: true, force: true });
    }
  }
}

// CLI
if (process.argv[1] === new URL(import.meta.url).pathname) {
  const [, , inputFile, outputFile] = process.argv;
  if (!inputFile || !outputFile) {
    console.error('❌ 用法: node epub.js input.docx output.epub');
    process.exit(1);
  }

  (async () => {
    try {
      const finalInput = docToDocx(path.resolve(inputFile));
      const html = await docxToHtml(finalInput);
      const clean = cleanHtml(html);
      const chapters = splitByH1(clean);
      createEpub(chapters, path.resolve(outputFile));
    } catch (err) {
      console.error('❌ 轉檔失敗:', err);
    }
  })();
}
