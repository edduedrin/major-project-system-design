import { DatabaseConnection } from "../../../database/database-connection";
import { bankDetails } from "../../../database/schema/schema";
import { eq } from "drizzle-orm";

export interface IBankDetailsData {
  userId: string;
  accountHolderName: string;
  accountNumber: string;
  ifscCode: string;
  bankName: string;
  branch?: string | null;
}

export class BankDetailsRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async findByUserId(userId: string): Promise<any> {
    const result = await this.db
      .select()
      .from(bankDetails)
      .where(eq(bankDetails.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async upsertBankDetails(data: IBankDetailsData): Promise<any> {
    const existing = await this.findByUserId(data.userId);

    if (existing) {
      const [updated] = await this.db
        .update(bankDetails)
        .set({
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          bankName: data.bankName,
          branch: data.branch ?? null,
          updatedAt: new Date(),
        })
        .where(eq(bankDetails.userId, data.userId))
        .returning();

      return updated;
    } else {
      const [inserted] = await this.db
        .insert(bankDetails)
        .values({
          userId: data.userId,
          accountHolderName: data.accountHolderName,
          accountNumber: data.accountNumber,
          ifscCode: data.ifscCode,
          bankName: data.bankName,
          branch: data.branch ?? null,
        })
        .returning();

      return inserted;
    }
  }
}

export default new BankDetailsRepository();
