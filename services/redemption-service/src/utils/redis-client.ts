import { RedisClientType, createClient } from "redis";

export class RedisClient {
  private static instance: RedisClient;
  private redisClientInstance: RedisClientType;

  private constructor() {
    this.redisClientInstance = createClient({
      socket: {
        host: process.env.REDIS_HOST || "localhost",
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
      RedisClient.getInstance().initialize().catch((err) => {
        console.error("Failed to initialize Redis client on getClient:", err);
      });
    }
    return this.redisClientInstance;
  }

  public async initialize(): Promise<void> {
    this.redisClientInstance.on("error", (err: any) => {
      console.error("Could not establish a connection with Redis ❌❌❌", err);
    });

    if (!this.redisClientInstance.isOpen) {
      await this.redisClientInstance.connect();
      console.log("Redis connected successfully ✅✅✅\n");
    }
  }

  async setKeyString(key: string, value: string, expirySeconds: number = 30 * 24 * 60 * 60): Promise<void> {
    await this.redisClientInstance.set(key, value);
    await this.redisClientInstance.expire(key, expirySeconds);
  }

  async getValueString(key: string): Promise<string | null> {
    return await this.redisClientInstance.get(key);
  }

  async deleteKeyString(key: string) {
    await this.redisClientInstance.del(key);
  }

  isLive(): boolean {
    return this.redisClientInstance.isReady;
  }
}
