import { RedemptionService } from "../src/modules/redemption/service/redemption-service";
import { RedemptionRepository } from "../src/modules/redemption/repository/redemption-repository";
import { BankDetailsService } from "../src/modules/bank-details/service/bank-details-service";
import { UpiDetailsService } from "../src/modules/upi-details/service/upi-details-service";
import { WalletService } from "../src/modules/wallet/service/wallet-service";
import { CustomError } from "../src/types";

describe("RedemptionService Unit Tests", () => {
  let mockRedemptionRepo: jest.Mocked<RedemptionRepository>;
  let mockBankService: jest.Mocked<BankDetailsService>;
  let mockUpiService: jest.Mocked<UpiDetailsService>;
  let mockWalletService: jest.Mocked<WalletService>;
  let redemptionService: RedemptionService;

  beforeEach(() => {
    mockRedemptionRepo = {
      createRedemptionRequest: jest.fn(),
      getRedemptions: jest.fn(),
      getTotalCount: jest.fn(),
      getRedemptionById: jest.fn(),
      updateStatus: jest.fn(),
    } as unknown as jest.Mocked<RedemptionRepository>;

    mockBankService = {
      getBankDetails: jest.fn(),
      saveBankDetails: jest.fn(),
    } as unknown as jest.Mocked<BankDetailsService>;

    mockUpiService = {
      getUpiDetails: jest.fn(),
      saveUpiDetails: jest.fn(),
    } as unknown as jest.Mocked<UpiDetailsService>;

    mockWalletService = {
      getBalance: jest.fn(),
      ensureSufficientBalance: jest.fn(),
      deductPoints: jest.fn(),
      setBalance: jest.fn(),
    } as unknown as jest.Mocked<WalletService>;

    redemptionService = new RedemptionService(
      mockRedemptionRepo,
      mockBankService,
      mockUpiService,
      mockWalletService
    );
  });

  describe("createRedemptionRequest", () => {
    it("should throw CustomError if user has insufficient wallet balance", async () => {
      mockWalletService.ensureSufficientBalance.mockRejectedValue(
        new CustomError({ statusCode: 400, responseMessage: "Insufficient wallet balance" })
      );

      await expect(
        redemptionService.createRedemptionRequest({
          userId: "user-1",
          redemptionType: "BANK",
          points: 1000,
        })
      ).rejects.toThrow("Insufficient wallet balance");
    });

    it("should throw CustomError if BANK redemption is requested but no bank account configured", async () => {
      mockWalletService.ensureSufficientBalance.mockResolvedValue(1000);
      mockBankService.getBankDetails.mockResolvedValue(null);

      await expect(
        redemptionService.createRedemptionRequest({
          userId: "user-1",
          redemptionType: "BANK",
          points: 500,
        })
      ).rejects.toThrow("No valid bank account details found for this user");
    });

    it("should throw CustomError if UPI redemption is requested but no UPI ID configured", async () => {
      mockWalletService.ensureSufficientBalance.mockResolvedValue(1000);
      mockUpiService.getUpiDetails.mockResolvedValue(null);

      await expect(
        redemptionService.createRedemptionRequest({
          userId: "user-1",
          redemptionType: "UPI",
          points: 500,
        })
      ).rejects.toThrow("No valid UPI ID configured for this user");
    });

    it("should successfully process BANK redemption request, deduct wallet points, and store bank snapshot", async () => {
      const userId = "user-1";
      const points = 1000;

      mockWalletService.ensureSufficientBalance.mockResolvedValue(2000);
      mockBankService.getBankDetails.mockResolvedValue({
        id: "b-1",
        userId,
        accountHolderName: "Alice Smith",
        accountNumber: "987654321",
        ifscCode: "SBIN0004321",
        bankName: "State Bank of India",
        branch: "Central Branch",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const mockCreatedRecord = {
        id: "redemption-req-1",
        userId,
        redemptionType: "BANK",
        walletPoints: points,
        amount: "1000.00",
        status: "PENDING",
        bankAccountSnapshot: {
          accountHolderName: "Alice Smith",
          accountNumber: "987654321",
          ifscCode: "SBIN0004321",
          bankName: "State Bank of India",
          branch: "Central Branch",
        },
        upiSnapshot: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedemptionRepo.createRedemptionRequest.mockResolvedValue(mockCreatedRecord as any);

      const result = await redemptionService.createRedemptionRequest({
        userId,
        redemptionType: "BANK",
        points,
      });

      expect(mockWalletService.deductPoints).toHaveBeenCalledWith(userId, points);
      expect(mockRedemptionRepo.createRedemptionRequest).toHaveBeenCalledWith({
        userId,
        redemptionType: "BANK",
        walletPoints: points,
        amount: "1000.00",
        status: "PENDING",
        bankAccountSnapshot: {
          accountHolderName: "Alice Smith",
          accountNumber: "987654321",
          ifscCode: "SBIN0004321",
          bankName: "State Bank of India",
          branch: "Central Branch",
        },
        upiSnapshot: null,
      });
      expect(result.status).toBe("PENDING");
      expect((result.bankAccountSnapshot as any).accountNumber).toBe("987654321");
    });

    it("should successfully process UPI redemption request, deduct wallet points, and store upi snapshot", async () => {
      const userId = "user-2";
      const points = 500;

      mockWalletService.ensureSufficientBalance.mockResolvedValue(1000);
      mockUpiService.getUpiDetails.mockResolvedValue({
        upiId: "user2@upi",
      });

      const mockCreatedRecord = {
        id: "redemption-req-2",
        userId,
        redemptionType: "UPI",
        walletPoints: points,
        amount: "500.00",
        status: "PENDING",
        bankAccountSnapshot: null,
        upiSnapshot: "user2@upi",
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockRedemptionRepo.createRedemptionRequest.mockResolvedValue(mockCreatedRecord as any);

      const result = await redemptionService.createRedemptionRequest({
        userId,
        redemptionType: "UPI",
        points,
      });

      expect(mockWalletService.deductPoints).toHaveBeenCalledWith(userId, points);
      expect(result.status).toBe("PENDING");
      expect(result.upiSnapshot).toBe("user2@upi");
    });
  });

  describe("updateStatus", () => {
    it("should update status to APPROVED or PAID", async () => {
      mockRedemptionRepo.updateStatus.mockResolvedValue({
        id: "req-1",
        status: "PAID",
      } as any);

      const result = await redemptionService.updateStatus("req-1", "PAID");

      expect(result.status).toBe("PAID");
      expect(mockRedemptionRepo.updateStatus).toHaveBeenCalledWith("req-1", "PAID");
    });

    it("should throw CustomError for invalid status value", async () => {
      await expect(redemptionService.updateStatus("req-1", "INVALID_STATUS")).rejects.toThrow(CustomError);
    });
  });
});
