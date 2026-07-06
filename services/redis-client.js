"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisClient = void 0;
const redis_1 = require("redis");
class RedisClient {
    constructor() {
        this.redisClientInstance = (0, redis_1.createClient)({
            socket: {
                host: process.env.REDIS_HOST,
                port: 6379,
            },
        });
    }
    static getInstance() {
        if (!RedisClient.instance) {
            RedisClient.instance = new RedisClient();
        }
        return RedisClient.instance;
    }
    getClient() {
        if (!this.redisClientInstance.isReady) {
            RedisClient.getInstance().initialize();
        }
        return this.redisClientInstance;
    }
    async initialize() {
        this.redisClientInstance.on("error", (err) => {
            console.error("Could not establish a connection with Redis ❌❌❌", err);
        });
        if (!this.redisClientInstance.isOpen) {
            await this.redisClientInstance.connect();
            console.log("Redis connected successfully ✅✅✅\n");
        }
    }
    async setKey(userId, refreshToken) {
        await this.redisClientInstance.set(`${userId}`, refreshToken);
        await this.setExpiry(userId);
    }
    async setKeyString(userId, refreshToken) {
        await this.redisClientInstance.set(userId, refreshToken);
        await this.setExpiryString(userId);
    }
    async getValue(userId) {
        return await this.redisClientInstance.get(`${userId}`);
    }
    async getValueString(userId) {
        return await this.redisClientInstance.get(userId);
    }
    async deleteKey(userId) {
        await this.redisClientInstance.del(`${userId}`);
    }
    async deleteKeyString(userId) {
        await this.redisClientInstance.del(userId);
    }
    isLive() {
        return this.redisClientInstance.isReady;
    }
    async setExpiry(userId) {
        await this.redisClientInstance.expire(`${userId}`, 30 * 24 * 60 * 60);
    }
    async setExpiryString(userId) {
        await this.redisClientInstance.expire(userId, 30 * 24 * 60 * 60);
    }
}
exports.RedisClient = RedisClient;
