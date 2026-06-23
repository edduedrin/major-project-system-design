import { boolean, integer, pgTable, serial, timestamp, varchar } from "drizzle-orm/pg-core";
import { stat } from "fs";

export const RandomKeysModel = pgTable("tbl_random_keys", {
    randomKeyId: serial("random_key_id").primaryKey(),
    randomKey: varchar("random_key", { length: 255 }).notNull().unique(),
    status: boolean("status").notNull().default(false),
    createdAt: timestamp("created_at").defaultNow().notNull(),
});