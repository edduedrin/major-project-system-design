import { UpiDetailsService } from "../src/modules/upi-details/service/upi-details-service";
import { UpiDetailsRepository } from "../src/modules/upi-details/repository/upi-details-repository";
import { CustomError } from "../src/types";

describe("UpiDetailsService Unit Tests", () => {
  let mockRepository: jest.Mocked<UpiDetailsRepository>;
  let upiDetailsService: UpiDetailsService;

  beforeEach(() => {
    mockRepository = {
      findByUserId: jest.fn(),
      upsertUpiDetails: jest.fn(),
    } as unknown as jest.Mocked<UpiDetailsRepository>;

    upiDetailsService = new UpiDetailsService(mockRepository);
  });

  describe("getUpiDetails", () => {
    it("should return null if UPI ID is not configured", async () => {
      mockRepository.findByUserId.mockResolvedValue(null);

      const result = await upiDetailsService.getUpiDetails("user-123");

      expect(result).toBeNull();
      expect(mockRepository.findByUserId).toHaveBeenCalledWith("user-123");
    });

    it("should return upiId object if UPI is configured", async () => {
      mockRepository.findByUserId.mockResolvedValue({
        id: "upi-id-1",
        userId: "user-123",
        upiId: "john@paytm",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await upiDetailsService.getUpiDetails("user-123");

      expect(result).toEqual({ upiId: "john@paytm" });
    });
  });

  describe("saveUpiDetails", () => {
    it("should save valid UPI ID successfully", async () => {
      mockRepository.upsertUpiDetails.mockResolvedValue({
        id: "upi-id-1",
        userId: "user-123",
        upiId: "john.doe@okicici",
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await upiDetailsService.saveUpiDetails({
        userId: "user-123",
        upiId: "john.doe@okicici",
      });

      expect(result).toEqual({ upiId: "john.doe@okicici" });
      expect(mockRepository.upsertUpiDetails).toHaveBeenCalledWith({
        userId: "user-123",
        upiId: "john.doe@okicici",
      });
    });

    it("should throw CustomError for invalid UPI ID format", async () => {
      await expect(
        upiDetailsService.saveUpiDetails({
          userId: "user-123",
          upiId: "invalid-upi-without-at",
        })
      ).rejects.toThrow(CustomError);
    });

    it("should throw CustomError if upiId is empty", async () => {
      await expect(
        upiDetailsService.saveUpiDetails({
          userId: "user-123",
          upiId: "",
        })
      ).rejects.toThrow(CustomError);
    });
  });
});
