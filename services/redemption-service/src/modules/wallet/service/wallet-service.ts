import walletRepository, { WalletRepository } from "../repository/wallet-repository";
import { CustomError } from "../../../types";

export class WalletService {
  constructor(private repository: WalletRepository = walletRepository) {}

  async getBalance(userId: string): Promise<number> {
    if (!userId) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "User ID is required",
      });
    }

    const wallet = await this.repository.findByUserId(userId);
    return wallet ? wallet.balance : 0;
  }

  async ensureSufficientBalance(userId: string, requiredPoints: number): Promise<number> {
    const currentBalance = await this.getBalance(userId);
    if (currentBalance < requiredPoints) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: `Insufficient wallet balance. Available: ${currentBalance} points, Required: ${requiredPoints} points`,
      });
    }
    return currentBalance;
  }

  async deductPoints(userId: string, points: number) {
    await this.ensureSufficientBalance(userId, points);

    const updated = await this.repository.deductPoints(userId, points);
    if (!updated) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Failed to deduct wallet points due to insufficient balance or concurrent modification",
      });
    }

    return updated;
  }

  async setBalance(userId: string, points: number) {
    return await this.repository.setBalance(userId, points);
  }
}

export default new WalletService();
