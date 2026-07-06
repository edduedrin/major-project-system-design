import App from "./app";
import { DatabaseConnection } from "./database/database-connection";
import { drizzle } from "drizzle-orm/postgres-js";

export let database: ReturnType<typeof drizzle>;

async function bootstrap() {
  try {
    const app = new App();

    // Assign the live drizzle instance — all controllers access this at request time, never at import time
    database = DatabaseConnection.db;

    const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
    const server = app.listen(PORT);

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log('[Server] HTTP server closed.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    console.log("Application started successfully 🚀");
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

bootstrap();
