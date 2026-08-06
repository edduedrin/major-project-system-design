import App from "./app";
import { DatabaseConnection } from "./database/database-connection";
import { drizzle } from "drizzle-orm/postgres-js";
import { connectRabbit } from "./services/rabbitmq/connection";
import { initializeConsumers } from "./consumers/consumer-manager";
import { config } from "./config";

export let database: ReturnType<typeof drizzle>;

async function bootstrap() {
  try {
    const app = new App();

    // Assign live drizzle instance
    database = DatabaseConnection.db;

    // Initialize RabbitMQ consumers & connection
    initializeConsumers();
    await connectRabbit();

    const PORT = config.port || 3005;
    const server = app.listen(PORT);

    // Graceful shutdown handling
    const gracefulShutdown = (signal: string) => {
      console.log(`[Server] Received ${signal}. Starting graceful shutdown...`);
      server.close(() => {
        console.log("[Server] HTTP server closed.");
        process.exit(0);
      });
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    console.log("Communication Service started successfully 🚀");
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

bootstrap();
