import { drizzle } from "drizzle-orm/node-postgres";
import App from "./app";
import { DatabaseConnection } from "./database/database-connection";
import { MetaData, UserDetails, UserSearch } from "./types";

import { connectRabbit, registerConsumers, waitForRabbit } from "./services/rabbitMqNew/connection";
import { setupInfrastructure } from "./services/rabbitMqNew/setUp";
import { startAllConsumers } from "./services/rabbitMqNew/consumers/startConsumers";
// import notificationTask from "./cron_jobs/notification-cron";
// import randomStringTask, { generateRandomStrings } from "./cron_jobs/random_string_cron";

declare module "express-serve-static-core" {
  interface Request {
    user: UserSearch;
    userDetails: UserDetails;
    metaData: MetaData;
  }
}

// Declared here so other modules can import it.
// Assigned inside bootstrap() AFTER new App() calls DatabaseConnection.getInstance().
export let database: ReturnType<typeof drizzle>;

async function bootstrap() {
  try {
    // 1️⃣ Connect Rabbit


    // Connect to RabbitMQ (will auto-start consumers)
    await connectRabbit();

    // 👇 WAIT UNTIL RABBIT IS READY
    await waitForRabbit();

    // 2️⃣ Setup Exchanges + Queues
    await setupInfrastructure();

    // 3️⃣ Start Consumers
    await startAllConsumers();

    //await connectRabbit();
    // Register consumer bootstrap
    registerConsumers(startAllConsumers);
    // 4️⃣ Start HTTP server
    // new App() synchronously calls DatabaseConnection.getInstance() which sets DatabaseConnection.db
    const app = new App();

    // Assign the live drizzle instance — all controllers access this at request time, never at import time
    database = DatabaseConnection.db;

    app.listen(5005);

    // Start the rescue cron — re-queues PENDING notifications stuck due to
    // a crash between DB insert and RabbitMQ publish in the controller.
    // notificationTask.start();
    console.log("Notification rescue cron started 🕐");

    // randomStringTask.start();
    // console.log("Random string cron started 🎲");

    // Trigger an immediate run now that the DB is ready
    // generateRandomStrings().catch((err) =>
    //   console.error("Error in initial generateRandomStrings:", err)
    // );

    console.log("Application started successfully 🚀");
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

bootstrap();
