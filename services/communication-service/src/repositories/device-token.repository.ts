import { database } from "../server";
import { deviceTokens } from "../database/schema/schema";
import { eq, and } from "drizzle-orm";
import { TokenRegistrationDto } from "../types";

export class DeviceTokenRepository {
  public async upsertToken(dto: TokenRegistrationDto) {
    const existing = await database
      .select()
      .from(deviceTokens)
      .where(eq(deviceTokens.deviceToken, dto.deviceToken));

    if (existing.length > 0) {
      const [updated] = await database
        .update(deviceTokens)
        .set({
          userId: dto.userId,
          platform: dto.platform,
          appVersion: dto.appVersion || existing[0].appVersion,
          isActive: true,
          lastUsedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(deviceTokens.id, existing[0].id))
        .returning();
      return updated;
    } else {
      const [created] = await database
        .insert(deviceTokens)
        .values({
          userId: dto.userId,
          deviceToken: dto.deviceToken,
          platform: dto.platform,
          appVersion: dto.appVersion,
          isActive: true,
          lastUsedAt: new Date(),
        })
        .returning();
      return created;
    }
  }

  public async findActiveTokensByUserId(userId: string) {
    return await database
      .select()
      .from(deviceTokens)
      .where(and(eq(deviceTokens.userId, userId), eq(deviceTokens.isActive, true)));
  }

  public async deactivateToken(deviceToken: string) {
    const [result] = await database
      .update(deviceTokens)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(deviceTokens.deviceToken, deviceToken))
      .returning();
    return result;
  }

  public async deactivateInvalidTokens(tokens: string[]) {
    if (!tokens || tokens.length === 0) return;
    for (const token of tokens) {
      await database
        .update(deviceTokens)
        .set({ isActive: false, updatedAt: new Date() })
        .where(eq(deviceTokens.deviceToken, token));
    }
  }
}
