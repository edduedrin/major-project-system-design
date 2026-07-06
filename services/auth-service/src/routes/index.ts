import { IRouter } from "../types";
import authRouter from "./auth-router";

export const routers: IRouter[] = [
  { path: "/auth", router: authRouter }
];
