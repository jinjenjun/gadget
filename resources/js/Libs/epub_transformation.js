import fs from "fs";
import os from "os";
import path from "path";
import AdmZip from "adm-zip";
import { JSDOM } from "jsdom";

try {
    const [, , inputPath, outputPath] = process.argv;

    if (!inputPath || !outputPath) {
        throw new Error(
            "用法: node epub_transformation.js input.epub output.epub",
        );
    }
    if (!fs.existsSync(inputPath)) {
        throw new Error(`找不到輸入檔案: ${inputPath}`);
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "epub_"));
    const unzipper = new AdmZip(inputPath);
    unzipper.extractAllTo(tmpDir, true);
    console.log("EPUB 已解壓");

    function findHtmlFiles(dir) {
        let files = [];
        for (const f of fs.readdirSync(dir)) {
            const full = path.join(dir, f);
            const stat = fs.statSync(full);
            if (stat.isDirectory()) {
                files = files.concat(findHtmlFiles(full));
            } else if (
                typeof f === "string" &&
                (f.toLowerCase().endsWith(".xhtml") ||
                    f.toLowerCase().endsWith(".html"))
            ) {
                files.push(full);
            }
        }
        return files;
    }

    const htmlFiles = findHtmlFiles(tmpDir);
    if (htmlFiles.length === 0)
        throw new Error("找不到任何 .xhtml 或 .html 檔案");

    const imagesDir = path.join(tmpDir, "OEBPS", "Images");
    console.log("圖片資料夾:", imagesDir);

    let currentFootnoteNumber = 1;

    htmlFiles.forEach((filePath) => {
        let html = fs.readFileSync(filePath, "utf-8");
        html = html.replace(/<!--.*?-->/gs, "");
        const dom = new JSDOM(html);
        const { NodeFilter, document } = dom.window;

        document.querySelectorAll('link[rel="stylesheet"]').forEach((link) => {
            const href = link.getAttribute("href");
            if (href && !href.startsWith("../")) {
                link.setAttribute("href", "../Styles/hub.css");
            }
        });

        const walker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT,
        );
        const nodes = [];
        while (walker.nextNode()) nodes.push(walker.currentNode);

        nodes.forEach((node) => {
            const regex = /\[\[IMG_(\d+)\]\]/g;
            let newHtml = node.textContent;

            newHtml = newHtml.replace(regex, (_, num) => {
                const exts = ["png", "jpg", "jpeg"];
                let found = null;
                for (const ext of exts) {
                    const imgName = `IMG_${num}.${ext}`;
                    const srcImgPath = path.join(imagesDir, imgName);
                    if (fs.existsSync(srcImgPath)) {
                        found = { imgName, srcImgPath };
                        break;
                    }
                }
                const fallback = `IMG_${num}.jpg`;
                if (!found) console.warn(`找不到圖片: ${fallback}`);
                return `<img src="../Images/${fallback}" alt="Image ${num}" />`;
            });

            if (newHtml !== node.textContent) {
                const span = document.createElement("span");
                span.innerHTML = newHtml;
                node.parentNode.replaceChild(span, node);
            }
        });

        const footnotes = [];
        document.querySelectorAll("p.基本段落 span").forEach((span) => {
            span.innerHTML = span.innerHTML.replace(
                /\[([0-9]+)\]/g,
                (_, num) => {
                    if (!footnotes.includes(num)) footnotes.push(num);
                    return `<a href="#note-${num}" id="ref-${num}" role="doc-noteref" epub:type="noteref">(${num})</a>`;
                },
            );
        });

        document.querySelectorAll("p.基本段落 span").forEach((span) => {
            const text = span.textContent.trim();
            const match = text.match(/^(?:\d+\.\s*)?\[?(\d+)\]?\s*(.*)/);
            if (match) {
                let noteText = match[2].trim();
                noteText = noteText
                    .slice(3)
                    .replace(/^\(?\d+\)?[\.\s]*|\[\d+\]\s*/g, "");
                const paragraph = span.closest("p");
                if (paragraph) {
                    paragraph.id = `note-${currentFootnoteNumber}`;
                }
                span.innerHTML = `<a href="#ref-${currentFootnoteNumber}">(${currentFootnoteNumber})</a> ${noteText}`;
                currentFootnoteNumber++;
            }
        });

        const footnoteTitleP = Array.from(
            document.querySelectorAll("p.基本段落"),
        ).find((p) => p.textContent.includes("註釋："));

        if (footnoteTitleP) {
            const originalParent = footnoteTitleP.parentNode;
            const footDiv = document.createElement("div");
            footDiv.className = "foot-notation";
            const footnotePs = [];
            let currentP = footnoteTitleP;
            while (currentP && currentP.tagName === "P") {
                if (
                    !currentP.textContent.includes("註釋：") &&
                    !currentP.matches('p[id^="note-"]')
                )
                    break;
                footnotePs.push(currentP);
                currentP = currentP.nextSibling;
            }
            if (footnotePs.length > 0) {
                originalParent.insertBefore(footDiv, footnotePs[0]);
                footnotePs.forEach((p) => footDiv.appendChild(p));
            }
        }

        fs.writeFileSync(filePath, dom.serialize(), "utf-8");
    });

    const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "epub_tmp_"));
    const OEBPS = path.join(tmp, "OEBPS");
    const META_INF = path.join(tmp, "META-INF");
    fs.mkdirSync(OEBPS, { recursive: true });
    fs.mkdirSync(META_INF, { recursive: true });

    const stylesDir = path.join(OEBPS, "Styles");
    fs.mkdirSync(stylesDir, { recursive: true });

    const originalCssDir = path.join(tmpDir, "OEBPS", "css");
    let originalCssContent = "";
    if (fs.existsSync(originalCssDir)) {
        const files = fs.readdirSync(originalCssDir);
        const originalCssFile = files.find((f) =>
            f.toLowerCase().includes("idgeneratedstyles"),
        );
        if (originalCssFile) {
            const originalCssPath = path.join(originalCssDir, originalCssFile);
            originalCssContent = fs.readFileSync(originalCssPath, "utf-8");
            console.log("=== 找到原始 CSS ===");
            console.log(originalCssContent);
            console.log("=== 內容結束 ===\n");
        } else {
            console.warn("找不到 idGeneratedStyles.css");
        }
    } else {
        console.warn("找不到 css 資料夾");
    }

    const hubCssContent = `
  img {
    width: 100%;
    height: auto;
    display: block;
  }

  .heading_1 {
    all: unset;
    display: block;
    font-size: 2em;
    font-weight: bold;
    text-align: center;
    margin: 1.2em 0;
  }

  .foot-notation {
    margin: 2em 0;
  }
  `;

    // TODO: 先暫時使用預設的css, 而非原生的css, 有需要再進行更換
    // const combinedCss = originalCssContent + '\n/* ==== hub.css ==== */\n' + hubCssContent;
    const combinedCss = hubCssContent;
    fs.writeFileSync(path.join(stylesDir, "hub.css"), combinedCss, "utf-8");

    const chapters = htmlFiles.map((file, i) => {
        const content = fs.readFileSync(file, "utf-8");
        const dom = new JSDOM(content);
        const { document } = dom.window;
        const chapterTitle = document.querySelector("title")
            ? document.querySelector("title").textContent
            : `第${i + 1}章`;

        let fileName = "";
        if (i === 0) fileName = "toc.xhtml";
        else if (i === htmlFiles.length - 1) fileName = "cover.xhtml";
        else fileName = `file${i}.xhtml`;

        const textDir = path.join(OEBPS, "Text");
        if (!fs.existsSync(textDir)) fs.mkdirSync(textDir);
        fs.writeFileSync(path.join(textDir, fileName), content, "utf-8");

        return { title: chapterTitle, content };
    });

    function generateOpf(htmlFiles) {
        let manifest = "";
        let spine = "";
        manifest += `<item id="cover" href="Text/cover.xhtml" media-type="application/xhtml+xml"/>\n`;
        manifest += `<item id="toc" href="Text/toc.xhtml" media-type="application/xhtml+xml"/>\n`;
        htmlFiles.forEach((file, i) => {
            if (i >= htmlFiles.length - 2) return;
            const fileId = `file${i + 1}`;
            const fileHref = `Text/${fileId}.xhtml`;
            manifest += `<item id="${fileId}" href="${fileHref}" media-type="application/xhtml+xml"/>\n`;
            spine += `<itemref idref="${fileId}"/>\n`;
        });

        manifest += `<item id="style" href="Styles/hub.css" media-type="text/css"/>\n`;

        return `<?xml version="1.0" encoding="utf-8"?>
    <package xmlns="http://www.idpf.org/2007/opf" version="2.0" unique-identifier="BookId">
      <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
        <dc:identifier id="BookId">urn:uuid:12345</dc:identifier>
        <dc:title>書名</dc:title>
        <dc:language>zh-TW</dc:language>
        <dc:creator>作者</dc:creator>
      </metadata>
      <manifest>
        ${manifest}
        <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
      </manifest>
      <spine toc="ncx">
        <itemref idref="cover"/>
        <itemref idref="toc"/>
        ${spine}
      </spine>
    </package>`;
    }

    function generateTocNcx(chapters) {
        let navPoints = "";
        chapters.slice(1).forEach((chapter, i) => {
            if (i >= chapters.length - 2) return;
            const title = chapter.title;
            const fileIndex = i + 1;
            navPoints += `<navPoint id="navPoint-${i + 2}" playOrder="${i + 2}">
  <navLabel><text>${title}</text></navLabel>
  <content src="Text/file${fileIndex}.xhtml"/>
</navPoint>\n`;
        });
        return `<?xml version="1.0" encoding="utf-8"?>
    <!DOCTYPE ncx PUBLIC "-//NISO//DTD ncx 2005-1//EN" "http://www.daisy.org/z3986/2005/ncx-2005-1.dtd">
    <ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
      <head>
        <meta name="dtb:uid" content="urn:uuid:12345"/>
        <meta name="dtb:depth" content="1"/>
        <meta name="dtb:totalPageCount" content="0"/>
        <meta name="dtb:maxPageNumber" content="0"/>
      </head>
      <navMap>
        ${navPoints}
      </navMap>
    </ncx>`;
    }

    const opfContent = generateOpf(chapters);
    const tocNcxContent = generateTocNcx(chapters);

    const tocContent = `
  <?xml version="1.0" encoding="utf-8"?>
  <!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN"
    "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">
  <html xmlns="http://www.w3.org/1999/xhtml" lang="zh-TW" xml:lang="zh-TW">
    <head>
      <meta charset="UTF-8"/>
      <title>目錄</title>
    </head>
    <body>
      <h1>目錄</h1>
      <ul>
        ${chapters
            .slice(1)
            .filter((_, i) => i < chapters.length - 2)
            .map((chapter, i) => {
                const fileName = `file${i + 1}.xhtml`;
                return `<li><a href="${fileName}">${chapter.title}</a></li>`;
            })
            .join("\n")}
      </ul>
    </body>
  </html>
  `;
    fs.writeFileSync(path.join(OEBPS, "Text/toc.xhtml"), tocContent, "utf-8");
    fs.writeFileSync(path.join(OEBPS, "content.opf"), opfContent);
    fs.writeFileSync(path.join(OEBPS, "toc.ncx"), tocNcxContent);
    fs.writeFileSync(path.join(tmp, "mimetype"), "application/epub+zip");
    fs.writeFileSync(
        path.join(META_INF, "container.xml"),
        `<?xml version="1.0"?>
  <container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
    <rootfiles>
      <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
    </rootfiles>
  </container>`,
    );

    const newZip = new AdmZip();
    newZip.addFile("mimetype", Buffer.from("application/epub+zip"), "", 0);
    function addDir(d, base = "") {
        fs.readdirSync(d).forEach((f) => {
            if (f === "mimetype") return;
            const full = path.join(d, f);
            const rel = path.join(base, f);
            console.log(`Adding file: ${full}`);
            if (fs.statSync(full).isDirectory()) addDir(full, rel);
            else newZip.addLocalFile(full, path.dirname(rel));
        });
    }
    addDir(tmp);
    newZip.writeZip(outputPath);

    console.log("EPUB 處理完成:", outputPath);
    process.exit(0);
} catch (err) {
    console.error("發生錯誤:", err.message);
    console.error(err.stack);
    process.exit(1);
}
