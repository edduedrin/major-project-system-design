import App from "./app";
import { DatabaseConnection } from "./database/database-connection";
import { drizzle } from "drizzle-orm/postgres-js";
import { connectRabbit, registerConsumers, waitForRabbit } from "./services/rabbitMq/connection";
import { setupInfrastructure } from "./services/rabbitMq/setUp";
import { startAllConsumers } from "./services/rabbitMq/consumers/startConsumers";

export let database: ReturnType<typeof drizzle>;

async function bootstrap() {
  try {
    // 1️⃣ Connect to RabbitMQ (will auto-start consumers)
    await connectRabbit();

    // 2️⃣ Wait until RabbitMQ is ready
    await waitForRabbit();

    // 3️⃣ Setup Exchanges + Queues
    await setupInfrastructure();

    // 4️⃣ Start Consumers
    await startAllConsumers();

    // 5️⃣ Register consumer bootstrap recovery
    registerConsumers(startAllConsumers);

    const app = new App();

    // Assign the live drizzle instance
    database = DatabaseConnection.db;

    const PORT = parseInt(process.env.PORT || "3003", 10);
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
