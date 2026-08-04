import { BankDetailsService } from "../src/modules/bank-details/service/bank-details-service";
import { BankDetailsRepository } from "../src/modules/bank-details/repository/bank-details-repository";
import { CustomError } from "../src/types";

describe("BankDetailsService Unit Tests", () => {
  let mockRepository: jest.Mocked<BankDetailsRepository>;
  let bankDetailsService: BankDetailsService;

  beforeEach(() => {
    mockRepository = {
      findByUserId: jest.fn(),
      upsertBankDetails: jest.fn(),
    } as unknown as jest.Mocked<BankDetailsRepository>;

    bankDetailsService = new BankDetailsService(mockRepository);
  });

  describe("getBankDetails", () => {
    it("should return null if bank details do not exist for the user", async () => {
      mockRepository.findByUserId.mockResolvedValue(null);

      const result = await bankDetailsService.getBankDetails("user-123");

      expect(result).toBeNull();
      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-123");
    });

    it("should return formatted bank details if record exists", async () => {
      const mockRecord = {
        id: "bank-id-1",
        userId: "user-123",
        accountHolderName: "John Doe",
        accountNumber: "123456789012",
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
        branch: "Downtown",
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      mockRepository.findByUserId.mockResolvedValue(mockRecord);

      const result = await bankDetailsService.getBankDetails("user-123");

      expect(result).toEqual({
        id: "bank-id-1",
        userId: "user-123",
        accountHolderName: "John Doe",
        accountNumber: "123456789012",
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
        branch: "Downtown",
        createdAt: mockRecord.createdAt,
        updatedAt: mockRecord.updatedAt,
      });
    });

    it("should throw CustomError if userId is missing", async () => {
      await expect(bankDetailsService.getBankDetails("")).rejects.toThrow(CustomError);
    });
  });

  describe("saveBankDetails", () => {
    it("should successfully save/update bank details when valid mandatory fields are provided", async () => {
      const input = {
        userId: "user-123",
        accountHolderName: "John Doe",
        accountNumber: "123456789012",
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
        branch: "Main Branch",
      };

      const mockSaved = {
        id: "bank-id-1",
        ...input,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRepository.upsertBankDetails.mockResolvedValue(mockSaved);

      const result = await bankDetailsService.saveBankDetails(input);

      expect(result.accountHolderName).toBe("John Doe");
      expect(result.accountNumber).toBe("123456789012");
      expect(mockRepository.upsertBankDetails).toHaveBeenCalled();
    });

    it("should throw CustomError if mandatory bank fields are missing", async () => {
      const invalidInput = {
        userId: "user-123",
        accountHolderName: "",
        accountNumber: "123456789012",
        ifscCode: "HDFC0001234",
        bankName: "HDFC Bank",
      };

      await expect(bankDetailsService.saveBankDetails(invalidInput)).rejects.toThrow(CustomError);
    });
  });
});
