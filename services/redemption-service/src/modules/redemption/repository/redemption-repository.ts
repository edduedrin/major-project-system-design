import { DatabaseConnection } from "../../../database/database-connection";
import { redemptionRequests } from "../../../database/schema/schema";
import { eq, and, sql } from "drizzle-orm";

export interface ICreateRedemptionRequestData {
  userId: string;
  redemptionType: "BANK" | "UPI";
  walletPoints: number;
  amount: number | string;
  bankAccountSnapshot?: any | null;
  upiSnapshot?: string | null;
  status?: string;
}

export class RedemptionRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async createRedemptionRequest(data: ICreateRedemptionRequestData) {
    const [inserted] = await this.db
      .insert(redemptionRequests)
      .values({
        userId: data.userId,
        redemptionType: data.redemptionType,
        walletPoints: data.walletPoints,
        amount: String(data.amount),
        status: data.status || "PENDING",
        bankAccountSnapshot: data.bankAccountSnapshot ?? null,
        upiSnapshot: data.upiSnapshot ?? null,
      })
      .returning();

    return inserted;
  }

  async getRedemptions(filters: { userId?: string; status?: string }, limit: number = 10, offset: number = 0) {
    let query = this.db.select().from(redemptionRequests);
    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(redemptionRequests.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(redemptionRequests.status, filters.status));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.limit(limit).offset(offset);
  }

  async getTotalCount(filters: { userId?: string; status?: string }): Promise<number> {
    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(redemptionRequests.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(redemptionRequests.status, filters.status));
    }

    let query = this.db.select({ count: sql<number>`count(*)` }).from(redemptionRequests);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async getRedemptionById(id: string) {
    const result = await this.db
      .select()
      .from(redemptionRequests)
      .where(eq(redemptionRequests.id, id))
      .limit(1);

    return result[0] || null;
  }

  async updateStatus(id: string, status: string) {
    const [updated] = await this.db
      .update(redemptionRequests)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(redemptionRequests.id, id))
      .returning();

    return updated || null;
  }
}

export default new RedemptionRepository();
