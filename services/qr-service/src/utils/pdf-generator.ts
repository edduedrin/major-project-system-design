import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";
import QRCode from "qrcode";

export interface GeneratePdfOptions {
  jobId: string;
  productId?: string | null;
  productName?: string | null;
  serialNumbers: string[];
}

export interface GeneratePdfResult {
  pdfFileName: string;
  pdfPath: string;
}

export async function generateQrPdf(options: GeneratePdfOptions): Promise<GeneratePdfResult> {
  const { jobId, productId, productName, serialNumbers } = options;

  const storageDir = path.join(process.cwd(), "storage", "pdfs");
  if (!fs.existsSync(storageDir)) {
    fs.mkdirSync(storageDir, { recursive: true });
  }

  const pdfFileName = `qr_codes_${jobId}_${Date.now()}.pdf`;
  const pdfPath = path.join(storageDir, pdfFileName);

  const doc = new PDFDocument({ margin: 50, size: "A4" });
  const writeStream = fs.createWriteStream(pdfPath);

  doc.pipe(writeStream);

  // Cover / Header
  doc.fontSize(20).text("QR Code & Serial Number Batch Sheet", { align: "center" });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Job ID: ${jobId}`);
  if (productId) doc.text(`Product ID: ${productId}`);
  if (productName) doc.text(`Product Name: ${productName}`);
  doc.text(`Total Codes: ${serialNumbers.length}`);
  doc.text(`Generated At: ${new Date().toLocaleString()}`);
  doc.moveDown(1);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
  doc.moveDown(1);

  // Generate QR buffers and lay out in a clean grid (2 items per row)
  const itemWidth = 220;
  const itemHeight = 220;
  const startX = 50;
  let currentX = startX;
  let currentY = doc.y;

  for (let i = 0; i < serialNumbers.length; i++) {
    const sn = serialNumbers[i];
    const qrBuffer = await QRCode.toBuffer(sn, {
      type: "png",
      width: 150,
      margin: 2,
    });

    // Check if we need a new page
    if (currentY + itemHeight > 750) {
      doc.addPage();
      currentY = 50;
      currentX = startX;
    }

    // Draw card box
    doc.roundedRect(currentX, currentY, itemWidth, itemHeight, 8).stroke("#cccccc");

    // Draw QR Code image in card
    doc.image(qrBuffer, currentX + 35, currentY + 15, { width: 150, height: 150 });

    // Draw Serial Number text
    doc.fontSize(11).font("Helvetica-Bold").fillColor("#000000").text(sn, currentX + 10, currentY + 175, {
      width: itemWidth - 20,
      align: "center",
    });

    // Draw item index
    doc.fontSize(9).font("Helvetica").fillColor("#666666").text(`#${i + 1}`, currentX + 10, currentY + 195, {
      width: itemWidth - 20,
      align: "center",
    });

    // Advance position (2 cards per row)
    if ((i + 1) % 2 === 0) {
      currentX = startX;
      currentY += itemHeight + 20;
    } else {
      currentX += itemWidth + 25;
    }
  }

  doc.end();

  return new Promise((resolve, reject) => {
    writeStream.on("finish", () => {
      resolve({ pdfFileName, pdfPath });
    });
    writeStream.on("error", (err) => {
      reject(err);
    });
  });
}
