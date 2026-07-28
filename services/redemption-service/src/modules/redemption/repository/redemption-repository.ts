import { DatabaseConnection } from "../../../database/database-connection";
import { redemptions, redemptionItems, redemptionHistory } from "../../../database/schema/schema";
import { eq, and, sql } from "drizzle-orm";

export class RedemptionRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async createRedemption(data: {
    userId: string;
    redemptionCode: string;
    totalPoints: number;
    remarks?: string;
    items: { productId: string; productName?: string; pointsPerUnit: number; quantity: number }[];
  }) {
    return await this.db.transaction(async (tx) => {
      const [newRedemption] = await tx
        .insert(redemptions)
        .values({
          userId: data.userId,
          redemptionCode: data.redemptionCode,
          totalPoints: data.totalPoints,
          remarks: data.remarks,
          status: "PENDING",
        })
        .returning();

      if (data.items && data.items.length > 0) {
        const itemValues = data.items.map((item) => ({
          redemptionId: newRedemption.id,
          productId: item.productId,
          productName: item.productName,
          pointsPerUnit: item.pointsPerUnit,
          quantity: item.quantity,
        }));
        await tx.insert(redemptionItems).values(itemValues);
      }

      await tx.insert(redemptionHistory).values({
        redemptionId: newRedemption.id,
        previousStatus: null,
        newStatus: "PENDING",
        comment: "Redemption created",
      });

      return newRedemption;
    });
  }

  async getRedemptions(filters: { userId?: string; status?: string }, limit: number, offset: number) {
    let query = this.db.select().from(redemptions);
    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(redemptions.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(redemptions.status, filters.status));
    }
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    return await query.limit(limit).offset(offset);
  }

  async getTotalCount(filters: { userId?: string; status?: string }): Promise<number> {
    const conditions = [];
    if (filters.userId) {
      conditions.push(eq(redemptions.userId, filters.userId));
    }
    if (filters.status) {
      conditions.push(eq(redemptions.status, filters.status));
    }

    let query = this.db.select({ count: sql<number>`count(*)` }).from(redemptions);
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    return Number(result[0]?.count || 0);
  }

  async getRedemptionById(id: string) {
    const result = await this.db
      .select()
      .from(redemptions)
      .where(eq(redemptions.id, id))
      .limit(1);
    return result[0] || null;
  }

  async getRedemptionByCode(code: string) {
    const result = await this.db
      .select()
      .from(redemptions)
      .where(eq(redemptions.redemptionCode, code))
      .limit(1);
    return result[0] || null;
  }

  async updateRedemptionStatus(id: string, status: string, changedBy?: string, comment?: string) {
    const existing = await this.getRedemptionById(id);
    if (!existing) return null;

    const [updated] = await this.db
      .update(redemptions)
      .set({
        status,
        updatedAt: new Date(),
      })
      .where(eq(redemptions.id, id))
      .returning();

    await this.db.insert(redemptionHistory).values({
      redemptionId: id,
      previousStatus: existing.status,
      newStatus: status,
      changedBy: changedBy || null,
      comment: comment || null,
    });

    return updated;
  }
}

export default new RedemptionRepository();
