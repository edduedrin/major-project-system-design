import { Request } from "express";
import {
    assignTicket,
    CustomError,
    CustomMulterFilesField,
    MarketProductFilter,
    OrderProductPayload,
    OtpRequest,
    PassbookHistoryPayload,
    ProductScan,
    ReferralHistoryPayload,
    registerUserPayload,
    ResetPassword,
    resolveTicket,
    RetailerFilter,
    RetailerPayload,
    PurchasingRetailerCreatePayload,
    PurchasingRetailerEditPayload,
    RetailerWorkshopMapPayload,
    RetailerWorkshopMapActionPayload,
    RetailerWorkshopMappingsQueryPayload,
    SetNewPassword,
    SetPinRequest,
    TDSConsent,
    TicketPayload,
    UpdateKycStatus,
    UploadFiles,
    UserDetails,
    UserProfileUpdate,
    userSignInPayload,
    VerifyPinRequest,
    VerifyUserRequest
} from "../types";
import { AddToCartPayload, UpdateCartPayload, DeleteCartPayload, ViewCartFilter, AddToWishlistPayload, DeleteWishlistPayload, ViewWishlistFilter, AddOrderPayload, ViewOrderFilter, AddAddressPayload, ViewAddressFilter, AddMarketProduct, EditMarketProduct, UpdateDeliveryStatusPayload } from "../types";
import { ProcessRedemptionPayload, RedemptionHistoryFilter, RedemptionPayload } from "../types/redeem";
import { isValidDate } from "./random";

