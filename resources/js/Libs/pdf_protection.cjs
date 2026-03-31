const fs = require("fs");
const path = require("path");
const { PDFDocument, rgb } = require("pdf-lib");
const fontkit = require("@pdf-lib/fontkit");

const invisible_chars = [
    "\u200B",
    "\u200C",
    "\u200D",
    "\u2060",
    "未經授權不得以任何進形式進行編輯和資料分析",
    "你好嗎",
    "為什麼",
    "★",
    "☆",
    "※",
    "╳",
    "■",
    "◆",
];

function injectInvisibleChars(text) {
    let result = "";

    for (let i = 0; i < text.length; i++) {
        result += text[i];

        if (Math.random() < 0.4) {
            const count = Math.floor(Math.random() * 2) + 1;
            for (let j = 0; j < count; j++) {
                result +=
                    invisible_chars[
                        Math.floor(Math.random() * invisible_chars.length)
                    ];
            }
        }
    }

    return result;
}

function generateFakeReadableText(length = 80) {
    const chars =
        "的一是在不了有人這中大為上個國我以要他時來用們生到作地於出就分對成會可主發年動同工也能下過子說產種面而方後多定行學法所民得經十三之進著等部度家電力裡如水化高自二理起小物現實加量都兩體制機當使點從業本去把性好應開它合還因由其些然前外天政四日那社義事平形相全表間樣與關各重新線內數正心反你明看原又麼利比或但質氣第向道命此變條只沒結解問意建月公無系軍很情者最立代想已通並提直題黨程展五果料象員革位入常文總次品式活設及管特件長求老";

    const baseText = Array.from({ length }, () => {
        return chars[Math.floor(Math.random() * chars.length)];
    }).join("");

    return injectInvisibleChars(baseText);
}

function generateOverlayText(length = 80) {
    const chars =
        "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789你我他她嗎吧呀喔啊★☆※╳■◆";

    const baseText = Array.from({ length }, () => {
        return chars[Math.floor(Math.random() * chars.length)];
    }).join("");

    return injectInvisibleChars(baseText);
}

async function addInvisibleOverlay(inputPath, outputPath) {
    console.log("[Node] argv:", process.argv);

    if (!fs.existsSync(inputPath)) {
        throw new Error("輸入檔案不存在: " + inputPath);
    }

    const existingPdfBytes = fs.readFileSync(inputPath);
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    pdfDoc.registerFontkit(fontkit);

    const fontPath = path.join(
        __dirname,
        "../../../public/fonts/01金梅毛筆行書.ttf",
    );

    if (!fs.existsSync(fontPath)) {
        throw new Error("找不到字型檔: " + fontPath);
    }

    const fontBytes = fs.readFileSync(fontPath);
    const font = await pdfDoc.embedFont(fontBytes);

    const pages = pdfDoc.getPages();
    const totalPages = pages.length;
    const processPages = Math.min(3, totalPages); // 只處理前3頁

    console.log(`[Node] PDF 總頁數: ${totalPages}`);
    console.log(`[Node] 實際處理頁數: ${processPages}`);

    for (let i = 0; i < processPages; i++) {
        const page = pages[i];
        const { width, height } = page.getSize();

        console.log(`[Node] 處理第 ${i + 1} 頁 / 共 ${totalPages} 頁`);

        for (let y = height - 20; y > 0; y -= 14) {
            const fakeText = generateFakeReadableText(80);

            page.drawText(fakeText, {
                x: 5,
                y,
                size: 10,
                font,
                color: rgb(0, 0, 0),
                opacity: 0,
            });

            const overlayText = generateOverlayText(80);

            page.drawText(overlayText, {
                x: 5 + Math.random(),
                y: y + Math.random(),
                size: 10,
                font,
                color: rgb(0, 0, 0),
                opacity: 0,
            });
        }
    }

    console.log("[Node] 第 4 頁之後不做任何修改");

    const pdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPath, pdfBytes);

    console.log("[Node] PDF 儲存完成:", outputPath);
}

const input = process.argv[2];
const output = process.argv[3];

if (!input || !output) {
    console.error("[Node] 缺少參數");
    process.exit(1);
}

addInvisibleOverlay(input, output)
    .then(() => process.exit(0))
    .catch((err) => {
        console.error("[Node ERROR]", err);
        process.exit(1);
    });
