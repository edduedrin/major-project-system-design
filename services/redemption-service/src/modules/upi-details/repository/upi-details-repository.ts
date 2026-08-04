import { DatabaseConnection } from "../../../database/database-connection";
import { upiDetails } from "../../../database/schema/schema";
import { eq } from "drizzle-orm";

export interface IUpiDetailsData {
  userId: string;
  upiId: string;
}

export class UpiDetailsRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async findByUserId(userId: string): Promise<any> {
    const result = await this.db
      .select()
      .from(upiDetails)
      .where(eq(upiDetails.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async upsertUpiDetails(data: IUpiDetailsData): Promise<any> {
    const existing = await this.findByUserId(data.userId);

    if (existing) {
      const [updated] = await this.db
        .update(upiDetails)
        .set({
          upiId: data.upiId,
          updatedAt: new Date(),
        })
        .where(eq(upiDetails.userId, data.userId))
        .returning();

      return updated;
    } else {
      const [inserted] = await this.db
        .insert(upiDetails)
        .values({
          userId: data.userId,
          upiId: data.upiId,
        })
        .returning();

      return inserted;
    }
  }
}

export default new UpiDetailsRepository();
