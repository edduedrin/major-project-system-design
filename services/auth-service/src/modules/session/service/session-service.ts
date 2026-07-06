import sessionRepository from "../repository/session-repository";
import { generateAccessToken, generateRefreshToken } from "../../../utils/jwt-helper";
import { RedisClient } from "../../../utils/redis-client";

export class SessionService {
  async createSession(
    userId: string,
    email?: string,
    mobile?: string,
    metaData?: {
      deviceId?: string;
      deviceType?: string;
      fcmToken?: string;
      ipAddress?: string;
    }
  ) {
    const accessToken = generateAccessToken(userId, email, mobile);
    const refreshToken = generateRefreshToken(userId);

    // Refresh token expiry is 30 days
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    // Create session in PostgreSQL
    await sessionRepository.createSession({
      userId,
      refreshToken,
      deviceId: metaData?.deviceId,
      deviceType: metaData?.deviceType,
      fcmToken: metaData?.fcmToken,
      ipAddress: metaData?.ipAddress,
      expiresAt,
    });

    // Create session in Redis
    try {
      const redisClient = RedisClient.getInstance();
      if (redisClient.isLive()) {
        await redisClient.setKeyString(userId, refreshToken);
      }
    } catch (error) {
      console.error("Failed to set session key in Redis:", error);
    }

    return {
      accessToken,
      refreshToken,
    };
  }

  async revokeSession(userId: string, refreshToken: string) {
    await sessionRepository.deleteSession(userId, refreshToken);

    try {
      const redisClient = RedisClient.getInstance();
      if (redisClient.isLive()) {
        await redisClient.deleteKeyString(userId);
      }
    } catch (error) {
      console.error("Failed to delete session key from Redis:", error);
    }
  }
}
export default new SessionService();
