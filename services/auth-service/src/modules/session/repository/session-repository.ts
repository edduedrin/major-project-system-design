import { DatabaseConnection } from "../../../database/database-connection";
import { userSessions } from "../../../database/schema/schema";
import { eq, and } from "drizzle-orm";

export class SessionRepository {
  private get db() {
    return DatabaseConnection.db;
  }

  async createSession(data: {
    userId: string;
    refreshToken: string;
    deviceId?: string;
    deviceType?: string;
    fcmToken?: string;
    ipAddress?: string;
    expiresAt: Date;
  }) {
    const [result] = await this.db
      .insert(userSessions)
      .values({
        userId: data.userId,
        refreshToken: data.refreshToken,
        deviceId: data.deviceId || null,
        deviceType: data.deviceType || null,
        fcmToken: data.fcmToken || null,
        ipAddress: data.ipAddress || null,
        expiresAt: data.expiresAt,
      })
      .returning();
    return result;
  }

  async deleteSession(userId: string, refreshToken: string) {
    const [result] = await this.db
      .delete(userSessions)
      .where(
        and(
          eq(userSessions.userId, userId),
          eq(userSessions.refreshToken, refreshToken)
        )
      )
      .returning();
    return result;
  }
}
export default new SessionRepository();
