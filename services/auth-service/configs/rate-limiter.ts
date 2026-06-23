// src/utils/RateLimiter.ts
import rateLimit, { Options as RateLimitOptions } from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { RedisClient } from "../services";

export class RateLimiter {
    private static redisClient = RedisClient.getInstance().getClient();

    static create(options: Partial<RateLimitOptions> & { max: number }) {
        let store: any;

        if (RateLimiter.redisClient?.isOpen) {
            store = new RedisStore({
                sendCommand: (...args: string[]) =>
                    RateLimiter.redisClient
                        .sendCommand(args as any)
                        .then(res => res as any),
            });
        } else {
            console.warn("⚠ Redis not connected. Using in-memory rate limiter.");
        }

        return rateLimit({
            store,
            standardHeaders: true,
            legacyHeaders: false,
            message: {
                code: 429,
                message: "Too many requests, please try again later.",
                error: "Too many requests, please try again later."
            },
            ...options
        });
    }
}
