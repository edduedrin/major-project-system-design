import { createClient, RedisClientType } from "redis";

export class RedisClient {
  private static instance: RedisClient | null = null;
  private client: RedisClientType | null = null;
  private isConnected = false;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isConnected) return;

    const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
    this.client = createClient({ url: redisUrl });

    this.client.on("error", (err) => console.error("Redis Client Error:", err));
    this.client.on("connect", () => console.log("Redis Client Connected ✅"));

    await this.client.connect();
    this.isConnected = true;
  }

  public getClient(): RedisClientType {
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client is not initialized.");
    }
    return this.client;
  }

  public async get(key: string): Promise<string | null> {
    if (!this.isConnected) return null;
    return await this.getClient().get(key);
  }

  public async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (!this.isConnected) return;
    if (ttlSeconds) {
      await this.getClient().set(key, value, { EX: ttlSeconds });
    } else {
      await this.getClient().set(key, value);
    }
  }

  public async del(key: string): Promise<void> {
    if (!this.isConnected) return;
    await this.getClient().del(key);
  }
}
