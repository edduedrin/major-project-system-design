import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schemas from './schema/schema';

export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  client: postgres.Sql;
  static db: ReturnType<typeof drizzle>;

  constructor(connectionString: string) {
    this.client = postgres(connectionString);
    DatabaseConnection.db = drizzle(this.client, { schema: schemas });
  }

  public static getInstance(connectionString: string): DatabaseConnection {
    if (!this.instance) {
      this.instance = new DatabaseConnection(connectionString);
    }
    return this.instance;
  }

  async connect() {
    try {
      await this.client`SELECT 1`;
      console.log("Database connected successfully ✅✅✅");
    } catch (error) {
      console.error("Database connection error: ❌❌❌ \n", error);
    }
  }
}
