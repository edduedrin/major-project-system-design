import { RedisClientType, createClient } from "redis";

export class RedisClient {
  private static instance: RedisClient;
  private redisClientInstance: RedisClientType;

  private constructor() {
    this.redisClientInstance = createClient({
      socket: {
        host: process.env.REDIS_HOST,
        port: 6379,
      },
    });
  }

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public getClient(): RedisClientType {
    if (!this.redisClientInstance.isReady) {
      RedisClient.getInstance().initialize()
    }
    return this.redisClientInstance;
  }

  public async initialize(): Promise<void> {
    this.redisClientInstance.on("error", (err) => {
      console.error("Could not establish a connection with Redis ❌❌❌", err);
    });

    if (!this.redisClientInstance.isOpen) {
      await this.redisClientInstance.connect();
      console.log("Redis connected successfully ✅✅✅\n");
    }
  }

  async setKey(userId: number, refreshToken: string): Promise<void> {
    await this.redisClientInstance.set(`${userId}`, refreshToken);
    await this.setExpiry(userId);
  }

  async setKeyString(userId: string, refreshToken: string): Promise<void> {
    await this.redisClientInstance.set(userId, refreshToken);
    await this.setExpiryString(userId);
  }

  async getValue(userId: number): Promise<string | null> {
    return await this.redisClientInstance.get(`${userId}`);
  }

  async getValueString(userId: string): Promise<string | null> {
    return await this.redisClientInstance.get(userId);
  }

  async deleteKey(userId: number) {
    await this.redisClientInstance.del(`${userId}`);
  }

  async deleteKeyString(userId: string) {
    await this.redisClientInstance.del(userId);
  }

  isLive(): boolean {
    return this.redisClientInstance.isReady;
  }

  private async setExpiry(userId: number): Promise<void> {
    await this.redisClientInstance.expire(`${userId}`, 30 * 24 * 60 * 60);
  }
  private async setExpiryString(userId: string): Promise<void> {
    await this.redisClientInstance.expire(userId, 30 * 24 * 60 * 60);
  }
}
