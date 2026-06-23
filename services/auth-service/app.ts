import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import { DatabaseConnection } from "./database/database-connection";
import { routers } from "./routes";
import { IRouter, MetaData } from "./types";
import errorHandler from "./middlewares/error-handler";
import loggerMiddleware from "./middlewares/logger";
import { RedisClient } from "./services";
import { setupSwagger } from "./configs/swagger";


class App {
  private app: Application;
  private db!: DatabaseConnection;
  private redisClient!: RedisClient;

  constructor() {
    this.app = express();
    this.loadEnvironmentVariables();
    this.connectToDatabase();
    this.initializeRedis();
    this.initializeFileService();
    this.corsConfig();
    this.logger();
    this.initializeMiddleware();
    this.temporaryApiLogs();
    this.initializeRateLimiter();
    this.setupRoutes();
    this.errorHandler();
    this.initializeSwagger();
  }

  private loadEnvironmentVariables(): void {
    dotenv.config();
  }

  private async connectToDatabase(): Promise<void> {
    this.db = DatabaseConnection.getInstance({
      connectionString: process.env.DATABASE_URL,
    });

    await this.db.connect();
  }

  private temporaryApiLogs(): void {
    this.app.use(loggerMiddleware.tempApiLogger());
  }

  private initializeMiddleware(): void {
    this.app.use(express.json({ limit: "1mb" }));
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      req.metaData = new MetaData(req);
      next();
    });
  }
  private initializeRateLimiter(): void {
    // let globalLimiter = RateLimiter.create({ max: 100 });
    // this.app.use(globalLimiter);
  }

  private initializeFileService(): void {
    // const config = {
    //   accessKey: AWS_ACCESS_KEY_ID,
    //   secrectKey: AWS_SECRET_ACCESS_KEY,
    //   bucketName: AWS_BUCKET_NAME,
    //   region: AWS_REGION,
    // };
    // FileMiddleware.initialize(config);
  }

  private async initializeRedis(): Promise<void> {
    this.redisClient = RedisClient.getInstance();
    await this.redisClient.initialize();
  }

  private setupRoutes(): void {
    routers.forEach((router: IRouter) => {
      this.app.use(router.path, router.router);
    });
  }

  private corsConfig() {
    this.app.use(
      cors({
        origin: "*",
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"], // Specify allowed HTTP methods
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

  private errorHandler() {
    this.app.use(errorHandler.errorHandleMiddleware);
  }

  private logger(): void {
    this.app.use(loggerMiddleware.apiLogger);
  }

  public listen(port: number): void {
    this.app.listen(port, () => {
      console.log(`\nZF Server is running on port number : ${port} 🚀🚀🚀\n`);
    });
  }

  private initializeSwagger(): void {
    setupSwagger(this.app);
  }
}

// Export the App class for use in other modules
export default App;