import {
    mobileValidate,
    mailValidation,
    validatePassword,
    otpValidate,
    validEmail,
    validPincode,
    validPan,
    validGst,
    removeSpace
} from "./regex";
import { generateQrRequest } from "../types/qr";
import { AdminReferalHistoryPayload, ApplicationLoginPayload, QRTransactionPayload, RegisteredUsersPayload, BankDetailsPayload, KycReportPayload, ProductWiseReportPayload, CategoryReportPayload, ErrorTransactionReportPayload, NotificationReportPayload, BlockedMemberReportPayload, BlockedMemberQrScanReportPayload, AnomalyTransactionsReportPayload, ShockReplacementReportPayload } from "../types/reports";
import { AmazonDeliveryStatusEnum } from "../schemas";
import { AnswerPayload } from "../types/survey";
const defaultRoles = [
    { roleName: "mechanic", roleDescription: "Mechanic", isActive: true },
    { roleName: "retailer", roleDescription: "Retailer", isActive: true },
    { roleName: "salesAdmin", roleDescription: "Sales Admin", isActive: true },
    { roleName: "marketAdmin", roleDescription: "Market Admin", isActive: true },
    { roleName: "evolveAdmin", roleDescription: "Evolve Admin", isActive: true },
    { roleName: "zfAdmin", roleDescription: "ZF Admin", isActive: true },

];
export class CustomValidators {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400,
            statusCode: 200,
        });
    }
    sendOtpReqValidator(payload: OtpRequest) {
        if (!payload.mobile || !payload.type) {
            this.customError.responseMessage = `Please provide ${!payload.mobile ? "mobile number" : "type"
                }`;
            throw this.customError;
        }

        if (mobileValidate(payload.mobile)) {
            this.customError.responseMessage = `Please provide valid 10 digit mobile number`;
            throw this.customError;
        }

        if (!["register-user", "forgot-password"].includes(payload.type)) {
            this.customError.responseMessage = `Invalid OTP type`;
            throw this.customError;
        }
    }

    registerUserValidator(payload: registerUserPayload) {
        if (!payload.userRole || !payload.userPassword) {
            this.customError.responseMessage = "All fields (userEmail, userRole, userPassword) are required";
            throw this.customError;
        }

        payload.userPassword = Buffer.from(payload.userPassword, 'base64').toString('utf-8')

        // Validate email
        // if (mailValidation(payload.userEmail)) {
        //     this.customError.responseMessage = "Please provide a valid email address";
        //     throw this.customError;
        // }

        // Validate password length
        if (validatePassword(payload.userPassword)) {
            this.customError.responseMessage = "Please provide strong password";
            throw this.customError;
        }

        // Validate role
        const roleNames = defaultRoles.map(r => r.roleName);
        if (!roleNames.includes(payload.userRole.toString()) && typeof payload.userRole === "string") {
            this.customError.responseMessage = "Invalid user role";
            throw this.customError;
        }

        return new registerUserPayload({ ...payload, displayName: 'unknown', userName: 'unknown', })
    }

    verifyUserValidator(payload: VerifyUserRequest) {
        if (!payload.mobile && !payload.email) {
            this.customError.responseMessage = `Please provide mobile number or email`;
            throw this.customError;
        }

        if (payload.mobile && mobileValidate(payload.mobile)) {
            this.customError.responseMessage = `Please enter a valid 10-digit phone number.`;
            throw this.customError;
        }

        if (payload.email && mailValidation(payload.email)) {
            this.customError.responseMessage = `Please enter a valid email.`;
            throw this.customError;
        }

        if (!payload.type) {
            this.customError.responseMessage = `Invalid login type`;
            throw this.customError;
        }

        if (payload.type == "login-otp" && !payload.otp) {
            this.customError.responseMessage = `Please provide OTP`;
            throw this.customError;
        }

        if (payload.type == "forgot-password" && !payload.otp) {
            this.customError.responseMessage = `Please provide OTP`;
            throw this.customError;
        }

        payload.password = payload?.password ? Buffer.from(payload?.password, 'base64').toString('utf-8') : ""

        if (payload.type == "login-password" && (!payload.password || validatePassword(payload?.password))) {
            this.customError.responseMessage = `Please provide a strong password`;
            throw this.customError;
        }

        if (payload.type == "login-otp" && !otpValidate(payload.otp)) {
            this.customError.responseMessage = `Please enter a valid 4-digit OTP.`;
            throw this.customError;
        }

        if ((payload.type == "login-otp" || payload.type == "login-password" || payload.type == "register-warranty") && !payload?.clientUuid) {
            this.customError.responseMessage = `Unathorized`;
            throw this.customError;
        }

        if (
            ![
                "forgot-password",
                "login-password",
                "login-otp",
                "register-warranty",
                "register-user"
            ].includes(payload.type)
        ) {
            this.customError.responseMessage = `Invalid login type`;
            throw this.customError;
        }

        return new VerifyUserRequest(payload);
    }

    userSignInPayloadValidator(payload: userSignInPayload) {
        // Password is required
        if (!payload.password) {
            this.customError.responseMessage = "Password is required";
            throw this.customError;
        }

        // Either mobile or email is required
        if (!payload.mobile && !payload.email) {
            this.customError.responseMessage = "Either mobile or email must be provided";
            throw this.customError;
        }

        // Validate mobile if provided
        if (payload.mobile && mobileValidate(payload.mobile)) {
            this.customError.responseMessage = "Please provide a valid 10 digit mobile number";
            throw this.customError;
        }

        // Validate email if provided
        if (payload.email && mailValidation(payload.email)) {
            this.customError.responseMessage = "Please provide a valid email address";
            throw this.customError;
        }
    }

    validateForgotPassword({ type = "", password }: SetNewPassword) {
        if (!password) {
            this.customError.responseMessage = "Please provide password";
            throw this.customError;
        }

        password = password ? Buffer.from(password, 'base64').toString('utf-8') : ""

        if (validatePassword(password)) {
            this.customError.responseMessage = "Please set a strong password";
            throw this.customError;
        }

        return new SetNewPassword({
            password: password,
            type
        })
    }

    redemptionValidators(payload: any) {
        if (!payload?.type) {
            this.customError.responseMessage = "Please provide redemption mode";
            throw this.customError;
        }

        if (!["upi", "bank-transfer"].includes(payload?.type)) {
            this.customError.responseMessage = "Invalid redemption mode";
            throw this.customError;
        }

        if (!payload?.value) {
            this.customError.responseMessage = "Please provide redemption amount";
            throw this.customError;
        }
        if (isNaN(Number(payload?.value))) {
            this.customError.responseMessage =
                "Please provide valid redemption amount";
            throw this.customError;
        }
        if (payload?.value <= 0) {
            this.customError.responseMessage = "Redemption amount must be greater than 0";
            throw this.customError;
        }

        if (payload?.type == "upi" && !payload?.upiId) {
            this.customError.responseMessage = "Please provide valid upiId";
            throw this.customError;
        }

        if (payload?.type == "bank-transfer" && !payload?.accountNumber) {
            this.customError.responseMessage = "Please provide valid account number";
            throw this.customError;
        }

        return new RedemptionPayload(payload);
    }

    bulkRedemptionValidators(payload: any) {
        if (!payload?.items || !Array.isArray(payload.items) || payload.items.length === 0) {
            this.customError.responseMessage = "Invalid payload: items[] is required";
            throw this.customError;
        }

        const validatedItems = [];

        for (const item of payload.items) {
            const { userCode, payload: redeemPayload } = item;

            // ----- Validate userCode -----
            if (!userCode || typeof userCode !== "string") {
                this.customError.responseMessage = "Each item must contain a valid userCode";
                throw this.customError;
            }

            // ----- Validate payload -----
            if (!redeemPayload?.type) {
                this.customError.responseMessage = `Please provide redemption mode for user ${userCode}`;
                throw this.customError;
            }

            if (!["upi", "bank-transfer"].includes(redeemPayload.type)) {
                this.customError.responseMessage = `Invalid redemption mode for user ${userCode}`;
                throw this.customError;
            }

            if (!redeemPayload?.value) {
                this.customError.responseMessage = `Please provide redemption amount for user ${userCode}`;
                throw this.customError;
            }

            if (isNaN(Number(redeemPayload.value))) {
                this.customError.responseMessage = `Invalid redemption amount for user ${userCode}`;
                throw this.customError;
            }

            if (Number(redeemPayload.value) <= 0) {
                this.customError.responseMessage = `Redemption amount must be > 0 for user ${userCode}`;
                throw this.customError;
            }

            // ----- Mode-specific validations -----

            if (redeemPayload.type === "upi" && !redeemPayload?.upiId) {
                this.customError.responseMessage = `Please provide UPI ID for user ${userCode}`;
                throw this.customError;
            }

            if (redeemPayload.type === "bank-transfer" && !redeemPayload?.accountNumber) {
                this.customError.responseMessage = `Please provide account number for user ${userCode}`;
                throw this.customError;
            }

            // Add final validated structure:
            validatedItems.push({
                userCode,
                payload: new RedemptionPayload(redeemPayload)
            });
        }

        return { items: validatedItems };
    }


    redemptionHistoryValidator(
        payload: RedemptionHistoryFilter
    ): RedemptionHistoryFilter {
        if (payload?.fromDate && isValidDate(payload?.fromDate)) {
            this.customError.responseMessage = "Please provide valid From Date";
            throw this.customError;
        }

        if (payload?.toDate && isValidDate(payload?.toDate)) {
            this.customError.responseMessage = "Please provide valid To Date";
            throw this.customError;
        }

        const statusList =
            payload.status?.filter(
                (ele: string) => !["Pending", "Approved", "Rejected"].includes(ele)
            ) || [];

        if (statusList?.length) {
            this.customError.responseMessage = "Invalid redemption status";
            throw this.customError;
        }

        return new RedemptionHistoryFilter({
            ...payload, //check what problem
            fromDate: payload?.fromDate || "",
            toDate: payload?.toDate || "",
            redemptionRef: payload?.redemptionRef || [],
            status:
                payload?.status?.map((ele: any) => {
                    if (ele == "Rejected") {
                        return "Rejected";
                    } else if (ele == "Approved") {
                        return "Approved";
                    } else {
                        return "Pending";
                    }
                }) || [],
        });
    }

    processRedemptionValidators(payload: any) {
        if (!payload || !Array.isArray(payload)) {
            this.customError.responseMessage = "Please provide redemption list";
            throw this.customError;
        }

        for (let ele of payload) {
            if (!ele?.redemptionRef) {
                this.customError.responseMessage = "Please provide redemption";
                throw this.customError;
            }

            if (!["Approve", "Reject"].includes(ele?.status)) {
                this.customError.responseMessage = "Please provide valid status";
                throw this.customError;
            }

            if (ele?.status == "Reject" && !ele?.comment) {
                this.customError.responseMessage =
                    "Please provide comment to reject the redemption";
                throw this.customError;
            }
        }

        return payload.map((ele) => new ProcessRedemptionPayload(ele));
    }

    initiateDigilocker() {

    }

    uploadKycFiles(files: any, payload: any) {
        if (payload?.panNumber && validPan(payload?.panNumber)) {
            this.customError.responseMessage = "Please provide valid PAN number";
            throw this.customError;
        }

        if (
            payload?.preferredRetailer &&
            payload?.preferredRetailer
                ?.split(",")
                ?.map((ele: string) => Number(ele))
                ?.filter((ele: Number) => !ele)
                ?.length
        ) {
            this.customError.responseMessage = "Invalid Retailers in the list";
            throw this.customError;
        }
        const images: Express.Multer.File[] = []
        for (let img in files) {
            images.push({
                ...files?.[img]?.[0],
                buffer: files?.[img]?.[0]?.buffer,
                originalname: files[img]?.[0]?.originalname,
                fieldname: files[img]?.[0]?.fieldname,
                mimetype: files[img]?.[0]?.mimetype
            })
        }
        return images
    }

    addRetailers(payload: RetailerPayload) {
        if (!payload?.storeName) {
            this.customError.responseMessage = "Please provide store name"
            throw this.customError;
        }
        if (!payload?.retailerName) {
            this.customError.responseMessage = "Please provide retailer name"
            throw this.customError;
        }
        if (!payload?.mobileNumber || mobileValidate(payload?.mobileNumber)) {
            this.customError.responseMessage = "Please provide mobile number"
            throw this.customError;
        }
        if (!payload?.currentPincode || validPincode(payload?.currentPincode?.toString())) {
            this.customError.responseMessage = "Please provide pincode"
            throw this.customError;
        }

        if (payload?.gstNumber && validGst(payload?.gstNumber)) {
            this.customError.responseMessage = "Please provide valid GST number"
            throw this.customError;
        }
        return new RetailerPayload(payload);
    }

    getRetailer(payload: RetailerFilter) {
        if (payload?.pincode && validPincode(payload?.pincode?.toString())) {
            this.customError.responseMessage = "Please provide valid pincode"
            throw this.customError;
        }

        return new RetailerFilter(payload);
    }

    createPurchasingRetailer(payload: Partial<PurchasingRetailerCreatePayload>) {
        const shopName = payload?.shopName?.trim() || "";
        const address = payload?.address?.trim() || "";
        const mobile = payload?.mobile || "";
        const validationErrors: Array<{ field: string; message: string }> = [];
        if (!shopName) {
            validationErrors.push({
                field: "shopName",
                message: "shopName is required",
            });
        }
        if (!address) {
            validationErrors.push({
                field: "address",
                message: "address is required",
            });
        }
        if (!mobile || mobileValidate(mobile)) {
            validationErrors.push({
                field: "mobile",
                message: "mobile must be a valid 10-digit number",
            });
        }
        if (validationErrors.length) {
            throw new CustomError({
                responseCode: 400,
                statusCode: 400,
                responseMessage: "Validation failed",
                validationErrors,
            });
        }
        return new PurchasingRetailerCreatePayload({
            shopName,
            address,
            mobile: removeSpace(mobile),
        });
    }

    editPurchasingRetailer(payload: Partial<PurchasingRetailerEditPayload>) {
        const mappingId = Number(payload?.mappingId);
        if (!mappingId || Number.isNaN(mappingId) || mappingId < 1) {
            this.customError.responseMessage = "Please provide valid mapping id";
            throw this.customError;
        }
        if (payload?.isActive !== false) {
            this.customError.responseMessage = "Only isActive=false is allowed in edit";
            throw this.customError;
        }
        return new PurchasingRetailerEditPayload({ mappingId, isActive: false });
    }

    listPurchasingRetailersQuery(query: Record<string, unknown>) {
        const raw = query?.includeInactive;
        const includeInactive =
            raw === "true" ||
            raw === true ||
            raw === "1" ||
            raw === 1;
        const page = Math.max(1, Number(query?.page) || 1);
        const limit = Math.min(100, Math.max(1, Number(query?.limit) || 10));
        const workshopId = Number(query?.workshopId);

        return { includeInactive, page, limit, workshopId };
    }

    updateUserProfile(payload: UserProfileUpdate) {
        if (!payload?.userName) {
            this.customError.responseMessage = "Please provide name";
            throw this.customError
        }
        if (!payload?.gender) {
            this.customError.responseMessage = "Please provide gender";
            throw this.customError
        }
        if (!payload?.age) {
            this.customError.responseMessage = "Please provide age";
            throw this.customError
        }
        if (Number(payload?.age) < 18) {
            this.customError.responseMessage = "Age should be above 18";
            throw this.customError
        }
        if (!payload?.currentAddress) {
            this.customError.responseMessage = "Please provide address";
            throw this.customError
        }
        if (!payload?.workshopName) {
            this.customError.responseMessage = "Please provide workshop name";
            throw this.customError
        }
        if (!payload?.workshopAddress) {
            this.customError.responseMessage = "Please provide workshop address";
            throw this.customError
        }
        if (!payload?.currentPincode) {
            this.customError.responseMessage = "Please provide pincode";
            throw this.customError
        }
        if (payload?.referralCode && !removeSpace(payload?.referralCode)?.length) {
            this.customError.responseMessage = "Please provide referral code";
            throw this.customError
        }
        return new UserProfileUpdate(payload)

    }

    generateQr(payload: generateQrRequest) {
        if (!payload?.quantity || payload.quantity <= 0) {
            this.customError.responseMessage = "Please provide a valid quantity";
            throw this.customError;
        }

        if (!payload?.skuCode) {
            this.customError.responseMessage = "Please provide a valid SKU code";
            throw this.customError;
        }

        return new generateQrRequest(payload.quantity, payload.skuCode);
    }
    // raiseTicket(payload: TicketPayload, file: Express.Multer.File | null | undefined) {
    //     if (!payload?.ticketId) {
    //         this.customError.responseMessage = "Please provide issue type";
    //         throw this.customError;
    //     }

    //     if (!payload?.description) {
    //         this.customError.responseMessage = "Please provide description";
    //         throw this.customError;
    //     }

    //     if (!file?.buffer) {
    //         this.customError.responseMessage = "Please upload file";
    //         throw this.customError;
    //     }

    //     return new TicketPayload({ ...payload, file })
    // }

    raiseTicket(payload: TicketPayload, file?: Express.Multer.File | null) {
        if (!payload.ticketId) {
            this.customError.responseMessage = "Please provide issue type";
            throw this.customError;
        }

        if (!payload.description) {
            this.customError.responseMessage = "Please provide description";
            throw this.customError;
        }

        // if (!file?.buffer) {
        //     this.customError.responseMessage = "Please upload file";
        //     throw this.customError;
        // }

        return new TicketPayload({
            ticketId: payload.ticketId,
            description: payload.description,
            userId: payload.userId,  // optional (only included if present)
            file,
            fileUrl: payload.fileUrl
        });
    }


    getAccountDetails(payload: any) {
        if (!payload?.type) {
            this.customError.responseMessage =
                "Please provide account details type";
            throw this.customError;
        }

        if (!["upi", "bank", "both"].includes(payload.type)) {
            this.customError.responseMessage =
                "Invalid type";
            throw this.customError;
        }
        return payload;
    }


    productScanBulkValidator(payload: any) {
        if (!payload?.items || !Array.isArray(payload.items)) {
            this.customError.responseMessage = "Invalid request: items[] is required";
            throw this.customError;
        }

        const validatedItems: { userCode: string; payload: ProductScan }[] = [];

        for (const item of payload.items) {
            const { userCode, payload: scanPayload } = item;

            if (!userCode || typeof userCode !== "string") {
                this.customError.responseMessage = "Each item must contain valid userCode";
                throw this.customError;
            }

            if (!scanPayload?.qr) {
                this.customError.responseMessage = `QR missing for user ${userCode}`;
                throw this.customError;
            }

            // We do NOT validate KYC/blockStatus here
            // Because we don't have userDetails yet
            // That is validated per-user inside repository

            validatedItems.push({
                userCode,
                payload: new ProductScan(scanPayload)
            });
        }

        return { items: validatedItems };
    }


    productScan(payload: ProductScan, userDetails: UserDetails) {
        if (!payload?.qr) {
            this.customError.responseMessage = "Please provide product QR details";
            throw this.customError;
        }
        if (
            userDetails?.blockStatus == "digilocker" ||
            userDetails?.blockStatus == "kyc" ||
            userDetails?.blockStatus == "incomplete-registration"
        ) {
            this.customError.responseMessage = "Please complete your KYC";
            throw this.customError
        }
        if (
            userDetails?.blockStatus == "kyc-admin"
        ) {
            this.customError.responseMessage = "Your KYC is in pending, you can resume your scan once admin aprroves the KYC";
            throw this.customError
        }
        if (
            userDetails?.blockStatus == "scan"
        ) {
            this.customError.responseMessage = "Your account has been blocked for scanning";
            throw this.customError
        }

        return new ProductScan(payload);
    }

    updateKycStatus(payload: UpdateKycStatus[]) {
        if (!payload || !Array.isArray(payload) || payload.length === 0) {
            this.customError.responseMessage = "Please provide KYC update details";
            throw this.customError;
        }

        for (const item of payload) {
            if (!item.userId) {
                this.customError.responseMessage = "User ID is missing in KYC payload";
                throw this.customError;
            }

            if (item.kycStatus === undefined || item.kycStatus === null) {
                this.customError.responseMessage = "KYC status is missing in KYC payload";
                throw this.customError;
            }

            if (item.comment === undefined || item.comment === null) {
                this.customError.responseMessage = "Comment is missing in KYC payload";
                throw this.customError;
            }
        }

        // Return DTOs
        return payload.map(p => new UpdateKycStatus(p));
    }

    assignTicket(payload: assignTicket[]) {
        if (!payload || !Array.isArray(payload) || payload.length === 0) {
            this.customError.responseMessage = "Please provide ticket assignment details";
            throw this.customError;
        }

        for (const item of payload) {
            if (!item.roleId) {
                this.customError.responseMessage = "Role ID is missing in ticket payload";
                throw this.customError;
            }

            if (!item.ticketId) {
                this.customError.responseMessage = "Ticket ID is missing in ticket payload";
                throw this.customError;
            }
        }

        // Return DTOs
        return payload.map(p => new assignTicket(p));
    }

    resolveTicket(payload: resolveTicket[]) {
        if (!payload || !Array.isArray(payload) || payload.length === 0) {
            this.customError.responseMessage = "Please provide ticket assignment details";
            throw this.customError;
        }

        for (const item of payload) {
            if (!item.ticketId) {
                this.customError.responseMessage = "Ticket ID is missing in ticket payload";
                throw this.customError;
            }
            if (!item.resolvedComments) {
                this.customError.responseMessage = "resolvedComments is missing in ticket payload";
                throw this.customError;
            }
        }

        // Return DTOs
        return payload.map(p => new resolveTicket(p));
    }

    referralHistory(payload: ReferralHistoryPayload) {
        return new ReferralHistoryPayload(payload);
    }

    getPassbook(payload: PassbookHistoryPayload) {
        if (payload?.fromDate && isValidDate(payload?.fromDate)) {
            this.customError.responseMessage = "Invalid From Date";
            throw this.customError;
        }

        if (payload?.toDate && isValidDate(payload?.toDate)) {
            this.customError.responseMessage = "Invalid To Date";
            throw this.customError;
        }

        this.paginationValidators(payload);

        return new PassbookHistoryPayload(payload);
    }

    paginationValidators(payload: any) {
        if (payload.skip && !Number(payload.skip)) {
            this.customError.responseMessage = "Please provide valid lower limit";
            throw this.customError;
        }

        if (payload.limit && !Number(payload.limit)) {
            this.customError.responseMessage = "Please provide valid upper limit";
            throw this.customError;
        }
    }

    amazonProductSearchValidator(payload: MarketProductFilter) {
        this.paginationValidators(payload);

        if (payload?.minPrice && isNaN(Number(payload.minPrice))) {
            this.customError.responseMessage = "Invalid minPrice";
            throw this.customError;
        }

        if (payload?.maxPrice && isNaN(Number(payload.maxPrice))) {
            this.customError.responseMessage = "Invalid maxPrice";
            throw this.customError;
        }

        if (payload?.categoryId && isNaN(Number(payload.categoryId))) {
            this.customError.responseMessage = "Invalid categoryId";
            throw this.customError;
        }

        if (payload?.subCategoryId && isNaN(Number(payload.subCategoryId))) {
            this.customError.responseMessage = "Invalid subCategoryId";
            throw this.customError;
        }

        return new MarketProductFilter(payload);
    }

    addToCartValidator(payload: any) {
        if (!payload?.productId) {
            this.customError.responseMessage = "Please provide productId";
            throw this.customError;
        }
        if (isNaN(Number(payload.productId))) {
            this.customError.responseMessage = "Invalid productId";
            throw this.customError;
        }

        const quantity = payload?.quantity ? Number(payload.quantity) : 1;
        if (isNaN(quantity) || quantity < 1) {
            this.customError.responseMessage = "Invalid quantity";
            throw this.customError;
        }

        return new AddToCartPayload({ productId: Number(payload.productId), quantity });
    }

    addToWishlistValidator(payload: any) {
        if (!payload?.productId) {
            this.customError.responseMessage = "Please provide productId";
            throw this.customError;
        }
        if (isNaN(Number(payload.productId))) {
            this.customError.responseMessage = "Invalid productId";
            throw this.customError;
        }

        return new AddToWishlistPayload({ productId: Number(payload.productId) });
    }

    cartViewValidator(payload: any) {
        this.paginationValidators(payload)
        return new ViewCartFilter(payload);
    }

    wishlistViewValidator(payload: any) {
        this.paginationValidators(payload)
        return new ViewWishlistFilter(payload);
    }

    setPinValidator(payload: any) {
        if (!payload.pin) {
            this.customError.responseMessage = "Please provide PIN";
            throw this.customError;
        }

        if (!/^\d{6}$/.test(payload.pin)) {
            this.customError.responseMessage = "PIN must be a 6-digit number";
            throw this.customError;
        }
        return new SetPinRequest(payload);
    }

    verifyPinValidator(payload: any) {
        if (!payload.pin) {
            this.customError.responseMessage = "Please provide PIN";
            throw this.customError;
        }

        if (!/^\d{6}$/.test(payload.pin)) {
            this.customError.responseMessage = "PIN must be a 6-digit number";
            throw this.customError;
        }
        return new VerifyPinRequest(payload);
    }

    addMarketProductValidator(payload: any) {
        if (!Array.isArray(payload)) {
            this.customError.responseMessage = "Payload must be an array of products";
            throw this.customError;
        }
        if (payload.length === 0) {
            this.customError.responseMessage = "Payload cannot be empty";
            throw this.customError;
        }

        return this.productListValidator(payload);
    }

    productListValidator(payload: AddMarketProduct[]) {
        const productList = payload.map((product, index) => {
            if (!product.amazonAsinSku) {
                this.customError.responseMessage = `Product at index ${index + 1}: ASIN/SKU is required`;
                throw this.customError;
            }
            if (!product.amazonProductName) {
                this.customError.responseMessage = `Product at index ${index + 1}: Product Name is required`;
                throw this.customError;
            }

            if (product.amazonMrp === undefined || product.amazonMrp === null || isNaN(Number(product.amazonMrp))) {
                this.customError.responseMessage = `Product at index ${index + 1}: Valid MRP is required`;
                throw this.customError;
            }

            if (product.amazonDiscountedPrice === undefined || product.amazonDiscountedPrice === null || isNaN(Number(product.amazonDiscountedPrice))) {
                this.customError.responseMessage = `Product at index ${index + 1}: Valid Discounted Price is required`;
                throw this.customError;
            }

            if (product.amazonPoints === undefined || product.amazonPoints === null || isNaN(Number(product.amazonPoints))) {
                this.customError.responseMessage = `Product at index ${index + 1}: Valid Points is required`;
                throw this.customError;
            }

            // if (product.amazonInventoryCount === undefined || product.amazonInventoryCount === null || isNaN(Number(product.amazonInventoryCount))) {
            //     this.customError.responseMessage = `Product at index ${index + 1}: Valid Inventory Count is required`;
            //     throw this.customError;
            // }

            return new AddMarketProduct(product);
        });

        return productList;
    }

    editMarketProductValidator(payload: any) {
        if (!payload?.productId) {
            this.customError.responseMessage = "Please provide productId";
            throw this.customError;
        }

        if (isNaN(Number(payload.productId))) {
            this.customError.responseMessage = "Invalid productId";
            throw this.customError;
        }

        // amazonAsinSku is NOT allowed to be edited, validator doesn't map it anyway in EditMarketProduct constructor if not present or explicit check.
        // Actually EditMarketProduct constructor doesn't include amazonAsinSku.

        return new EditMarketProduct(payload);
    }

    updateDeliveryStatusValidator(payload: any) {
        if (!payload?.redemptionId) {
            this.customError.responseMessage = "Please provide redemptionId";
            throw this.customError;
        }

        if (isNaN(Number(payload.redemptionId))) {
            this.customError.responseMessage = "Invalid redemptionId";
            throw this.customError;
        }

        if (!payload?.status) {
            this.customError.responseMessage = "Please provide status";
            throw this.customError;
        }

        if (!AmazonDeliveryStatusEnum.enumValues.includes(payload.status)) {
            this.customError.responseMessage = "Invalid status";
            throw this.customError;
        }

        return new UpdateDeliveryStatusPayload(payload);
    }

    updateCartValidator(payload: any) {
        if (!payload?.cartId) {
            this.customError.responseMessage = "Please provide cartId";
            throw this.customError;
        }
        if (isNaN(Number(payload.cartId))) {
            this.customError.responseMessage = "Invalid cartId";
            throw this.customError;
        }
        const quantity = payload?.quantity ? Number(payload.quantity) : 0;
        if (isNaN(quantity) || quantity < 1) {
            this.customError.responseMessage = "Invalid quantity";
            throw this.customError;
        }
        return new UpdateCartPayload({ cartId: Number(payload.cartId), quantity });
    }

    deleteCartValidator(payload: any) {
        if (!Array.isArray(payload?.productId)) {
            this.customError.responseMessage = "Please provide cartId";
            throw this.customError;
        }
        const productList = payload?.productId?.map((ele: string) => {
            const convertedNumber = Number(ele);
            if (isNaN(Number(convertedNumber))) {
                this.customError.responseMessage = "Invalid cartId";
                throw this.customError;
            }
            return Number(ele)
        }) as number[]
        return new DeleteCartPayload({ productId: productList });
    }

    deleteWishlistValidator(payload: any) {
        if (!payload?.productId) {
            this.customError.responseMessage = "Please provide product ID";
            throw this.customError;
        }
        if (isNaN(Number(payload.productId))) {
            this.customError.responseMessage = "Invalid wishlistId";
            throw this.customError;
        }
        return new DeleteWishlistPayload({ productId: Number(payload.productId) });
    }

    addOrderValidator(payload: AddOrderPayload, userDetails: UserDetails) {
        if (
            userDetails?.blockStatus == "digilocker" ||
            userDetails?.blockStatus == "kyc" ||
            userDetails?.blockStatus == "incomplete-registration"
        ) {
            this.customError.responseMessage = "Please complete your KYC";
            throw this.customError
        }
        if (
            userDetails?.blockStatus == "kyc-admin"
        ) {
            this.customError.responseMessage = "Your KYC is in pending, you can resume your reward redemption once admin aprroves the KYC";
            throw this.customError
        }
        if (
            userDetails?.blockStatus == "redeem"
        ) {
            this.customError.responseMessage = "Your account has been blocked for reward redemption";
            throw this.customError
        }
        if (!payload?.products || !Array.isArray(payload?.products) || !payload?.products?.length) {
            this.customError.responseMessage = "Please provide products";
            throw this.customError;
        }

        const isInvalid = payload?.products?.filter(ele => !Number(ele?.productId) || !Number(ele?.quantity))?.length;

        if (isInvalid) {
            this.customError.responseMessage = "Please provide valid product ID and Quantity";
            throw this.customError;
        }

        return new AddOrderPayload({
            addressId: payload?.addressId,
            products: payload?.products?.map(ele => new OrderProductPayload(ele)) || []
        });
    }

    orderHistoryValidator(payload: any) {
        if (payload?.fromDate && isValidDate(payload?.fromDate, "yyyy-MM-dd")) {
            this.customError.responseMessage = "Please provide valid From Date (YYYY-MM-DD)";
            throw this.customError;
        }

        if (payload?.toDate && isValidDate(payload?.toDate, "yyyy-MM-dd")) {
            this.customError.responseMessage = "Please provide valid To Date (YYYY-MM-DD)";
            throw this.customError;
        }

        const statusList = payload.status?.filter((ele: string) => !["Pending", "Approved", "Rejected"].includes(ele)) || [];

        if (statusList?.length) {
            this.customError.responseMessage = "Invalid order status";
            throw this.customError;
        }

        if (payload?.userId && isNaN(Number(payload?.userId))) {
            this.customError.responseMessage = "Invalid user ID";
            throw this.customError;
        }

        this.paginationValidators(payload);
        return new ViewOrderFilter(payload);
    }

    addAddressValidator(payload: any) {
        if (!payload?.pincode) {
            this.customError.responseMessage = "Please provide pincode";
            throw this.customError;
        }
        if (validPincode(String(payload.pincode))) {
            this.customError.responseMessage = "Invalid pincode";
            throw this.customError;
        }

        if (!payload?.addressLine1) {
            this.customError.responseMessage = "Please provide addressLine1";
            throw this.customError;
        }

        return new AddAddressPayload(payload);
    }

    viewAddressValidator(payload: any) {
        return new ViewAddressFilter(payload);
    }

    applicationLogin(payload: ApplicationLoginPayload) {
        return new ApplicationLoginPayload(payload);
    }
    registeredUsers(payload: RegisteredUsersPayload) {
        return new RegisteredUsersPayload(payload);
    }

    qrTransaction(payload: QRTransactionPayload) {
        return new QRTransactionPayload(payload);
    }

    adminReferalHistory(payload: AdminReferalHistoryPayload) {
        return new AdminReferalHistoryPayload(payload);
    }

    validateFAQ(payload: any) {
        if (!payload?.faqQuestion) {
            this.customError.responseMessage = "Please provide question";
            throw this.customError;
        }
        if (!payload?.faqAnswer) {
            this.customError.responseMessage = "Please provide answer";
            throw this.customError;
        }

        return { faqQuestion: payload?.faqQuestion, faqAnswer: payload.faqAnswer };
    }

    validateFaqId(payload: string) {
        if (!payload) {
            this.customError.responseMessage = "Please provide faqId";
            throw this.customError;
        }
        if (isNaN(Number(payload))) {
            this.customError.responseMessage = "Invalid faqId";
            throw this.customError;
        }
        return Number(payload);
    }

    validateSurveyQuestion(payload: any) {
        if (!payload?.questionText) {
            this.customError.responseMessage = "Question text is required";
            throw this.customError;
        }
        if (!payload?.answerType) {
            this.customError.responseMessage = "Answer type is required";
            throw this.customError;
        }
        if (!['radio', 'checkbox'].includes(payload.answerType)) {
            this.customError.responseMessage = "Answer type must be 'radio' or 'checkbox'";
            throw this.customError;
        }
        if (!payload?.options || !Array.isArray(payload?.options) || !payload?.options?.length) {
            this.customError.responseMessage = "Please provide options for survey question";
            throw this.customError;
        }

        return {
            questionText: payload.questionText,
            answerType: payload.answerType as 'radio' | 'checkbox',
            options: payload.options || []
        };
    }

    validateQuestionId(payload: any) {
        const questionId = Number(payload);
        if (!questionId) {
            this.customError.responseMessage = "Question ID is required";
            throw this.customError;
        }
        return questionId;
    }

    validateSurveySubmit(payload: any) {
        if (!payload?.answers || !Array.isArray(payload.answers)) {
            this.customError.responseMessage = "Answers array is required";
            throw this.customError;
        }
        return payload.answers as AnswerPayload[];
    }

    validateCategory(payload: any) {
        if (!payload?.categoryName) {
            this.customError.responseMessage = "Category name is required";
            throw this.customError;
        }
        if (!payload?.categoryShortCode) {
            this.customError.responseMessage = "Category short code is required";
            throw this.customError;
        }
        if (String(payload.categoryShortCode).trim().length > 2) {
            this.customError.responseMessage = "Category short code must be at most 2 characters";
            throw this.customError;
        }
        if (!payload?.categoryDescription) {
            this.customError.responseMessage = "Category description is required";
            throw this.customError;
        }
        return {
            categoryName: payload?.categoryName,
            categoryDescription: payload?.categoryDescription,
            categoryShortCode: payload?.categoryShortCode,
            fileUrl: payload?.fileUrl
        };
    }

    validateSubCategory(payload: any) {
        if (!payload?.categoryId || isNaN(Number(payload.categoryId))) {
            this.customError.responseMessage = "Valid category ID is required";
            throw this.customError;
        }
        if (!payload?.subCategoryName) {
            this.customError.responseMessage = "Subcategory name is required";
            throw this.customError;
        }
        return {
            categoryId: Number(payload.categoryId),
            subCategoryName: payload.subCategoryName,
            subCategoryDescription: payload.subCategoryDescription,
            fileUrl: payload.fileUrl
        };
    }

    validateSubCategoryBulk(payload: any) {
        if (!payload?.categoryName) {
            this.customError.responseMessage = "Category name is required";
            throw this.customError;
        }
        if (!payload?.subCategoryName) {
            this.customError.responseMessage = "Subcategory name is required";
            throw this.customError;
        }
        return {
            categoryName: payload.categoryName,
            subCategoryName: payload.subCategoryName,
            subCategoryDescription: payload.subCategoryDescription,
            fileUrl: payload.fileUrl
        };
    }

    validateSku(payload: any) {
        if (!payload?.skuName) {
            this.customError.responseMessage = "SKU name is required";
            throw this.customError;
        }
        if (!payload?.skuCode) {
            this.customError.responseMessage = "SKU code is required";
            throw this.customError;
        }
        if (!payload?.categoryId || isNaN(Number(payload.categoryId))) {
            this.customError.responseMessage = "Valid category ID is required";
            throw this.customError;
        }
        if (!payload?.subCategoryId || isNaN(Number(payload.subCategoryId))) {
            this.customError.responseMessage = "Valid subcategory ID is required";
            throw this.customError;
        }
        return {
            skuName: payload?.skuName,
            skuCode: payload?.skuCode,
            skuDescription: payload?.skuDescription || '',
            productValue: payload?.productValue || "0.00",
            points: payload?.points || "0.00",
            categoryId: Number(payload?.categoryId),
            subCategoryId: Number(payload?.subCategoryId)
        };
    }

    validateSkuBulk(payload: any) {
        if (!payload?.subCategoryName) {
            this.customError.responseMessage = "Subcategory name is required";
            throw this.customError;
        }
        if (!payload?.skuName) {
            this.customError.responseMessage = "SKU name is required";
            throw this.customError;
        }
        if (!payload?.skuCode) {
            this.customError.responseMessage = "SKU code is required";
            throw this.customError;
        }
        return {
            subCategoryName: payload.subCategoryName,
            skuName: payload.skuName,
            skuCode: payload.skuCode,
            skuDescription: payload.skuDescription || '',
            productValue: payload.productValue || "0.00",
            points: payload.points || "0.00",
        };
    }

    validateSkuArray(payload: any) {
        if (!payload || !Array.isArray(payload) || payload.length === 0) {
            this.customError.responseMessage = "SKU data array is required";
            throw this.customError;
        }
        return payload.map(item => this.validateSku(item));
    }

    validateAsset(payload: any) {
        if (payload?.isActive == false) {
            return undefined
        }
        if (!payload?.assetType) {
            this.customError.responseMessage = "Asset type is required";
            throw this.customError;
        }

        return {
            assetType: payload.assetType,
            assetUrl: payload.assetUrl,
            staticAssetUrl: payload.staticAssetUrl,
            assetTitle: payload.assetTitle,
            assetDescription: payload.assetDescription
        };
    }

    validateAssetId(payload: any) {
        const assetId = Number(payload);
        if (!assetId || isNaN(assetId)) {
            this.customError.responseMessage = "Valid Asset ID is required";
            throw this.customError;
        }
        return assetId;
    }
    bankDetailsReport(payload: BankDetailsPayload) {
        return new BankDetailsPayload(payload);
    }

    kycReport(payload: KycReportPayload) {
        return new KycReportPayload(payload);
    }

    productWiseReport(payload: ProductWiseReportPayload) {
        return new ProductWiseReportPayload(payload);
    }

    categoryReport(payload: CategoryReportPayload) {
        return new CategoryReportPayload(payload);
    }

    errorTransactionReport(payload: ErrorTransactionReportPayload) {
        return new ErrorTransactionReportPayload(payload);
    }

    notificationReport(payload: NotificationReportPayload) {
        return new NotificationReportPayload(payload);
    }

    blockedMemberReport(payload: BlockedMemberReportPayload) {
        return new BlockedMemberReportPayload(payload);
    }

    blockedMemberQrScanReport(payload: BlockedMemberQrScanReportPayload) {
        return new BlockedMemberQrScanReportPayload(payload);
    }

    anomalyTransactionsReport(payload: AnomalyTransactionsReportPayload) {
        return new AnomalyTransactionsReportPayload(payload);
    }

    shockReplacementReport(payload: any) {
        this.paginationValidators(payload);
        return new ShockReplacementReportPayload(payload);
    }

    mapRetailerWorkshop(payload: Partial<RetailerWorkshopMapPayload>) {
        const rawPayload = payload as Partial<RetailerWorkshopMapPayload> & {
            retailerId?: unknown;
            workshopID?: unknown;
            purchasingRetailerID?: unknown;
            "workshop id"?: unknown;
        };
        const workshopId = Number(rawPayload?.workshopId ?? rawPayload?.workshopID ?? rawPayload?.["workshop id"]);
        const purchasingRetailerId = Number(
            rawPayload?.purchasingRetailerId ??
            rawPayload?.retailerId ??
            rawPayload?.purchasingRetailerID,
        );

        const validationErrors: Array<{ field: string; message: string }> = [];
        if (!workshopId || Number.isNaN(workshopId) || workshopId < 1) {
            validationErrors.push({
                field: "workshopId",
                message: "workshopId must be a valid positive number",
            });
        }
        if (!purchasingRetailerId || Number.isNaN(purchasingRetailerId) || purchasingRetailerId < 1) {
            validationErrors.push({
                field: "purchasingRetailerId",
                message: "purchasingRetailerId must be a valid positive number",
            });
        }
        if (validationErrors.length) {
            throw new CustomError({
                responseCode: 400,
                statusCode: 400,
                responseMessage: "Validation failed",
                validationErrors,
            });
        }

        return new RetailerWorkshopMapPayload({ workshopId, purchasingRetailerId });
    }

    editRetailerWorkshopMappings(payload: unknown) {
        let items: unknown[] = [];
        if (Array.isArray(payload)) {
            items = payload;
        } else {
            const objectPayload = payload as {
                workshopId?: unknown;
                retailerIds?: unknown[];
                purchasingRetailerId?: unknown;
                retailerId?: unknown;
                isActive?: unknown;
            };
            if (Array.isArray(objectPayload?.retailerIds) && objectPayload.retailerIds.length) {
                items = objectPayload.retailerIds.map((retailerId) => ({
                    workshopId: objectPayload.workshopId,
                    purchasingRetailerId: retailerId,
                    isActive: objectPayload.isActive,
                }));
            } else if (objectPayload && (objectPayload.purchasingRetailerId !== undefined || objectPayload.retailerId !== undefined)) {
                items = [objectPayload];
            }
        }

        if (items.length === 0) {
            throw new CustomError({
                responseCode: 400,
                statusCode: 400,
                responseMessage: "Validation failed",
                validationErrors: [
                    { field: "mappings", message: "Payload must be a non-empty array" },
                ],
            });
        }

        return items.map((item, index) => {
            const mapPayload = this.mapRetailerWorkshop(item as Partial<RetailerWorkshopMapPayload> & { retailerId?: unknown; workshopID?: unknown });
            const rawItem = item as { isActive?: unknown };
            const isActive = rawItem?.isActive === undefined ? true : Boolean(rawItem.isActive);
            if (rawItem?.isActive !== undefined && typeof rawItem.isActive !== "boolean") {
                throw new CustomError({
                    responseCode: 400,
                    statusCode: 400,
                    responseMessage: "Validation failed",
                    validationErrors: [
                        { field: `mappings[${index}].isActive`, message: "isActive must be boolean" },
                    ],
                });
            }
            return new RetailerWorkshopMapActionPayload({
                workshopId: mapPayload.workshopId,
                purchasingRetailerId: mapPayload.purchasingRetailerId,
                isActive,
            });
        });
    }

    retailerWorkshopMappingsQuery(query: Record<string, unknown>) {
        const includeInactiveRaw = query?.includeInactive;
        const includeInactive =
            includeInactiveRaw === "true" ||
            includeInactiveRaw === true ||
            includeInactiveRaw === "1" ||
            includeInactiveRaw === 1;

        const pageRaw = query?.page;
        const limitRaw = query?.limit;
        const page = pageRaw === undefined || pageRaw === null || pageRaw === "" ? 1 : Number(pageRaw);
        const limit = limitRaw === undefined || limitRaw === null || limitRaw === "" ? 10 : Number(limitRaw);
        if (!Number.isInteger(page) || page < 1) {
            this.customError.statusCode = 400;
            this.customError.responseCode = 400;
            this.customError.responseMessage = "page must be greater than or equal to 1";
            throw this.customError;
        }
        if (!Number.isInteger(limit) || limit < 1) {
            this.customError.statusCode = 400;
            this.customError.responseCode = 400;
            this.customError.responseMessage = "limit must be greater than or equal to 1";
            throw this.customError;
        }

        const workshopIdRaw = query?.workshopId;
        let workshopId: number | undefined;
        if (workshopIdRaw !== undefined && workshopIdRaw !== null && workshopIdRaw !== "") {
            const parsedWorkshopId = Number(workshopIdRaw);
            if (!parsedWorkshopId || Number.isNaN(parsedWorkshopId) || parsedWorkshopId < 1) {
                this.customError.statusCode = 400;
                this.customError.responseCode = 400;
                this.customError.responseMessage = "Please provide valid workshop id";
                throw this.customError;
            }
            workshopId = parsedWorkshopId;
        }

        return new RetailerWorkshopMappingsQueryPayload({
            workshopId,
            includeInactive,
            page,
            limit,
        });
    }

    deMapRetailerWorkshop(mappingIdRaw: unknown) {
        const mappingId = Number(mappingIdRaw);
        if (!mappingId || Number.isNaN(mappingId) || mappingId < 1) {
            this.customError.responseMessage = "Please provide valid mapping id";
            throw this.customError;
        }
        return mappingId;
    }

}

export const customValidators = new CustomValidators();
