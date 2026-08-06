import dotenv from "dotenv";
import postgres from "postgres";

dotenv.config();

async function syncDb() {
  const dbUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/communication_db";
  console.log(`Syncing database with schema at ${dbUrl}...`);
  const sql = postgres(dbUrl);

  try {
    await sql`
      CREATE TABLE IF NOT EXISTS queue_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        event_id VARCHAR(255),
        queue_name VARCHAR(255),
        exchange_name VARCHAR(255),
        routing_key VARCHAR(255),
        notification_type VARCHAR(50),
        payload JSONB,
        status VARCHAR(50) NOT NULL DEFAULT 'Queued',
        retry_count INTEGER NOT NULL DEFAULT 0,
        error_message TEXT,
        started_at TIMESTAMP,
        completed_at TIMESTAMP,
        processing_time INTEGER,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS notification_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        recipient_id VARCHAR(255),
        notification_type VARCHAR(50) NOT NULL,
        provider VARCHAR(50),
        title VARCHAR(255),
        subject VARCHAR(255),
        message TEXT,
        payload JSONB,
        status VARCHAR(50) NOT NULL,
        provider_message_id VARCHAR(255),
        error_message TEXT,
        sent_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS email_templates (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        template_name VARCHAR(100) UNIQUE NOT NULL,
        subject VARCHAR(255) NOT NULL,
        html_body TEXT NOT NULL,
        text_body TEXT,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS device_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) NOT NULL,
        device_token TEXT UNIQUE NOT NULL,
        platform VARCHAR(50) NOT NULL DEFAULT 'android',
        app_version VARCHAR(50),
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_used_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Database tables synced successfully ✅");
  } catch (error) {
    console.error("Database sync failed ❌", error);
  } finally {
    await sql.end();
  }
}

syncDb();
