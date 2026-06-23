import { Application } from "express";
import swaggerJSDoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";

const options: any = {
  definition: {
    openapi: "3.0.0",
    info: { title: "ZF Backend API", version: "1.0.0" },
  },
  apis: [
    path.join(__dirname, "../routes/*.ts"),
    path.join(__dirname, "../controllers/*.ts")
  ],
};



const swaggerSpec = swaggerJSDoc(options);

console.log("Current working directory:", process.cwd());
console.log("Resolved routes path:", path.resolve("./src/routes/*.ts"));

export function setupSwagger(app: Application) {
  app.use("/api-docs", swaggerUi.serve as any, swaggerUi.setup(swaggerSpec));
}
