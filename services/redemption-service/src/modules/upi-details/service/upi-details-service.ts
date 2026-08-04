import upiDetailsRepository, { UpiDetailsRepository, IUpiDetailsData } from "../repository/upi-details-repository";
import { CustomError } from "../../../types";

export class UpiDetailsService {
  private upiRegex = /^[a-zA-Z0-9.\-_]{2,256}@[a-zA-Z]{2,64}$/;

  constructor(private repository: UpiDetailsRepository = upiDetailsRepository) {}

  async getUpiDetails(userId: string) {
    if (!userId) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "User ID is required",
      });
    }

    const record = await this.repository.findByUserId(userId);
    if (!record) {
      return null;
    }

    return {
      upiId: record.upiId,
    };
  }

  async saveUpiDetails(data: IUpiDetailsData) {
    if (!data.userId) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "User ID is required",
      });
    }

    if (!data.upiId || typeof data.upiId !== "string" || !data.upiId.trim()) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "UPI ID is required",
      });
    }

    const trimmedUpi = data.upiId.trim();
    if (!this.upiRegex.test(trimmedUpi)) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Invalid UPI ID format. Standard format is username@bank",
      });
    }

    const saved = await this.repository.upsertUpiDetails({
      userId: data.userId,
      upiId: trimmedUpi,
    });

    return {
      upiId: saved.upiId,
    };
  }
}

export default new UpiDetailsService();
