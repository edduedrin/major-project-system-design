import jwt from "jsonwebtoken";

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || "default_access_secret_123_abc";
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || "default_refresh_secret_123_abc";
const RESET_SECRET = process.env.JWT_RESET_SECRET || "default_reset_secret_123_abc";

export function generateAccessToken(
  userId: string,
  email?: string,
  mobile?: string
): string {
  return jwt.sign(
    { userId, email, mobile, type: "access" },
    ACCESS_SECRET,
    { expiresIn: "1d" }
  );
}

export function generateRefreshToken(userId: string): string {
  return jwt.sign({ userId, type: "refresh" }, REFRESH_SECRET, {
    expiresIn: "30d",
  });
}

export function generateResetToken(userId: string): string {
  return jwt.sign({ userId, type: "password_reset" }, RESET_SECRET, {
    expiresIn: "10m",
  });
}

export function verifyToken(token: string, secretType: "access" | "refresh" | "reset"): any {
  let secret = ACCESS_SECRET;
  if (secretType === "refresh") {
    secret = REFRESH_SECRET;
  } else if (secretType === "reset") {
    secret = RESET_SECRET;
  }
  return jwt.verify(token, secret);
}
