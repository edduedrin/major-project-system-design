import { DatabaseConnection } from "../../../database/database-connection";
import { usersAuth } from "../../../database/schema/schema";
import { eq } from "drizzle-orm";

export class AuthRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async createUser(data: {
    email?: string;
    mobile?: string;
    passwordHash: string;
    pinHash?: string;
    status?: string;
  }) {
    const [result] = await this.db
      .insert(usersAuth)
      .values({
        email: data.email || null,
        mobile: data.mobile || null,
        passwordHash: data.passwordHash,
        pinHash: data.pinHash || null,
        status: data.status || "PENDING",
      })
      .returning();
    return result;
  }

  async findUserByEmail(email: string) {
    const results = await this.db
      .select()
      .from(usersAuth)
      .where(eq(usersAuth.email, email))
      .limit(1);
    return results[0] || null;
  }

  async findUserByMobile(mobile: string) {
    const results = await this.db
      .select()
      .from(usersAuth)
      .where(eq(usersAuth.mobile, mobile))
      .limit(1);
    return results[0] || null;
  }

  async findUserById(id: string) {
    const results = await this.db
      .select()
      .from(usersAuth)
      .where(eq(usersAuth.id, id))
      .limit(1);
    return results[0] || null;
  }

  async updateUser(
    userId: string,
    data: Partial<{
      passwordHash: string;
      pinHash: string;
      status: string;
      emailVerified: boolean;
      mobileVerified: boolean;
      lastLoginAt: Date;
      updatedAt: Date;
    }>
  ) {
    const [result] = await this.db
      .update(usersAuth)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(usersAuth.id, userId))
      .returning();
    return result;
  }
}
export default new AuthRepository();
