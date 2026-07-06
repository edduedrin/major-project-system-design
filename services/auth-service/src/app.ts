import express, { Application, Request, Response, NextFunction } from "express";
import cors from "cors";
import * as dotenv from "dotenv";
import { DatabaseConnection } from "./database/database-connection";
import { RedisClient } from "./utils/redis-client";
import { routers } from "./routes";
import { IRouter, MetaData } from "./types";
import errorHandler from "./middlewares/error-handler";
import loggerMiddleware from "./middlewares/logger";

class App {
  private app: Application;
  private db!: DatabaseConnection;
  private redisClient!: RedisClient;

  constructor() {
    this.app = express();
    this.loadEnvironmentVariables();
    this.connectToDatabase();
    this.initializeRedis();
    this.corsConfig();
    this.logger();
    this.initializeMiddleware();
    this.setupRoutes();
    this.errorHandler();
  }

  private loadEnvironmentVariables(): void {
    dotenv.config();
  }

  private async connectToDatabase(): Promise<void> {
    if (process.env.DATABASE_URL) {
      this.db = DatabaseConnection.getInstance(process.env.DATABASE_URL);
      await this.db.connect();
    } else {
      console.warn("DATABASE_URL not set. Database connection skipped.");
    }
  }

  private async initializeRedis(): Promise<void> {
    try {
      this.redisClient = RedisClient.getInstance();
      await this.redisClient.initialize();
    } catch (error) {
      console.error("Failed to initialize Redis client:", error);
    }
  }

  private corsConfig() {
    this.app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allowedHeaders: [
          "Content-Type",
          "Authorization",
          "X-Requested-With",
          "Accept",
          "x-client-uuid"
        ],
      })
    );
    this.app.options("*", cors());
  }

  private logger(): void {
    this.app.use(loggerMiddleware.apiLogger);
  }

  private initializeMiddleware(): void {
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.metaData = new MetaData(req);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get("/health", (req: Request, res: Response) => {
      res.status(200).json({
        status: "healthy",
        timestamp: new Date().toISOString(),
        service: "auth-service",
      });
    });

    routers.forEach((router: IRouter) => {
      this.app.use(router.path, router.router);
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: "Route not found" });
    });
  }

  private errorHandler() {
    this.app.use(errorHandler.errorHandleMiddleware);
  }

  public listen(port: number) {
    return this.app.listen(port, () => {
      console.log(`\nZF Server is running on port number : ${port} 🚀🚀🚀\n`);
    });
  }
}

export default App;
