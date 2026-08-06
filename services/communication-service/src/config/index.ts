import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3005", 10),
  nodeEnv: process.env.NODE_ENV || "development",
  databaseUrl: process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/communication_db",
  rabbit: {
    url: process.env.RABBIT_URL || "amqp://localhost:5672",
    exchange: process.env.RABBIT_EXCHANGE || "communication.exchange",
    queues: {
      push: "push.notification.queue",
      email: "email.notification.queue",
      retry: "communication.retry.queue",
      deadletter: "communication.deadletter.queue",
      sms: "sms.notification.queue",
      whatsapp: "whatsapp.notification.queue",
      inapp: "inapp.notification.queue",
    },
  },
  firebase: {
    projectId: process.env.FIREBASE_PROJECT_ID || "",
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || "",
    privateKey: (process.env.FIREBASE_PRIVATE_KEY || "").replace(/\\n/g, "\n"),
  },
  smtp: {
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "No Reply <noreply@example.com>",
  },
  retry: {
    maxCount: parseInt(process.env.RETRY_MAX_COUNT || "3", 10),
    delayMs: parseInt(process.env.RETRY_DELAY_MS || "5000", 10),
  },
  jwtSecret: process.env.JWT_SECRET || "supersecretjwtkey123!",
};
