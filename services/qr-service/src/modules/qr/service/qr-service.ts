import crypto from "crypto";
import QRCode from "qrcode";
import qrRepository from "../repository/qr-repository";
import { CustomError } from "../../../types";

// Helper to generate a unique readable serial number
function generateSerialNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  const bytes = crypto.randomBytes(12);
  let result = "ZF-";
  for (let i = 0; i < 12; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}

export class QrService {
  async generateCodes(data: {
    productId?: string;
    productName?: string;
    quantity?: number;
  }) {
    const productId = data.productId || null;
    const productName = data.productName || null;
    const quantity = Math.min(Math.max(data.quantity || 1, 1), 100);

    const serialNumbers: string[] = [];

    // Ensure we generate unique serial numbers that don't collision in DB
    while (serialNumbers.length < quantity) {
      const sn = generateSerialNumber();
      if (!serialNumbers.includes(sn)) {
        const existing = await qrRepository.findCodeBySerialNumber(sn);
        if (!existing) {
          serialNumbers.push(sn);
        }
      }
    }

    // Map to db objects
    const insertData = serialNumbers.map((sn) => ({
      serialNumber: sn,
      productId,
      productName,
      status: "GENERATED",
    }));

    // Bulk insert into database
    const createdRecords = await qrRepository.createCodes(insertData);

    // Generate QR Code base64 data url for each created code
    const results = await Promise.all(
      createdRecords.map(async (record) => {
        const qrCodeUrl = await QRCode.toDataURL(record.serialNumber);
        return {
          id: record.id,
          serialNumber: record.serialNumber,
          productId: record.productId,
          productName: record.productName,
          status: record.status,
          qrCodeUrl,
          createdAt: record.createdAt,
        };
      })
    );

    return results;
  }

  async getCodes(
    filters: { productId?: string; status?: string },
    page: number = 1,
    limit: number = 10
  ) {
    const activePage = Math.max(page, 1);
    const activeLimit = Math.max(limit, 1);
    const offset = (activePage - 1) * activeLimit;

    const [items, total] = await Promise.all([
      qrRepository.getCodes(filters, activeLimit, offset),
      qrRepository.getTotalCodesCount(filters),
    ]);

    return {
      items,
      pagination: {
        page: activePage,
        limit: activeLimit,
        total,
        pages: Math.ceil(total / activeLimit),
      },
    };
  }

  async validateCode(serialNumber: string) {
    if (!serialNumber) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Serial number is required",
      });
    }

    const record = await qrRepository.findCodeBySerialNumber(serialNumber.trim());
    if (!record) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Product Unique Code not found or invalid",
      });
    }

    return {
      valid: true,
      data: {
        id: record.id,
        serialNumber: record.serialNumber,
        productId: record.productId,
        productName: record.productName,
        status: record.status,
        scannedCount: record.scannedCount,
        lastScannedAt: record.lastScannedAt,
        createdAt: record.createdAt,
      },
    };
  }

  async scanCode(data: {
    qrContent: string;
    scanMethod: string;
    metaData: {
      ipAddress?: string;
      userAgent?: string;
      latitude?: string;
      longitude?: string;
    };
  }) {
    if (!data.qrContent) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "QR Code content or serial number is required",
      });
    }

    let serialNumber = data.qrContent.trim();
    const scanMethod = data.scanMethod === "MANUAL_ENTRY" ? "MANUAL_ENTRY" : "QR_SCAN";

    // Detect if content is a URL and extract the code
    if (serialNumber.startsWith("http://") || serialNumber.startsWith("https://")) {
      try {
        const url = new URL(serialNumber);
        const codeParam = url.searchParams.get("code") || url.searchParams.get("serialNumber");
        if (codeParam) {
          serialNumber = codeParam;
        } else {
          const pathParts = url.pathname.split("/");
          const lastPart = pathParts[pathParts.length - 1];
          if (lastPart && lastPart.startsWith("ZF-")) {
            serialNumber = lastPart;
          } else {
            const match = url.pathname.match(/(ZF-[A-Z0-9]{12})/i);
            if (match) {
              serialNumber = match[1];
            }
          }
        }
      } catch (err) {
        // Fall back to using qrContent as the raw serial number
      }
    }

    // Look up in database
    const record = await qrRepository.findCodeBySerialNumber(serialNumber);
    if (!record) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Invalid QR Code or serial number",
      });
    }

    const newScanCount = record.scannedCount + 1;
    const nextStatus = record.status === "GENERATED" ? "SCANNED" : record.status;
    const now = new Date();

    // Update product code
    const updatedRecord = await qrRepository.updateCodeStatusAndScanCount(
      record.id,
      nextStatus,
      newScanCount,
      now
    );

    // Insert into scan history log
    await qrRepository.insertScanHistory({
      codeId: record.id,
      scanMethod,
      ipAddress: data.metaData.ipAddress,
      userAgent: data.metaData.userAgent,
      latitude: data.metaData.latitude,
      longitude: data.metaData.longitude,
    });

    return {
      message: "Code scanned and processed successfully",
      serialNumber: updatedRecord.serialNumber,
      productId: updatedRecord.productId,
      productName: updatedRecord.productName,
      status: updatedRecord.status,
      scannedCount: updatedRecord.scannedCount,
      lastScannedAt: updatedRecord.lastScannedAt,
    };
  }

  async getQrCodeImage(serialNumber: string): Promise<Buffer> {
    if (!serialNumber) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Serial number is required",
      });
    }

    const record = await qrRepository.findCodeBySerialNumber(serialNumber.trim());
    if (!record) {
      throw new CustomError({
        statusCode: 404,
        responseCode: 404,
        responseMessage: "Product Unique Code not found",
      });
    }

    // Return QR Code image buffer directly
    return await QRCode.toBuffer(record.serialNumber, {
      type: "png",
      width: 300,
      margin: 2,
    });
  }
}

export default new QrService();
