// controllers/auth-controller.ts
import { userRepository } from "../repositories/user-repository";
import { generateHash, getFileUrl } from "../utils/random";
import { customValidators } from "../utils/custom-validators";
import { RedisClient } from "../services/redis-client";
import { CustomError, registerUserPayload, UserDetails, UserSearch } from "../types";
import { Request, Response, NextFunction } from "express";
import { kycRepository, mechanicRepository, registerOtpRepository, roleRepository } from "../repositories/index";
import { authMiddleware } from "../middlewares/auth-middleware";
import { tenacioService } from "../services/tenacio-service";
import { fileMiddleware } from "../middlewares/file-middleware";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { UserModel } from "../schemas";
import { blockLevelEnum } from "../schemas/user-model";

export class UserController {
    // ... existing code ...
    private customError: CustomError;
    private redisClient = RedisClient.getInstance();

    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
            statusCode: 200,
        });
    }


    registerUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1️⃣ Create payload instance and validate
            const payload = customValidators.registerUserValidator(req.body);
            payload.userMobile = req?.user?.mobile;
            // 2️⃣ Check if user already exists by mobile
            const existingByMobile = await userRepository.getUserByMobile(payload.userMobile);
            if (existingByMobile) {
                this.customError.responseMessage = "User with this mobile already exists";
                throw this.customError;
            }

            if (payload?.userEmail) {
                // 2️⃣ Check if user already exists by email
                const existingByEmail = await userRepository.getUserByEmail(payload.userEmail);
                if (existingByEmail) {
                    this.customError.responseMessage = "User with this email already exists";
                    throw this.customError;
                }
            }

            // 3️⃣ Fetch role from DB and validate
            const role = await roleRepository.getRoleById(payload.userRole);
            if (!role || !role?.isActive) {
                this.customError.responseMessage = "Invalid or inactive role";
                throw this.customError;
            }

            // 6️⃣ Hash password
            const hashedPassword = await generateHash(payload.userPassword);

            // 7️⃣ Create user
            if (payload.userRole === 1) {
                await mechanicRepository.createMechanicWithTransaction({
                    ...payload,
                    userPassword: hashedPassword,
                });
            }
            const userDetails = await userRepository.getUserDetails({
                mobile: payload.userMobile
            } as UserSearch)

            const tokens = authMiddleware.generateUserToken({
                email: userDetails.userEmail,
                mobile: userDetails.userMobile,
                userCode: userDetails.userCode as string,
                userId: userDetails.userId
            })

            return res.status(201).json({
                code: 201,
                message: "User registered successfully",
                data: {
                    tokens,
                    userDetails
                }
            });
        } catch (error) {
            next(error);
        }
    };

    addUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // 1️⃣ Create payload instance and validate
            const payload = customValidators.registerUserValidator(req.body);
            //payload.userMobile = req?.user?.mobile;
            // 2️⃣ Check if user already exists by mobile
            const existingByMobile = await userRepository.getUserByMobile(payload.userMobile);
            if (existingByMobile) {
                this.customError.responseMessage = "User with this mobile already exists";
                throw this.customError;
            }

            // 2️⃣ Check if user already exists by email
            const existingByEmail = await userRepository.getUserByEmail(payload.userEmail);
            if (existingByEmail) {
                this.customError.responseMessage = "User with this email already exists";
                throw this.customError;
            }

            // 3️⃣ Fetch role from DB and validate
            const role = await roleRepository.getRoleById(payload.userRole);
            if (!role || !role?.isActive) {
                this.customError.responseMessage = "Invalid or inactive role";
                throw this.customError;
            }

            // 6️⃣ Hash password
            const hashedPassword = await generateHash(payload.userPassword);

            // 7️⃣ Create user
            if (payload.userRole === 1) {
                await mechanicRepository.createMechanicWithTransaction({
                    ...payload,
                    userPassword: hashedPassword,
                });
            } else {
                await userRepository.createUser({ ...payload, userPassword: hashedPassword })
            }
            const userDetails = await userRepository.getUserDetails({
                mobile: payload.userMobile
            } as UserSearch, true)

            const tokens = authMiddleware.generateUserToken({
                email: userDetails.userEmail,
                mobile: userDetails.userMobile,
                userCode: userDetails.userCode as string,
                userId: userDetails.userId
            })

            return res.status(201).json({
                code: 201,
                message: "User registered successfully",
                data: {
                    tokens,
                    userDetails
                }
            });
        } catch (error) {
            next(error);
        }
    };

    // controllers/auth-controller.ts
    listRoles = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const roles = await roleRepository.getAllActiveRoles();
            return res.status(200).json({
                code: 200,
                message: "Active roles fetched successfully",
                data: roles,
            });
        } catch (error) {
            next(error);
        }
    };

    updateUserProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.updateUserProfile(req.body);
            if (req?.file?.buffer) {
                payload.userProfile = await fileMiddleware.uploadFile(req?.file, 'user-profile')
            }

            const userData = await userRepository.updateUserProfile(payload, req?.userDetails);
            this.updateAccountDetails(userData, "both");
            const refreshedUserDetails = await userRepository.getUserDetails({
                mobile: req?.userDetails?.userMobile
            } as UserSearch, true);
            return res.json({
                message: "User Details updated successfully",
                code: 200,
                data: refreshedUserDetails
            })
        } catch (error) {
            next(error)
        }
    }

    getUserProfile = async (req: Request, res: Response, next: NextFunction) => {
        try {
            return res.json({
                message: "success",
                code: 200,
                data: req.userDetails
            })
        } catch (error) {
            next(error)
        }
    }

    raiseTicket = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.raiseTicket(req.body, req?.file);
            if (payload?.file) {
                payload.fileUrl = await fileMiddleware.uploadFile(payload?.file, "ticket");
            }
            const ticketRef = await userRepository.raiseTicket(payload, req.userDetails);
            return res.json({
                message: `Ticket has been raised successfully, reference ID: ${ticketRef}`,
                code: 200,
                data: {
                    ticketRef
                }
            })
        } catch (error) {
            next(error)
        }
    }

    getAccountDetails = async (
        req: Request,
        res: Response,
        next: NextFunction
    ) => {
        try {
            const { type } = customValidators.getAccountDetails(req.body);
            let data = await userRepository.getAccountDetails(type, req.userDetails);
            return res.json({
                message: `success`,
                code: 200,
                type,
                data,
            });
        } catch (error) {
            next(error);
        }
    };


    updateAccountDetails = async (
        insertedData:
            | InferInsertModel<typeof UserModel>
            | InferSelectModel<typeof UserModel>,
        type: "upi" | "bank" | "both"
    ) => {
        try {
            if (type == "both" || type == "upi") {
                const upiDetails = await tenacioService.getUpiIdList(insertedData.userMobile);
                if (upiDetails?.resData?.data?.vpa?.length) {
                    await userRepository.updateUpiDetails(
                        upiDetails?.resData?.data?.vpa,
                        insertedData
                    );
                }
            }
            if (type == "both" || type == "bank") {
                const bankDetails = await tenacioService.getBankDetails(insertedData.userMobile);
                if (bankDetails?.resData?.status == "success") {
                    await userRepository.updateBankDetails(
                        bankDetails?.resData?.data,
                        insertedData
                    );
                }
            }
        } catch (error) { }
    };

    assignTicket = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let payload = customValidators.assignTicket(req.body);
            let response = await userRepository.assignTicketToRole(payload, req.userDetails.userId);
            return res.json({
                message: 'success',
                code: 200,
                data: response
            })
        } catch (error) {
            next(error);
        }
    }

    resolveTickets = async (req: Request, res: Response, next: NextFunction) => {
        try {
            let payload = customValidators.resolveTicket(req.body);
            let result = await userRepository.resolveTickets(payload, req.userDetails.userId);
            return res.json({
                message: 'success',
                code: 200,
                data: result
            })
        } catch (error) {
            next(error)
        }
    }

    userCount = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, role } = req.query;

            const filters: {
                status?: (typeof blockLevelEnum.enumValues)[number];
                role?: number[];
            } = {};

            // Validate status
            if (status) {
                if (!blockLevelEnum.enumValues.includes(status as any)) {
                    return res.status(400).json({
                        message: `Invalid status filter: ${status}`
                    });
                }
                filters.status = status as (typeof blockLevelEnum.enumValues)[number];
            }

            // Handle role (single or multiple)
            if (role) {
                let roles: number[] = [];

                if (Array.isArray(role)) {
                    roles = role.map(r => Number(r));
                } else {
                    roles = [Number(role)];
                }

                if (roles.some(isNaN)) {
                    return res.status(400).json({ message: "Role must be a number" });
                }

                filters.role = roles;
            }

            const result = await userRepository.userCount(filters);
            return res.status(200).json({
                message: "User count fetched successfully",
                count: result.count,
            });
        } catch (error) {
            next(error);
        }
    };

    listUsers = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { status, role, search, page, limit } = req.query;

            // -----------------------------
            // PREPARE FILTERS OBJECT
            // -----------------------------
            const filters: {
                status?: string;
                role?: number[];
                search?: string;
                page?: number;
                limit?: number;
            } = {};

            // STATUS FILTER
            if (status) {
                filters.status = String(status);
            }

            // ROLE FILTER (can be 1 or multiple like role=1&role=2)
            if (role) {
                // single role → "1"
                // multiple roles → ["1", "2"]
                let roleArray: number[] = [];

                if (Array.isArray(role)) {
                    roleArray = role.map(r => Number(r)).filter(r => !isNaN(r));
                } else {
                    const r = Number(role);
                    if (!isNaN(r)) roleArray = [r];
                }

                filters.role = roleArray;
            }

            // SEARCH FILTER
            if (search) {
                filters.search = String(search);
            }

            // PAGINATION
            if (page) filters.page = Number(page);
            if (limit) filters.limit = Number(limit);

            // -----------------------------
            // CALL DB / SERVICE LAYER
            // -----------------------------
            const result = await userRepository.listUsers(filters);

            // -----------------------------
            // SEND RESPONSE
            // -----------------------------
            return res.status(200).json({
                message: "Users fetched successfully",
                ...result,
            });

        } catch (error) {
            next(error);
        }
    };

    deactivateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            // Get userId from route params
            const userId = Number(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "Invalid userId parameter" });
            }

            // Get updatedBy from authenticated user (JWT)
            // Adjust based on your project structure
            const updatedBy = req.userDetails.userId;

            // Call service/db layer
            const result = await userRepository.deactivateUser(userId, updatedBy);

            return res.status(200).json({
                message: "User deactivated successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    };

    activateUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = Number(req.params.userId);
            if (isNaN(userId)) {
                return res.status(400).json({ message: "Invalid userId parameter" });
            }

            const updatedBy = (req as any).user?.userId || 0;

            const result = await userRepository.activateUser(userId, updatedBy);

            return res.status(200).json({
                message: "User activated successfully",
                data: result
            });

        } catch (error) {
            next(error);
        }
    };

    listActivityLogs = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                activityType,
                userId,
                fromDate,
                toDate,
                search,
                page,
                limit
            } = req.query;

            const filters: any = {};

            // activityType filter
            if (activityType) {
                filters.activityType = activityType as "login" | "logout";
            }

            // userId filter
            if (userId) {
                filters.userId = Number(userId);
            }

            // date filters
            if (fromDate) {
                filters.fromDate = String(fromDate);
            }

            if (toDate) {
                filters.toDate = String(toDate);
            }

            // search
            if (search) {
                filters.search = String(search);
            }

            // pagination
            if (page) {
                filters.page = Number(page);
            }

            if (limit) {
                filters.limit = Number(limit);
            }

            // call DB layer
            const result = await userRepository.listActivityLogs(filters);

            return res.status(200).json({
                success: true,
                message: "Activity logs fetched successfully",
                ...result,
            });

        } catch (error) {
            next(error);
        }
    };

    fetchTickets = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                ticketId,
                userId,
                ticketStatus,
                ticketCategoryId,
                roleAssigned,
                createdBy,
                isActive,

                search,
                dateFrom,
                dateTo,

                page,
                limit,
                sortBy,
                sortOrder,
            } = req.query;

            const filters = {
                ticketId: ticketId ? Number(ticketId) : undefined,
                userId: userId ? Number(userId) : undefined,
                ticketStatus: ticketStatus as any,
                ticketCategoryId: ticketCategoryId ? Number(ticketCategoryId) : undefined,
                roleAssigned: roleAssigned ? Number(roleAssigned) : undefined,
                createdBy: createdBy ? Number(createdBy) : undefined,
                isActive: typeof isActive !== "undefined" ? isActive === "true" : undefined,

                search: search as string,

                dateFrom: dateFrom as string,
                dateTo: dateTo as string,

                page: page ? Number(page) : 1,
                limit: limit ? Number(limit) : 10,
                sortBy: (sortBy as any) || "createdAt",
                sortOrder: (sortOrder as any) || "desc",
            };

            const data = await userRepository.fetchTickets(filters);

            return res.status(200).json({
                message: "success",
                code: 200,
                data,
            });

        } catch (error) {
            next(error);
        }
    };

    // addUser = async (req: Request, res: Response, next: NextFunction) => {
    //     try {

    //     } catch (error) {
    //         next(error);
    //     }
    // }

    // addMember = async (req: Request, res: Response, next: NextFunction) => {
    //     try {

    //     } catch (error) {
    //         next(error);
    //     }
    // }

    fetchTicketSignedUrl = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const {
                ticketId
            } = req.query;
            const filters = {
                ticketId: ticketId ? Number(ticketId) : undefined,
            };
            if (!ticketId) {
                this.customError.responseMessage = "Please provide ticket id";
                throw this.customError;
            }
            let ticket = await userRepository.fetchTickets(filters);
            if (ticket.data.length === 0) {
                this.customError.responseMessage = "Ticket not found";
                throw this.customError;
            }
            if (ticket.data[0].ticket.imgUrl) {
                let signedUrl = await fileMiddleware.getFileSignedUrl(ticket.data[0].ticket.imgUrl, "ticket");
                return res.status(200).json({
                    message: "success",
                    code: 200,
                    signedUrl,
                });
            } else {
                this.customError.responseMessage = "No image found";
                throw this.customError;
            }
        } catch (error) {
            next(error)
        }
    }

    updateUserDetails = async (req: Request, res: Response, next: Function) => {
        try {
            const userId = Number(req.params.userId);   // GET userId from URL param
            const { displayName, workshopName } = req.body;  // GET update fields
            if (!userId) {
                this.customError.responseMessage = "Please provide user id";
                throw this.customError;
            }
            if (!displayName && !workshopName) {
                this.customError.responseMessage = "No fields provided to update";
                throw this.customError;
            }

            const result = await userRepository.updateUserDetails(userId, {
                displayName,
                workshopName
            });

            return res.status(200).json({
                success: true,
                ...result,
            });

        } catch (error) {
            next(error);
        }
    };

}
export const userController = new UserController();