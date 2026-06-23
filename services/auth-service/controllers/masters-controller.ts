import { NextFunction, Request, Response } from "express";
import { CustomError } from "../types";
import { inventoryRepository, kycRepository, mastersRepository, userRepository } from "../repositories";
import { redemptionRepository } from "../repositories/redemption-repository";
import { ticketStatusEnum } from "../schemas/ticket-model";
import { customValidators } from "../utils/custom-validators";
import { fileMiddleware } from "../middlewares/file-middleware";
import { removeUndefinedProperties } from "../utils/random";
type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
class MastersController {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400
        })
    }

    getTicketList = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const ticketList = await mastersRepository.getTicketList();
            return res.json({
                message: "success",
                code: 200,
                data: ticketList
            })
        } catch (error) {
            next(error);
        }
    }

    getScannedPoints = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { financialYear } = req.query;

            const filters: any = {};

            // Optional Financial Year filter
            if (financialYear) {
                filters.financialYear = String(financialYear);
            }

            // Call DB function
            const result = await inventoryRepository.totalScannedPoints(filters);

            return res.status(200).json({
                success: true,
                message: "Total scanned points fetched successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    };

    getRedeemedPoints = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { financialYear } = req.query;

            const filters: any = {};

            // Optional Financial Year filter
            if (financialYear) {
                filters.financialYear = String(financialYear);
            }

            // Call DB function
            const result = await redemptionRepository.totalRedeemedPoints(filters);

            return res.status(200).json({
                success: true,
                message: "Total redeemed points fetched successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    getTotalScans = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { financialYear } = req.query;

            const filters: any = {};

            // Optional Financial Year filter
            if (financialYear) {
                filters.financialYear = String(financialYear);
            }

            // Call DB function
            const result = await inventoryRepository.totalScanCount(filters);

            return res.status(200).json({
                success: true,
                message: "Total scans fetched successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    };

    getKycDataPoints = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { financialYear } = req.query;

            const filters: any = {};

            // Optional Financial Year filter
            if (financialYear) {
                filters.financialYear = String(financialYear);
            }

            // Call DB function
            const result = await kycRepository.getKycStatusSummary(filters);

            return res.status(200).json({
                success: true,
                message: "Total scans fetched successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    };

    getUsersRegisteredGraphData = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Extract filters
            const range = req.query.range as "last7" | "last30" | "3months" | "fy";
            const financialYear = req.query.financialYear as string | undefined;

            // Basic validation
            if (!range) {
                return res.status(400).json({
                    message: "Query param 'range' is required",
                    validRanges: ["last7", "last30", "3months", "fy"]
                });
            }

            if (range === "fy" && !financialYear) {
                return res.status(400).json({
                    message: "financialYear (e.g., 2024-2025) is required when range = 'fy'"
                });
            }

            // Call repository function
            const result = await userRepository.getUserRegistrationStats({
                range,
                financialYear
            });

            return res.status(200).json({
                success: true,
                data: result
            });

        } catch (error) {
            next(error);
        }
    };

    getPointsTransactionDataGraph = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { range, financialYear } = req.query;

            if (!range) {
                return res.status(400).json({
                    message: "range is required (last7 | last30 | 3months | fy)"
                });
            }

            // Prepare filters
            const filters = {
                range: range as "last7" | "last30" | "3months" | "fy",
                financialYear: financialYear as string | undefined
            };

            // Call repository functions
            const scannedStats = await inventoryRepository.getScannedPointsStats(filters);
            const redeemedStats = await redemptionRepository.getRedeemedPointsStats(filters);
            // Validate: labels must match (same range)
            if (scannedStats.labels.join(",") !== redeemedStats.labels.join(",")) {
                return res.status(500).json({
                    message: "Graph label mismatch between scanned and redeemed points."
                });
            }

            return res.status(200).json({
                message: "Success",
                data: {
                    labels: scannedStats.labels,
                    scannedPoints: scannedStats.values,
                    redeemedPoints: redeemedStats.values
                }
            });

        } catch (error) {
            next(error);
        }
    };

    getRecentActivity = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let limit = Number(req.query.count || 10);
            if (limit > 50) limit = 50;

            const scans = await inventoryRepository.getRecentScans(limit);
            const redemptions = await redemptionRepository.getRecentRedemptions(limit);

            const merged = [...scans, ...redemptions]
                .sort((a, b) => {
                    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
                    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
                    return dateB - dateA; // latest first
                })
                .slice(0, limit);


            return res.json({
                count: merged.length,
                data: merged
            });
        } catch (error) {
            next(error);
        }
    };

    getTopPerformers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Read "count" query param
            let limit = Number(req.query.count || 10);

            // Enforce max limit = 50
            if (limit > 50) limit = 50;

            // Call DB repository function
            const topUsers = await inventoryRepository.getTopPerformers(limit);

            return res.json({
                count: topUsers.length,
                data: topUsers
            });

        } catch (error) {
            next(error);
        }
    };

    getTotalQRCodes = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const totalQRCodes = await inventoryRepository.getTotalInventoryCount();
            return res.json({
                message: "success",
                code: 200,
                data: totalQRCodes
            })
        } catch (error) {
            next(error);
        }
    }

    getTicketCount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categoryId = Number(req.params.categoryId);
            const ticketCount = await mastersRepository.getTicketCount(categoryId);
            return res.json({
                message: "success",
                code: 200,
                data: ticketCount
            })
        } catch (error) {
            next(error);
        }
    }

    getTicketCountByStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const status = req.params.status as TicketStatus | undefined;

            const count = await mastersRepository.getTicketCountByStatus(status);

            return res.json({
                message: "success",
                code: 200,
                data: { status: status ?? "All", count }
            });
        } catch (error) {
            next(error);
        }
    };


    getTicketCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categories = await mastersRepository.getTicketCategories();
            return res.json({
                message: "success",
                code: 200,
                data: categories
            })
        } catch (error) {
            next(error);
        }
    }

    getTicketStatuses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            //const statuses = ticketStatusEnum.enumValues; // ["Pending", "Resolved", "Escalated"]
            const statuses = ticketStatusEnum.enumValues?.filter(ele => ele != "Escalated");
            return res.json({
                message: "success",
                code: 200,
                data: statuses
            });
        } catch (error) {
            next(error);
        }
    };

    getFAQs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const faqs = await mastersRepository.getFAQs();
            return res.json({
                message: "success",
                code: 200,
                data: faqs
            })
        } catch (error) {
            next(error);
        }
    }

    createFAQ = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { faqQuestion, faqAnswer } = customValidators.validateFAQ(req.body);

            const faq = await mastersRepository.createFAQ({ faqQuestion, faqAnswer, createdBy: req.user?.userId });
            return res.json({
                message: "FAQ created successfully",
                code: 201,
                data: faq
            })
        } catch (error) {
            next(error);
        }
    }

    deleteFAQ = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const faqId = customValidators.validateFaqId(req?.params?.id);
            const faq = await mastersRepository.deleteFAQ(faqId);
            return res.json({
                message: "FAQ deleted successfully",
                code: 200,
                data: faq
            })
        } catch (error) {
            next(error);
        }
    }

    getAssets = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assets = await mastersRepository.getAssets();
            return res.json({
                message: "Assets fetched successfully",
                code: 200,
                data: assets
            });
        } catch (error) {
            next(error);
        }
    }

    upsertAsset = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = { ...req.body };
            body.staticAssetUrl = body.staticAssetUrl;

            const data = customValidators.validateAsset(body);
            const assetId = req.params.id ? customValidators.validateAssetId(req.params.id) : null;

            if (!data) {
                return res.json({
                    message: "No data provided or asset is inactive",
                    code: 400
                });
            }

            if (req.file) {
                data.assetUrl = await fileMiddleware.uploadFile(req.file, "asset");
            }

            if (!assetId && !data.assetUrl && !data.staticAssetUrl) {
                throw new CustomError({
                    responseMessage: "Asset file or static URL is required for new asset",
                    responseCode: 400
                });
            }

            let result;
            const finalData = removeUndefinedProperties(data);
            if (assetId) {
                result = await mastersRepository.updateAsset(assetId, finalData);
            } else {
                result = await mastersRepository.createAsset(finalData);
            }

            return res.json({
                message: `Asset ${assetId ? "updated" : "created"} successfully`,
                code: 200,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    deleteAsset = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const assetId = customValidators.validateAssetId(req.params.id);
            await mastersRepository.deleteAsset(assetId);
            return res.json({
                message: "Asset deleted successfully",
                code: 200
            });
        } catch (error) {
            next(error);
        }
    }
}

export const masterController = new MastersController;