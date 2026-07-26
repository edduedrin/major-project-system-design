import { DatabaseConnection } from "../../../database/database-connection";
import { productUniqueCodes, qrScanHistory, qrGenerationJobs } from "../../../database/schema/schema";
import { eq, and, sql } from "drizzle-orm";

export class QrRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async createCodes(data: {
    serialNumber: string;
    productId?: string | null;
    productName?: string | null;
    status?: string;
  }[]) {
    const results = await this.db
      .insert(productUniqueCodes)
      .values(data)
      .returning();
    return results;
  }

  async getCodes(filters: { productId?: string; status?: string }, limit: number, offset: number) {
    let query = this.db.select().from(productUniqueCodes);
    const conditions = [];
    if (filters.productId) {
      conditions.push(eq(productUniqueCodes.productId, filters.productId));
    }
    if (filters.status) {
      conditions.push(eq(productUniqueCodes.status, filters.status));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.limit(limit).offset(offset);
  }

  async getTotalCodesCount(filters: { productId?: string; status?: string }): Promise<number> {
    const conditions = [];
    if (filters.productId) {
      conditions.push(eq(productUniqueCodes.productId, filters.productId));
    }
    if (filters.status) {
      conditions.push(eq(productUniqueCodes.status, filters.status));
    }
    
    let query = this.db.select({ count: sql<number>`count(*)` }).from(productUniqueCodes);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async findCodeBySerialNumber(serialNumber: string) {
    const result = await this.db
      .select()
      .from(productUniqueCodes)
      .where(eq(productUniqueCodes.serialNumber, serialNumber))
      .limit(1);
    return result[0] || null;
  }

  async updateCodeStatusAndScanCount(
    codeId: string,
    status: string,
    scannedCount: number,
    lastScannedAt: Date
  ) {
    const [result] = await this.db
      .update(productUniqueCodes)
      .set({
        status,
        scannedCount,
        lastScannedAt,
        updatedAt: new Date(),
      })
      .where(eq(productUniqueCodes.id, codeId))
      .returning();
    return result;
  }

  async insertScanHistory(data: {
    codeId: string;
    scanMethod: string;
    ipAddress?: string;
    userAgent?: string;
    latitude?: string;
    longitude?: string;
  }) {
    const [result] = await this.db
      .insert(qrScanHistory)
      .values(data)
      .returning();
    return result;
  }

  async createJob(data: {
    productId?: string | null;
    productName?: string | null;
    quantity: number;
    createdBy?: string | null;
  }) {
    const [result] = await this.db
      .insert(qrGenerationJobs)
      .values(data)
      .returning();
    return result;
  }

  async getPendingJobs() {
    return await this.db
      .select()
      .from(qrGenerationJobs)
      .where(eq(qrGenerationJobs.status, "PENDING"));
  }

  async updateJobStatus(jobId: string, status: string, error?: string | null) {
    const [result] = await this.db
      .update(qrGenerationJobs)
      .set({
        status,
        error: error || null,
        updatedAt: new Date(),
      })
      .where(eq(qrGenerationJobs.id, jobId))
      .returning();
    return result;
  }

  async updateJobPdfDetails(jobId: string, pdfFileName: string, pdfPath: string, status: string = "COMPLETED") {
    const [result] = await this.db
      .update(qrGenerationJobs)
      .set({
        status,
        pdfFileName,
        pdfPath,
        updatedAt: new Date(),
      })
      .where(eq(qrGenerationJobs.id, jobId))
      .returning();
    return result;
  }

  async getJobById(jobId: string) {
    const result = await this.db
      .select()
      .from(qrGenerationJobs)
      .where(eq(qrGenerationJobs.id, jobId))
      .limit(1);
    return result[0] || null;
  }
}

export default new QrRepository();
