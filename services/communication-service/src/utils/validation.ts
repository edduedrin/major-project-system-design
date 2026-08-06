import { CustomError } from "../types";

export class ValidationUtils {
  static validateEmail(email: string): boolean {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  static validateRequired(data: Record<string, any>, fields: string[]): void {
    const missing = fields.filter((f) => data[f] === undefined || data[f] === null || data[f] === "");
    if (missing.length > 0) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: `Missing required fields: ${missing.join(", ")}`,
      });
    }
  }
}
