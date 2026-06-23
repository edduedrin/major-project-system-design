import {
    CustomError,
    OtpRequest,
    registerUserPayload,
    userSignInPayload,
    VerifyUserRequest,
    SetNewPassword,
    SetPinRequest,
    VerifyPinRequest
} from "../types";

import {
    mobileValidate,
    mailValidation,
    validatePassword,
    otpValidate,
} from "./regex";

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
            this.customError.responseMessage = `Please provide ${!payload.mobile ? "mobile number" : "type"}`;
            throw this.customError;
        }

        if (mobileValidate(payload.mobile)) {
            this.customError.responseMessage = `Please provide valid 10 digit mobile number`;
            throw this.customError;
        }

        if (!["register-user", "forgot-password", "login-otp"].includes(payload.type)) {
            this.customError.responseMessage = `Invalid OTP type`;
            throw this.customError;
        }
    }

    registerUserValidator(payload: registerUserPayload) {
        if (!payload.userRole || !payload.userPassword) {
            this.customError.responseMessage = "All fields (userEmail, userRole, userPassword) are required";
            throw this.customError;
        }

        payload.userPassword = Buffer.from(payload.userPassword, 'base64').toString('utf-8');

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

        return new registerUserPayload({ ...payload, displayName: 'unknown', userName: 'unknown' });
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

        payload.password = payload?.password ? Buffer.from(payload?.password, 'base64').toString('utf-8') : "";

        if (payload.type == "login-password" && (!payload.password || validatePassword(payload?.password))) {
            this.customError.responseMessage = `Please provide a strong password`;
            throw this.customError;
        }

        if (payload.type == "login-otp" && !otpValidate(payload.otp)) {
            this.customError.responseMessage = `Please enter a valid 4-digit OTP.`;
            throw this.customError;
        }

        if ((payload.type == "login-otp" || payload.type == "login-password" || payload.type == "register-warranty") && !payload?.clientUuid) {
            this.customError.responseMessage = `Unauthorized`;
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

        password = password ? Buffer.from(password, 'base64').toString('utf-8') : "";

        if (validatePassword(password)) {
            this.customError.responseMessage = "Please set a strong password";
            throw this.customError;
        }

        return new SetNewPassword({
            password: password,
            type
        });
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
}

export const customValidators = new CustomValidators();