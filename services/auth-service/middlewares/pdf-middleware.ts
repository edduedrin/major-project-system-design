import PDFDocument from "pdfkit";
import { fileMiddleware } from "./file-middleware";
import { PassbookStatementPayload } from "../types";

export class PDFMiddleware {
    async generatePassbookStatement(payload: PassbookStatementPayload): Promise<string> {
        return new Promise((resolve, reject) => {
            try {
                const doc = new PDFDocument({
                    margin: 40,
                    size: "A4"
                });
                const chunks: Buffer[] = [];

                doc.on("data", (chunk: Buffer) => chunks.push(chunk));
                doc.on("end", () => {
                    const pdfBuffer = Buffer.concat(chunks);
                    const fileName = `passbook_statement_${payload.userId}_${Date.now()}.pdf`;
                    const fileToUpload = {
                        buffer: pdfBuffer,
                        originalname: fileName,
                        mimetype: "application/pdf",
                    } as Express.Multer.File;

                    fileMiddleware.uploadFile(fileToUpload, "statements")
                        .then(uploadedFileName => resolve(uploadedFileName))
                        .catch(err => reject(err));
                });

                const pageWidth = 595.28;
                const pageHeight = 841.89;
                const margin = 40;
                const contentWidth = pageWidth - (margin * 2);

                // Header Section
                doc.fontSize(24)
                    .font("Helvetica-Bold")
                    .fillColor("#000000")
                    .text("ZF [pro]Points Loyalty Program", margin, 50, {
                        align: "center",
                        width: contentWidth
                    });

                doc.moveTo(margin + 120, 82)
                    .lineTo(pageWidth - margin - 120, 82)
                    .lineWidth(2)
                    .strokeColor("#000000")
                    .stroke();

                doc.moveDown(2.5);

                // User Information Card
                const cardY = doc.y;
                const cardHeight = 95;

                doc.roundedRect(margin, cardY, contentWidth, cardHeight, 5)
                    .fillAndStroke("#f5f5f5", "#cccccc");

                doc.fillColor("#0057B7");

                const leftPadding = margin + 20;
                doc.fontSize(11)
                    .font("Helvetica-Bold")
                    .fillColor("#000000")
                    .text("Account Holder Details", leftPadding, cardY + 15);

                doc.fontSize(10)
                    .font("Helvetica")
                    .fillColor("#000000");

                doc.font("Helvetica-Bold").text("Name:", leftPadding, cardY + 35, { continued: true })
                    .font("Helvetica").text(`  ${payload.user.name}`);

                doc.font("Helvetica-Bold").text("Firm:", leftPadding, cardY + 52, { continued: true })
                    .font("Helvetica").text(`  ${payload.user.firmName}`);

                doc.font("Helvetica-Bold").text("Role:", leftPadding, cardY + 69, { continued: true })
                    .font("Helvetica").text(`  ${payload.user.role}`);

                // Summary Box
                const summaryX = pageWidth - margin - 200;
                const summaryBoxY = cardY + 12;
                const summaryWidth = 180;
                const summaryHeight = 70;

                doc.roundedRect(summaryX, summaryBoxY, summaryWidth, summaryHeight, 5)
                    .fillAndStroke("#0057B7", "#0057B7");

                doc.fillColor("#ffffff")
                    .fontSize(11)
                    .font("Helvetica-Bold")
                    .text("ACCOUNT SUMMARY", summaryX, summaryBoxY + 10, {
                        width: summaryWidth,
                        align: "center"
                    });

                doc.moveTo(summaryX + 15, summaryBoxY + 27)
                    .lineTo(summaryX + summaryWidth - 15, summaryBoxY + 27)
                    .strokeColor("#ffffff")
                    .lineWidth(1)
                    .stroke();

                doc.fontSize(9).font("Helvetica");

                const summaryStartY = summaryBoxY + 35;
                const summaryLineHeight = 12;

                const formatNumber = (amount: number) => {
                    const val = Number(amount || 0);
                    let formatted = val.toLocaleString('en-IN', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                    });
                    formatted = String(formatted).replace(/[¹⁰⁴⁵⁶⁷⁸⁹⁺⁻]/g, '');
                    formatted = formatted.replace(/[^0-9,\.\-]/g, '');
                    return formatted;
                };

                doc.text("Balance:", summaryX + 15, summaryStartY)
                    .text(formatNumber(payload.summary.totalBalance), summaryX + 15, summaryStartY, {
                        width: summaryWidth - 30,
                        align: "right"
                    });

                doc.text("Earned:", summaryX + 15, summaryStartY + summaryLineHeight)
                    .text(formatNumber(payload.summary.totalEarned), summaryX + 15, summaryStartY + summaryLineHeight, {
                        width: summaryWidth - 30,
                        align: "right"
                    });

                doc.text("Redeemed:", summaryX + 15, summaryStartY + (summaryLineHeight * 2))
                    .text(formatNumber(payload.summary.totalRedeemed), summaryX + 15, summaryStartY + (summaryLineHeight * 2), {
                        width: summaryWidth - 30,
                        align: "right"
                    });

                doc.y = cardY + cardHeight + 25;

                // Transaction Table Section
                doc.fontSize(13)
                    .font("Helvetica-Bold")
                    .fillColor("#000000")
                    .text("Transaction History", margin, doc.y);

                doc.moveDown(1);

                const tableTop = doc.y;
                const rowHeight = 28;

                const cols = {
                    sno: { x: margin, width: 35 },
                    date: { x: margin + 40, width: 75 },
                    remarks: { x: margin + 120, width: 165 },
                    dr: { x: margin + 290, width: 70 },
                    cr: { x: margin + 365, width: 70 },
                    balance: { x: margin + 440, width: 75 }
                };

                const drawTableHeader = (topY: number) => {
                    doc.roundedRect(margin, topY, contentWidth, 24, 3).fill("#0057B7");
                    doc.fillColor("#ffffff").fontSize(9.5).font("Helvetica-Bold");

                    doc.text("S.No", cols.sno.x + 5, topY + 7, {
                        width: cols.sno.width,
                        align: "center",
                    });
                    doc.text("Date", cols.date.x + 5, topY + 7, {
                        width: cols.date.width - 10,
                        align: "left",
                    });
                    doc.text("Description", cols.remarks.x + 5, topY + 7, {
                        width: cols.remarks.width - 10,
                        align: "left",
                    });
                    doc.text("Debit", cols.dr.x, topY + 7, {
                        width: cols.dr.width,
                        align: "right",
                    });
                    doc.text("Credit", cols.cr.x, topY + 7, {
                        width: cols.cr.width,
                        align: "right",
                    });
                    doc.text("Balance", cols.balance.x, topY + 7, {
                        width: cols.balance.width,
                        align: "right",
                    });
                };

                drawTableHeader(tableTop);
                let currentY = tableTop + 24;

                // Table Rows
                payload.transactions.forEach((t, index) => {
                    if (currentY + rowHeight > pageHeight - 40) {
                        doc.addPage();
                        const newTop = margin + 20;
                        drawTableHeader(newTop);
                        currentY = newTop + 24;
                    }

                    if (index % 2 === 0) {
                        doc.rect(margin, currentY, contentWidth, rowHeight).fill("#f5f5f5");
                    } else {
                        doc.rect(margin, currentY, contentWidth, rowHeight).fill("#ffffff");
                    }

                    doc.fillColor("#0057B7").fontSize(9).font("Helvetica");

                    const textY = currentY + 9;

                    doc.text(String(t.sno), cols.sno.x + 5, textY, {
                        width: cols.sno.width,
                        align: "center"
                    });

                    const dateStr = new Date(t.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric'
                    });
                    doc.text(dateStr, cols.date.x + 5, textY, {
                        width: cols.date.width - 10,
                        align: "left"
                    });

                    doc.text(t.remarks || "-", cols.remarks.x + 5, textY, {
                        width: cols.remarks.width - 10,
                        align: "left",
                        ellipsis: true
                    });

                    if (t.dr) {
                        doc.fillColor("#e74242");
                    } else {
                        doc.fillColor("#0057B7");
                    }
                    const drText = t.dr ? formatNumber(t.dr) : "-";
                    doc.text(drText, cols.dr.x, textY, {
                        width: cols.dr.width - 5,
                        align: "right"
                    });

                    if (t.cr) {
                        doc.fillColor("#10c703");
                    } else {
                        doc.fillColor("#0057B7");
                    }
                    const crText = t.cr ? formatNumber(t.cr) : "-";
                    doc.text(crText, cols.cr.x, textY, {
                        width: cols.cr.width - 5,
                        align: "right"
                    });

                    doc.fillColor("#0057B7").font("Helvetica-Bold")
                        .text(formatNumber(t.balance), cols.balance.x, textY, {
                            width: cols.balance.width - 5,
                            align: "right"
                        });

                    doc.moveTo(margin, currentY + rowHeight)
                        .lineTo(pageWidth - margin, currentY + rowHeight)
                        .strokeColor("#cccccc")
                        .lineWidth(0.5)
                        .stroke();

                    currentY += rowHeight;
                });

                doc.end();
            } catch (err) {
                reject(err);
            }
        });
    }
}

export const pdfMiddleware = new PDFMiddleware();
