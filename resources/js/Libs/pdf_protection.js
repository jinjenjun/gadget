import fs from "fs";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

// 亂碼 + 零寬字
function generateOverlayText(length = 80) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const zeroWidth = "\u200B";

  return Array.from({ length }, () => {
    const c = chars[Math.floor(Math.random() * chars.length)];
    return c + zeroWidth;
  }).join("");
}

async function addInvisibleOverlay(inputPath, outputPath) {
  const existingPdfBytes = fs.readFileSync(inputPath);
  const pdfDoc = await PDFDocument.load(existingPdfBytes);

  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const pages = pdfDoc.getPages();

  for (const page of pages) {
    const { width, height } = page.getSize();

    const fontSize = 10;
    const lineHeight = 14;

    for (let y = height - 20; y > 0; y -= lineHeight) {
      const overlayText = generateOverlayText(100);

      page.drawText(overlayText, {
        x: 5 + Math.random() * 3,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
        opacity: 0.015,
      });
    }
  }

  const pdfBytes = await pdfDoc.save();
  fs.writeFileSync(outputPath, pdfBytes);

  console.log("PDF 處理完成");
}

// 🔥 接收 CLI 參數
const [, , input, output] = process.argv;

if (!input || !output) {
  console.error("用法: node pdf_protection.js input.pdf output.pdf");
  process.exit(1);
}

addInvisibleOverlay(input, output);
