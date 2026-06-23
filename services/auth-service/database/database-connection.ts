import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schemas from "../schemas";

export class DatabaseConnection {
  private static instance: DatabaseConnection | null = null;
  pool: Pool;
  static db: ReturnType<typeof drizzle>;
  constructor(private dbConfig: any) {
    this.pool = new Pool(this.dbConfig);
    DatabaseConnection.db = drizzle({ client: this.pool, schema: schemas });
  }

  public static getInstance(dbConfig: any): DatabaseConnection {
    if (!this.instance) {
      this.instance = new DatabaseConnection(dbConfig);
    }
    return this.instance;
  }

  async connect() {
    try {
      await this.pool.query("SELECT 1"); // Using this.pool.connect() is redundant, as the pool manages connections internally.
      console.log("Database connected successfully ✅✅✅");
    } catch (error) {
      console.error("Database connection error: ❌❌❌ \n", error);
    }
  }
}
