import { DatabaseConnection } from "../../../database/database-connection";
import { userWallets } from "../../../database/schema/schema";
import { eq, sql } from "drizzle-orm";

export class WalletRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async findByUserId(userId: string) {
    const result = await this.db
      .select()
      .from(userWallets)
      .where(eq(userWallets.userId, userId))
      .limit(1);

    return result[0] || null;
  }

  async initializeWallet(userId: string, initialBalance: number = 0) {
    const [inserted] = await this.db
      .insert(userWallets)
      .values({
        userId,
        balance: initialBalance,
      })
      .onConflictDoNothing()
      .returning();

    if (!inserted) {
      return await this.findByUserId(userId);
    }
    return inserted;
  }

  async setBalance(userId: string, newBalance: number) {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return await this.initializeWallet(userId, newBalance);
    }

    const [updated] = await this.db
      .update(userWallets)
      .set({
        balance: newBalance,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    return updated;
  }

  async deductPoints(userId: string, pointsToDeduct: number) {
    const existing = await this.findByUserId(userId);
    if (!existing) {
      return null;
    }

    if (existing.balance < pointsToDeduct) {
      return null; // insufficient balance
    }

    const [updated] = await this.db
      .update(userWallets)
      .set({
        balance: sql`${userWallets.balance} - ${pointsToDeduct}`,
        updatedAt: new Date(),
      })
      .where(eq(userWallets.userId, userId))
      .returning();

    return updated;
  }
}

export default new WalletRepository();
