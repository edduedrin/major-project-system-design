import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types";
import { inventoryRepository, reportRepository, userRepository, skuRepository } from "../repositories";
import { customValidators } from "../utils/custom-validators";

class ReportController {
    customError!: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400,
        })
    }
    ticketHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // const payload = customValidators.raiseTicket(req.body, req?.file);
            // payload.fileUrl = await fileMiddleware.uploadFile(payload?.file, "ticket");
            const ticketHistory = await reportRepository.ticketHistory(req?.body, req.userDetails);
            return res.json({
                message: `success`,
                code: 200,
                data: ticketHistory
            })
        } catch (error) {
            next(error)
        }
    }

    scanHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const scanHistory = await inventoryRepository.scanHistory(req?.body, req?.userDetails);
            return res.json({
                message: `success`,
                code: 200,
                data: scanHistory
            })
        } catch (error) {
            next(error)
        }
    }

    referralHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.referralHistory(req.body);
            const data = await reportRepository.referralHistory(payload, req?.userDetails);
            return res.json({
                message: "success",
                code: 200,
                data
            })
        } catch (error) {
            next(error);
        }
    }

    applicationLogin = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.applicationLogin(req.body);
            const data = await reportRepository.applicationLogin(payload, req?.userDetails);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    registeredUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.registeredUsers(req.body);
            const data = await reportRepository.registeredUsers(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    qrTransaction = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.qrTransaction(req.body);
            const data = await reportRepository.qrTransaction(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    adminReferalHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.adminReferalHistory(req.body);
            const data = await reportRepository.adminReferalHistory(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    // otpReport = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const {
    //             page = 1,
    //             limit = 10,

    //             otpId,
    //             userId,
    //             isVerified,
    //             otpType,
    //             search,
    //             dateFrom,
    //             dateTo
    //         } = req.query;

    //         const filters: any = {};

    //         if (otpId) filters.otpId = Number(otpId);
    //         if (userId) filters.userId = Number(userId);
    //         if (otpType) filters.otpType = String(otpType);

    //         if (isVerified !== undefined)
    //             filters.isVerified = isVerified === "true";

    //         if (search) filters.search = String(search);

    //         if (dateFrom) filters.dateFrom = String(dateFrom);
    //         if (dateTo) filters.dateTo = String(dateTo);

    //         const result = await userRepository.getOtpReport(
    //             Number(page),
    //             Number(limit),
    //             filters
    //         );

    //         return res.status(200).json({
    //             message: "OTP report fetched successfully",
    //             ...result
    //         });

    //     } catch (error) {
    //         next(error);
    //     }
    // };

    otpReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                page = 1,
                limit = 10,

                // OTP Filters
                //otpId,
                userId,
                isVerified,
                otpType,

                // User Filters
                userRole,
                blockStatus,

                // Address Filters
                currentCity,
                currentDistrict,
                currentPincode,
                currentState,
                zoneId,
                branchId,

                // Search + Date
                search,
                dateFrom,
                dateTo,
            } = req.query;

            // ---------------------------------------------
            // Build Filters Object
            // ---------------------------------------------
            const filters: any = {};

            // OTP Filters
            //if (otpId) filters.otpId = Number(otpId);
            if (userId) filters.userId = Number(userId);
            if (otpType) filters.otpType = String(otpType);

            if (isVerified !== undefined)
                filters.isVerified = isVerified === "true";

            // User Filters
            if (userRole) filters.userRole = Number(userRole);
            if (blockStatus) filters.blockStatus = String(blockStatus);

            // Address Filters
            if (currentCity) filters.currentCity = String(currentCity);
            if (currentDistrict) filters.currentDistrict = String(currentDistrict);
            if (currentPincode) filters.currentPincode = Number(currentPincode);
            if (currentState) filters.currentState = String(currentState);
            if (zoneId) filters.zoneId = Number(zoneId);
            if (branchId) filters.branchId = Number(branchId);

            // Search + Date
            if (search) filters.search = String(search);
            if (dateFrom) filters.dateFrom = String(dateFrom);
            if (dateTo) filters.dateTo = String(dateTo);

            // ---------------------------------------------
            // Call Repository Function
            // ---------------------------------------------
            const result = await userRepository.getOtpReport(
                Number(page),
                Number(limit),
                filters
            );

            // ---------------------------------------------
            // Return Response
            // ---------------------------------------------
            return res.status(200).json({
                message: "OTP report fetched successfully",
                ...result
            });

        } catch (error) {
            next(error);
        }
    };

    bankDetailsReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.bankDetailsReport(req.body);
            const data = await reportRepository.bankDetailsReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    kycReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.kycReport(req.body);
            const data = await reportRepository.kycReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    productWiseReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.productWiseReport(req.body);
            const data = await reportRepository.productWiseReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    categoryReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.categoryReport(req.body);
            const data = await reportRepository.categoryReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    errorTransactionReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.errorTransactionReport(req.body);
            const data = await reportRepository.errorTransactionReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    notificationReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.notificationReport(req.body);
            const data = await reportRepository.notificationReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    blockedMemberReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.blockedMemberReport(req.body);
            const data = await reportRepository.blockedMemberReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    blockedMemberQrScanReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.blockedMemberQrScanReport(req.body);
            const data = await reportRepository.blockedMemberQrScanReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    anomalyTransactionsReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.anomalyTransactionsReport(req.body);
            const data = await reportRepository.anomalyTransactionsReport(payload);
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

    shockReplacementReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.shockReplacementReport(req.body);
            const data = await skuRepository.getSelectedShockReplacementSkus({
                skip: payload.skip,
                limit: payload.limit,
                userId: payload.userId || undefined
            });
            return res.json({
                message: "success",
                code: 200,
                data
            });
        } catch (error) {
            next(error);
        }
    }

}

export const reportController = new ReportController();