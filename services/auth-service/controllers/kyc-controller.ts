import { NextFunction, Request, Response } from "express";
import { tenacioService } from "../services/tenacio-service";
import { CustomError, KYCFilesUpdate, TenacioITRComplianceData, UploadFiles } from "../types";
import { kycRepository, userRepository } from "../repositories";
import { fileMiddleware } from "../middlewares/file-middleware";
import { customValidators } from "../utils/custom-validators";
import { removeUndefinedProperties } from "../utils/random";
import { validPincode } from "../utils/regex";
import { KycRepository } from "../repositories/kyc-repository";
import { kycTenacioUrlSample } from "../utils/sample-response";

class KYCController {
    customError: CustomError
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400
        })
    }

    initiateDigilocker = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const tenacioData = await tenacioService.initiateDigilocker();

            if (!tenacioData.resData?.data || !tenacioData.resData?.data?.sessionToken || !tenacioData.resData?.data?.url) {
                this.customError.responseMessage = "Server down, please try again";
                throw this.customError;
            }
            await kycRepository.initiateDigilocker(req.userDetails, tenacioData.resData?.data)

            return res.json({
                message: "Success",
                code: 200,
                // data: kycTenacioUrlSample
                data: tenacioData?.resData?.data
            })
        } catch (error) {
            next(error);
        }
    }

    validateDigilockerSession = async (req: Request, res: Response, next: NextFunction) => {
        try {

            const getLastSession = await kycRepository.getLastSession(req.userDetails);
            const getDigilockerDetails = await tenacioService.getDigilockerDetails(getLastSession?.sessionId);
            // const getDigilockerDetails = await tenacioService.getDigilockerDetails("getLastSession?.sessionId");
            const getFileName = getDigilockerDetails?.resData?.data?.photo?.content ? await fileMiddleware.uploadFile({
                buffer: Buffer.from(getDigilockerDetails?.resData?.data?.photo?.content as string, "base64"),
                originalname: getDigilockerDetails.resData?.data?.maskedaadhaar + '.png' || 'xxxx',
                mimetype: 'image/png'
            } as any, "aadhaar-digilocker") : "";

            await kycRepository.updateDigilockerAadharImage(getDigilockerDetails, getFileName, req.userDetails);

            return res.json({
                message: "success",
                code: 200,
                data: getDigilockerDetails?.resData
            })
        } catch (error) {
            next(error)
        }
    }

    uploadKycFiles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.uploadKycFiles(req?.files, req.body);

            await kycRepository.checkPanExists(req.body?.panNumber, req?.userDetails?.userId);

            if (req.body?.panNumber) {
                const tenacioDetail = await tenacioService.panBasicValidation(req.body?.panNumber);

                if (!tenacioDetail?.resData?.panNumber) {
                    this.customError.responseMessage = "Invalid PAN number";
                    throw this.customError;
                }
            }

            const aadhaarFrontFile = payload?.find(ele => ele?.fieldname == 'aadhaar-front');
            const aadhaarBackFile = payload?.find(ele => ele?.fieldname == 'aadhaar-back');
            const panFrontFile = payload?.find(ele => ele?.fieldname == 'pan-front');


            const [aadhaarFrontUrl, aadhaarBackUrl, panFrontUrl] = await Promise.all([
                aadhaarFrontFile ? fileMiddleware.uploadFile(aadhaarFrontFile, 'aadhaar-front') : undefined,
                aadhaarBackFile ? fileMiddleware.uploadFile(aadhaarBackFile, 'aadhaar-back') : undefined,
                panFrontFile ? fileMiddleware.uploadFile(panFrontFile, 'pan-front') : undefined,
            ]);

            const uploadedFiles: KYCFilesUpdate = {
                aadhaarFrontUrl,
                aadhaarBackUrl,
                panFrontUrl,
                preferredRetailer: req?.body?.preferredRetailer,
                panNumber: req.body.panNumber
            };
            await kycRepository.updateKycFiles(uploadedFiles, req.userDetails);
            return res.json({
                message: "files updated successfully",
                code: 200
            })
        } catch (error) {
            next(error);
        }
    }

    getKycDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const kycDetails = await kycRepository.getKycDetails(req?.userDetails);
            return res?.json({
                message: "success",
                code: 200,
                data: kycDetails
            })
        } catch (error) {
            next(error);
        }
    }

    getPincodeDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (validPincode(req?.params?.pincode)) {
                this.customError.responseMessage = "Please provide valid pincode";
                this.customError.responseCode = 400;
                throw this.customError;
            }
            const getPincodeDetails = await userRepository.getPincodeDetails(Number(req?.params?.pincode));
            return res.json({
                message: "success",
                code: 200,
                data: getPincodeDetails
            })
        } catch (error) {
            next(error);
        }
    }

    addRetailer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.addRetailers(req.body);
            if (payload?.gstNumber) {
                const getGstDetails = await tenacioService.gstBasicValidation(payload?.gstNumber);
                if (!getGstDetails?.resData?.gstin) {
                    this.customError.responseMessage = "Invalid GST number";
                    this.customError.responseCode = 400;
                    throw this.customError;
                }
            }
            const getPincodeDetails = await userRepository.getPincodeDetails(payload?.currentPincode as number);
            await kycRepository.addRetailer(payload, getPincodeDetails);
            return res.json({
                message: "Retailer registered successfully",
                code: 200,
            })
        } catch (error) {
            next(error);
        }
    }

    getRetailer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.getRetailer(req.body);
            const retailers = await kycRepository.getRetailer(payload);
            return res.json({
                message: 'success',
                code: 200,
                data: retailers
            })
        } catch (error) {
            next(error);
        }
    }

    createPurchasingRetailer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.createPurchasingRetailer(req.body);
            const data = await kycRepository.createPurchasingRetailer(req.userDetails, payload);
            return res.json({
                message: "Purchase retailer added successfully",
                code: 200,
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    editPurchasingRetailer = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.editPurchasingRetailer(req.body);
            await kycRepository.editPurchasingRetailer(req.userDetails, payload);
            return res.json({
                message: "Purchase retailer edited successfully",
                code: 200,
            });
        } catch (error) {
            next(error);
        }
    }

    listPurchasingRetailers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { includeInactive, page, limit } = customValidators.listPurchasingRetailersQuery(req.query as Record<string, unknown>);
            const result = await kycRepository.listPurchasingRetailers(req.userDetails, includeInactive, page, limit);
            return res.json({
                message: "success",
                code: 200,
                details: result.data,
                data: result.data,
                pagination: {
                    page: result.page,
                    limit: result.limit,
                    totalRecords: result.totalRecords,
                    totalPages: result.totalPages,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    tdsConsent = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req?.userDetails?.tdsConsent) {
                this.customError.responseMessage = "TDS consent already given";
                this.customError.responseCode = 400;
                throw this.customError;
            }

            let data;
            if (req?.userDetails?.panNumber) {
                const tenacioData = await tenacioService.getITRDetails(req?.userDetails?.panNumber);
                if (tenacioData?.resCode == 422) {
                    this.customError.responseMessage = "Please provide valid PAN details";
                    this.customError.responseCode = 400;
                    throw this.customError;
                }

                if ((!tenacioData || !tenacioData?.resData) && tenacioData?.resCode != 422) {
                    this.customError.responseMessage = "Service unavailable, please try again";
                    this.customError.responseCode = 502;
                    throw this.customError;
                }

                if (!tenacioData?.resData?.panNumber) {
                    this.customError.responseMessage = "Invalid PAN";
                    this.customError.responseCode = 400;
                    throw this.customError;
                }

                data = await kycRepository.tdsConsent(tenacioData?.resData as TenacioITRComplianceData, req?.userDetails);
            } else {
                data = await kycRepository.tdsConsent({} as TenacioITRComplianceData, req?.userDetails);
            }

            let responseData = {
                message: "unknown",
                code: 500,
                data: {
                    panNumber: data?.panNumber,
                    tdsSlab: data?.tdsSlabs
                }
            }
            if (!req?.userDetails?.panNumber) {
                responseData.code = 204;
                responseData.message = "Your TDS deduction will be @20% as your PAN details not submitted";
            } else if (data?.aadhaarLinked && data?.panValid && data?.itr) {
                responseData.code = 200;
                responseData.message = "Your TDS deduction will be @10% as your PAN details are Valid";
            } else if (!data?.panValid) {
                responseData.code = 201;
                responseData.message = "Your TDS deduction will be @20% as your PAN details are invalid.";
            } else if (!data?.aadhaarLinked) {
                responseData.code = 202;
                responseData.message = "Your TDS deduction will be @20% as your PAN and Aadhaar are not linked.";
            } else if (!data?.itr) {
                responseData.code = 203;
                responseData.message = "Your TDS deduction will be @20% because of non-filling tax return.";
            } else {
                responseData.code = 500;
                responseData.message = "unknown";
            }

            return res.json(responseData)
        } catch (error) {
            next(error);
        }
    }

    getPendingKyc = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let pendingKycList = await kycRepository.getKycByStatus(false);
            return res.json({
                message: 'success',
                code: 200,
                data: pendingKycList
            })
        } catch (error) {
            next(error);
        }
    }

    // getUserKycDetails = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const { userId } = req.query;
    //         let pendingKycList;
    //         if (userId) {
    //             pendingKycList = await kycRepository.getUserKycDetails(Number(userId));
    //         } else {
    //             pendingKycList = await kycRepository.getUserKycDetails();
    //         }
    //         return res.json({
    //             message: 'success',
    //             code: 200,
    //             data: pendingKycList
    //         })
    //     } catch (error) {
    //         next(error);
    //     }
    // }

    getUserKycDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { userId, page, limit } = req.query;

            const pageNum = page ? Number(page) : 1;
            const limitNum = limit ? Number(limit) : 10;

            let pendingKycList;

            if (userId) {
                pendingKycList = await kycRepository.getUserKycDetails(
                    req?.userDetails,
                    pageNum,
                    limitNum,
                    Number(userId),
                );
            } else {
                pendingKycList = await kycRepository.getUserKycDetails(
                    req?.userDetails,
                    pageNum,
                    limitNum
                );
            }

            return res.status(200).json({
                message: "success",
                code: 200,
                ...pendingKycList   // ⬅ includes pagination: page, limit, totalPages, data
            });

        } catch (error) {
            next(error);
        }
    }


    updatekyc = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let payload = customValidators.updateKycStatus(req.body);
            let result = await kycRepository.updateBulkKycStatus(req.body);
            return res.json({
                message: 'success',
                code: 200,
                data: result
            })
        } catch (error) {
            next(error);
        }
    }


    // updateKycRecords = async (req: Request, res: Response, next: NextFunction) => {
    //     try {
    //         const { updates } = req.body;
    //         const adminUserId = req.user?.userId; // assuming you're attaching admin userId from auth middleware

    //         if (!Array.isArray(updates) || updates.length === 0) {
    //             throw new CustomError({
    //                 responseCode: 400,
    //                 responseMessage: "Invalid request: updates array is required"
    //             });
    //         }

    //         // Basic validation for each item
    //         for (const item of updates) {
    //             if (!item.detailId || !item.status) {
    //                 throw new CustomError({
    //                     responseCode: 400,
    //                     responseMessage: "Each update must include detailId and status"
    //                 });
    //             }

    //             if (!["Approved", "Rejected"].includes(item.status)) {
    //                 throw new CustomError({
    //                     responseCode: 400,
    //                     responseMessage: `Invalid status for detailId ${item.detailId}`
    //                 });
    //             }
    //         }

    //         // Call repository method
    //         const repo = new KycRepository();
    //         const result = await repo.updateKycStatuses(updates, adminUserId);

    //         return res.status(200).json({
    //             message: "success",
    //             code: 200,
    //             data: result
    //         });

    //     } catch (error) {
    //         next(error);
    //     }
    // }

    updateKycRecords = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { updates } = req.body;
            const adminUserId = req.user?.userId;

            if (!updates || !Array.isArray(updates) || updates.length === 0) {
                throw new CustomError({
                    responseCode: 400,
                    responseMessage: "Updates array required"
                });
            }

            const repo = new KycRepository();
            const result = await repo.updateKycStatuses(updates, req?.userDetails);

            return res.status(200).json({
                code: 200,
                message: "KYC update completed",
                data: result
            });

        } catch (error) {
            next(error);
        }
    }

    updateProfileImage = async (req: Request, res: Response, next: NextFunction) => {
        try {
            if (req?.userDetails?.kycApproval) {
                this.customError.responseMessage = "Profile image cannot update after KYC approved";
                throw this.customError;
            }
            const profileUrl = req.file?.buffer ? await fileMiddleware.uploadFile(req.file, 'user-profile') : "";
            await kycRepository.updateProfileImage(profileUrl, req?.userDetails?.userId);
            return res.json({
                message: "Profile details updated successfully",
                code: 200,
            })
        } catch (error) {
            next(error);
        }
    }

    getRetailerWorkshopMappings = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.retailerWorkshopMappingsQuery(req.query as Record<string, unknown>);
            const result = await kycRepository.getRetailerWorkshopMappings(payload, req.userDetails);
            return res.json({
                message: "success",
                code: 200,
                page: result.page,
                limit: result.limit,
                totalRecords: result.totalRecords,
                totalPages: result.totalPages,
                data: result.data
            });
        } catch (error) {
            next(error);
        }
    }

    mapRetailerWorkshop = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const rawSelectedRetailers =
                req?.body?.selectedID ??
                req?.body?.selectedId ??
                req?.body?.purchasedRetailers ??
                req?.body?.purchasedRetailerIds;

            const selectedRetailers = Array.isArray(rawSelectedRetailers)
                ? rawSelectedRetailers.map((id: unknown) => Number(id)).filter((id: number) => Number.isInteger(id) && id > 0)
                : [];

            await kycRepository.mapRetailerWorkshop(selectedRetailers, req?.userDetails);
            return res.json({
                message: "Mapping updated",
                code: 200
            })
        } catch (error) {
            next(error);
        }
    }

    deMapRetailerWorkshop = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const mappingId = customValidators.deMapRetailerWorkshop(req.params?.mappingId);
            const data = await kycRepository.deMapRetailerWorkshop(mappingId);
            return res.json({
                message: "Mapping de-mapped successfully",
                code: 200,
                data,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const kycController = new KYCController();