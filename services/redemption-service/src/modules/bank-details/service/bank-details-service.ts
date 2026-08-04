import bankDetailsRepository, { BankDetailsRepository, IBankDetailsData } from "../repository/bank-details-repository";
import { CustomError } from "../../../types";

export class BankDetailsService {
  constructor(private repository: BankDetailsRepository = bankDetailsRepository) {}

  async getBankDetails(userId: string) {
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
      id: record.id,
      userId: record.userId,
      accountHolderName: record.accountHolderName,
      accountNumber: record.accountNumber,
      ifscCode: record.ifscCode,
      bankName: record.bankName,
      branch: record.branch || null,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  async saveBankDetails(data: IBankDetailsData) {
    if (!data.userId) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "User ID is required",
      });
    }

    if (!data.accountHolderName?.trim() || !data.accountNumber?.trim() || !data.ifscCode?.trim() || !data.bankName?.trim()) {
      throw new CustomError({
        statusCode: 400,
        responseCode: 400,
        responseMessage: "Account holder name, account number, IFSC code, and bank name are mandatory",
      });
    }

    const saved = await this.repository.upsertBankDetails({
      userId: data.userId,
      accountHolderName: data.accountHolderName.trim(),
      accountNumber: data.accountNumber.trim(),
      ifscCode: data.ifscCode.trim(),
      bankName: data.bankName.trim(),
      branch: data.branch ? data.branch.trim() : null,
    });

    return {
      id: saved.id,
      userId: saved.userId,
      accountHolderName: saved.accountHolderName,
      accountNumber: saved.accountNumber,
      ifscCode: saved.ifscCode,
      bankName: saved.bankName,
      branch: saved.branch || null,
      createdAt: saved.createdAt,
      updatedAt: saved.updatedAt,
    };
  }
}

export default new BankDetailsService();
