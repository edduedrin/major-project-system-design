import { Request, Response, NextFunction } from "express";
import { CustomError, InsertQrIntoDbRequest } from "../types";
import { customValidators } from "../utils/custom-validators";
import { FetchQrCodeFromOpenSourceApiRequest, generateQrRequest } from "../types/qr";
import { inventoryBatchRepository, inventoryRepository, randomKeysRepository, skuRepository } from "../repositories";
import { publishJob } from "../services/rabbitMqNew/publisher";
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import axios, { AxiosRequestConfig } from 'axios';
import { attachToLabel } from "../utils/attach_qr_label";
import { labeTemplates } from "../configs/label_templates";
import { fileMiddleware } from "../middlewares/file-middleware";
import pLimit from "p-limit";
import Jimp from "jimp";
import sharp from "sharp";
import QRCode, { QRCodeToBufferOptions } from "qrcode";
import { NotificationMiddleware } from "../middlewares/notification-middleware";

export type generateQrUpdatedPayload = {
    payload: generateQrRequest;
    createdBy: number;
}
class QrController {
    private customError: CustomError;

    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400,
        });
    }

    enqueueQrGeneration = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Simulate QR code generation logic
            console.log(req.body)
            let payload: generateQrRequest = customValidators.generateQr(req.body);
            let doesSkuExist: boolean = await skuRepository.doesSkuExist(payload.skuCode);
            if (!doesSkuExist) {
                this.customError.responseMessage = "SKU not present";
                throw this.customError;
            }
            console.log({ payload, createdBy: req.user?.userId });
            // The message structure will be:
            // { payload: { quantity: X, skuCode: 'Y' }, createdBy: Z }
            await publishJob({ type: 'qr', payload: { payload, createdBy: req.user?.userId } });
            return res.status(200).json({
                code: 200,
                message: "QR code generation in progress. Please check after some time."
            });
        } catch (error) {
            next(error);
        }
    }
    generateQr = async (payload: generateQrUpdatedPayload) => {
        try {
            //Validate the payload
            // Validate the payload (re-validating the raw object parsed from JSON on the consumer side)
            let validatedPayload: generateQrRequest = customValidators.generateQr(payload.payload);
            // Fetch available keys
            console.log(payload.payload)
            let skuDetails = await skuRepository.getSkuWithRelationsBy("skuCode", validatedPayload.skuCode);
            console.log(skuDetails)
            let randomKey = await randomKeysRepository.fetchAvailableKeys(validatedPayload.quantity);
            if (!randomKey || randomKey.length === 0 || randomKey.length < validatedPayload.quantity) {
                throw new Error("No available keys found for QR code generation.");
            }
            let spData: InsertQrIntoDbRequest = new InsertQrIntoDbRequest({
                qrData: randomKey.map(key => 'ZF' + skuDetails.categoryShortCode + key.random_key + 'TRW'),
                skuCode: validatedPayload.skuCode,
                quantity: validatedPayload.quantity,
                createdBy: payload.createdBy
            });
            console.log(spData)
            const batchId = await inventoryBatchRepository.bulkInsert(spData);
            await publishJob({ type: 'qr_pdf', payload: { batchId: batchId } });
        } catch (error: any) {
            console.log(error)
            throw new Error("Error generating QR code%%%%%%%%: " + error.message);
        }
    }

    publishBatchId = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { batchId } = req.body;
            if (!batchId) {
                this.customError.responseMessage = "Batch Id is required";
                this.customError.responseCode = 400;
                throw this.customError;
            }
            await publishJob({ type: 'qr_pdf', payload: { batchId: batchId } });
            return res.status(200).json({
                code: 200,
                message: "Batch published successfully."
            });
        } catch (error) {
            next(error);
        }
    }

    generateQrImage = async (
        data: FetchQrCodeFromOpenSourceApiRequest
    ): Promise<Buffer> => {

        const options: QRCodeToBufferOptions = {
            errorCorrectionLevel: (data.ecc as "L" | "M" | "Q" | "H") || "H",
            margin: Number(data.margin) || 2,
            width: Number(data.size),
            type: "png"
        };

        const qrBuffer = await QRCode.toBuffer(data.data, options);

        return qrBuffer;
    };




    generateQrPdf = async ({ batchId }: { batchId: number }) => {

        try {

            const startTime = Date.now();

            const mmToPoints = (mm: number) => mm * 2.83465;

            const pageWidth = mmToPoints(80);
            const pageHeight = mmToPoints(45);

            const QR_MARGIN = process.env.QR_MARGIN || "2";
            const QR_ECC = process.env.QR_ECC || "H";

            const payload = await inventoryRepository.getInventoryByBatchId(batchId);
            const batch = await inventoryBatchRepository.fetchBatchById(batchId);

            const templateBuffer = Buffer.from(labeTemplates.TEMPLATE4X, "base64");

            // Template size
            const templateWidth = 1520;
            const templateHeight = 800;

            // Layout positions (image coordinate system)
            const qrLeft = 72;
            const qrTop = 44;

            const serialX = 1041;
            const serialY = 616;

            const trwX = 1041;
            const trwY = 536;

            // Recommended QR size
            // const qrPixelSize = 350;
            const qrPixelSize = Math.floor(templateHeight * 0.75);

            const pdfDoc = await PDFDocument.create();

            // Embed template once
            const templateImage = await pdfDoc.embedPng(templateBuffer);

            // Embed font once
            const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

            const limit = pLimit(16);

            for (const pay of payload) {

                await limit(async () => {

                    const serialNumber = pay.serialNumber;
                    const trwNumber = batch?.skuCode || "";

                    const qrCodeBuffer = await this.generateQrImage(
                        new FetchQrCodeFromOpenSourceApiRequest(
                            serialNumber,
                            QR_ECC,
                            QR_MARGIN,
                            "png",
                            qrPixelSize,
                            "1"
                        )
                    );

                    const qrImage = await pdfDoc.embedPng(qrCodeBuffer);

                    const page = pdfDoc.addPage([pageWidth, pageHeight]);

                    // Draw template background
                    page.drawImage(templateImage, {
                        x: 0,
                        y: 0,
                        width: pageWidth,
                        height: pageHeight
                    });

                    // Coordinate conversion
                    const scaleX = pageWidth / templateWidth;
                    const scaleY = pageHeight / templateHeight;

                    const qrX = qrLeft * scaleX;
                    const qrY = pageHeight - (qrTop * scaleY) - (qrPixelSize * scaleY);

                    const serialPdfX = serialX * scaleX;
                    const serialPdfY = pageHeight - (serialY * scaleY);

                    const trwPdfX = trwX * scaleX;
                    const trwPdfY = pageHeight - (trwY * scaleY);

                    const qrWidth = qrPixelSize * scaleX;
                    const qrHeight = qrPixelSize * scaleY;

                    // Draw QR
                    page.drawImage(qrImage, {
                        x: qrX,
                        y: qrY,
                        width: qrWidth,
                        height: qrHeight
                    });

                    // Draw TRW
                    page.drawText(trwNumber, {
                        x: trwPdfX,
                        y: trwPdfY,
                        size: 32 * scaleY,
                        font,
                        color: rgb(0, 0, 0)
                    });

                    // Draw Serial
                    page.drawText(serialNumber, {
                        x: serialPdfX,
                        y: serialPdfY,
                        size: 32 * scaleY,
                        font,
                        color: rgb(0, 0, 0)
                    });

                });

            }

            const pdfBytes = await pdfDoc.save();

            const simulatedFile: Express.Multer.File = {
                fieldname: "file",
                originalname: `qr_code_${Date.now()}.pdf`,
                encoding: "7bit",
                mimetype: "application/pdf",
                size: pdfBytes.length,
                buffer: Buffer.from(pdfBytes),
                destination: "",
                filename: "",
                path: "",
                stream: undefined as any
            };

            const uploadedFile = await fileMiddleware.uploadFile(simulatedFile, "qrFile");

            await fileMiddleware.getFileSignedUrl(uploadedFile, "qrFile");

            await inventoryBatchRepository.updateFieldByBatchId(
                batchId,
                "file_url",
                uploadedFile
            );

            const endTime = Date.now();

            console.log("-------------PERFORMANCE REPORT-------------");
            console.log(`Total QRs generated: ${payload.length}`);
            console.log(`Total execution time: ${endTime - startTime} ms`);
            console.log(`Average time per QR: ${(endTime - startTime) / payload.length} ms`);
            console.log("--------------------------------------------");

        } catch (error: any) {
            throw new Error("Error generating QR code: " + error.message);
        }

    };

    fetchQrFile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let batchId = Number(req.query?.batchId || 0);
            let batch = await inventoryBatchRepository.fetchBatchById(batchId);
            console.log(batch);
            if (!batch || !batch.fileUrl) {
                return res.status(404).json({ message: "Batch not found or file URL not available." });
            }
            const fileUrl = batch.fileUrl;
            const filePath = await fileMiddleware.getFileSignedUrl(fileUrl, 'qrFile');
            console.log(filePath)
            if (!filePath) {
                return res.status(404).json({ message: "File not found." });
            }
            return res.status(200).json({
                code: 200,
                message: "File fetched successfully.",
                fileUrl: filePath
            });
        } catch (error) {
            next(error);
        }
    }

    fetchQrHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const filters = {
                skuCode: req.query.skuCode,
                fromDate: req.query.fromDate,
                toDate: req.query.toDate,
                page: req.query.page,
                limit: req.query.limit
            };

            let qrHistory = await inventoryBatchRepository.fetchAllBatches(filters);
            return res.status(200).json({
                code: 200,
                message: "Qr history fetched successfully",
                qrHistory: qrHistory.data,
                total: qrHistory.total,
                page: qrHistory.page,
                limit: qrHistory.limit,
                totalPages: qrHistory.totalPages
            });
        } catch (error) {
            next(error)
        }
    }

    productScan = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.productScan(req.body, req?.userDetails);
            const scanDetails = await inventoryRepository.productScan(payload, req?.userDetails);
            console.log(scanDetails?.points && req?.userDetails?.userId)
            if (scanDetails?.points && req?.userDetails?.userId) {
                NotificationMiddleware.notifySuccessfulScan(req.userDetails.userId, Number(scanDetails.points)).catch(err => console.error("Notification Error:", err));
            }

            return res.json({
                code: 200,
                message: "success",
                data: {
                    points: scanDetails?.points || "0"
                }
            });
        } catch (error) {
            next(error)
        }
    }

    bulkProductScan = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1️⃣ Validate payload
            const payload = customValidators.productScanBulkValidator(req.body);

            /**
             * Expected payload format:
             * {
             *   items: [
             *     { userCode: "USR001", payload: { qr: "SN001" } },
             *     { userCode: "USR002", payload: { qr: "SN002" } },
             *     { userCode: "USR001", payload: { qr: "SN003" } }
             *   ]
             * }
             */

            if (!payload?.items || !Array.isArray(payload.items)) {
                throw new CustomError({
                    responseCode: 400,
                    responseMessage: "Invalid request: items[] is required"
                });
            }

            // 2️⃣ Call DB bulk function
            const scanResults = await inventoryRepository.bulkProductScanForMultipleUsers(payload.items);

            // 3️⃣ Response back to client
            return res.json({
                code: 200,
                message: "Bulk scan processed successfully",
                data: scanResults
            });

        } catch (error) {
            next(error);
        }
    };

}

export const qrController = new QrController();
