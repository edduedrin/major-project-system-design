import jwt from "jsonwebtoken";
import { AuthenticatedUser } from "../types";

const JWT_SECRET = process.env.JWT_SECRET || "supersecretjwtkey123!";

export class JwtHelper {
  static sign(payload: object, expiresIn: string | number = "1d"): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresIn as any });
  }

  static verify(token: string): AuthenticatedUser {
    return jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
  }
}
