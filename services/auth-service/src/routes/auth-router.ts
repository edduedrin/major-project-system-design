import { Router } from "express";

const authRouter = Router();

authRouter.get("/", (req, res) => {
  res.json({ message: "Auth service routing working" });
});

export default authRouter;
