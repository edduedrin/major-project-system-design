import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as memberSchema from "./schemas/member-model";
import * as activitySchema from "./schemas/activity-log-model";

const connectionString = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/zf_pro";
const client = postgres(connectionString);

export const database = drizzle(client, {
  schema: { ...memberSchema, ...activitySchema }
});
