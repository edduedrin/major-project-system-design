import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

const migrationClient = postgres(process.env.DATABASE_URL as string, {
  max: 1,
});

async function syncDatabase() {
  await migrate(drizzle(migrationClient), {
    migrationsFolder: "./src/database/migrations",
  });
  await migrationClient.end();
  console.log("Done 😃✅✅✅");
}

syncDatabase();
