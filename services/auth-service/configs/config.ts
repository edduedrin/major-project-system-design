import dotenv from "dotenv";
dotenv.config();

export const TEMP_TOKEN_EXPIRATION = "5m";
export const JWT_SECRET = process.env.JWT_SECRET as string;
export const CUSTOMER_JWT_SECRET = process.env.CUSTOMER_JWT_SECRET as string;
export const ACCESSS_TOKEN_SECRET = process.env.ACCESSS_TOKEN_SECRET as string;
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET as string;

export const ACCESSS_TOKEN_EXPIRY = process.env.ACCESSS_TOKEN_EXPIRY as string;
export const REFRESH_TOKEN_EXPIRY = process.env.REFRESH_TOKEN_EXPIRY as string;
export const CUSTOMER_TOKEN_EXPIRY = process.env.CUSTOMER_TOKEN_EXPIRY as string;
export const ADMIN_ACCESSS_TOKEN_EXPIRY = process.env.ADMIN_ACCESSS_TOKEN_EXPIRY as string;
export const ADMIN_REFRESH_TOKEN_EXPIRY = process.env.ADMIN_REFRESH_TOKEN_EXPIRY as string;

export const FILE_SIZE = 5 * 1024 * 1024;
export const REGISTERATION_BONUS_POINTS = 150;

export const AWS_ACCESS_KEY_ID = process.env.AWS_ACCESS_KEY_ID as string
export const AWS_SECRET_ACCESS_KEY = process.env.AWS_SECRET_ACCESS_KEY as string
export const AWS_BUCKET_NAME = process.env.AWS_BUCKET_NAME as string
export const AWS_REGION = process.env.AWS_REGION as string
export const AWS_SIGNED_URL_EXPIRY = 600

export const TENACIO_BASEURL = process.env.TENACIO_BASEURL as string;
export const TENACIO_CLIENT_ID = process.env.TENACIO_CLIENT_ID as string;
export const TENACIO_X_API_KEY = process.env.TENACIO_X_API_KEY as string;

export const TENACIO_DIGI_INITIATE_WFID = process.env.TENACIO_DIGI_INITIATE_WFID as string;
export const TENACIO_DIGI_FETCH_WFID = process.env.TENACIO_DIGI_FETCH_WFID as string;
export const TENACIO_UPI_FETCH_WFID = process.env.TENACIO_UPI_FETCH_WFID as string;
export const TENACIO_BANK_FETCH__WFID = process.env.TENACIO_BANK_FETCH__WFID as string;
export const TENACIO_BANK_IFSC_FETCH_WFID = process.env.TENACIO_BANK_IFSC_FETCH_WFID as string;
export const TENACIO_ITR_FETCH_WFID = process.env.TENACIO_ITR_FETCH_WFID as string;
export const TENACIO_PAN_BASIC_FETCH_WFID = process.env.TENACIO_PAN_BASIC_FETCH_WFID as string;
export const TENACIO_GST_BASIC_FETCH_WFID = process.env.TENACIO_GST_BASIC_FETCH_WFID as string;

export const QR_PANEL_BASE_URL = process.env.QR_PANEL_BASE_URL as string;
export const QR_PANEL_AUTH_BASE_URL = process.env.QR_PANEL_AUTH_BASE_URL as string;
export const QR_PANEL_TOKEN = process.env.QR_PANEL_TOKEN as string;

export const SMS_API_KEY = process.env.SMS_API_KEY as string;
export const SENDER_ID = process.env.SENDER_ID as string;

export const GODREJ_CRM_TOKEN = process.env.GODREJ_CRM_TOKEN as string;

export const VOUCHER_REDIRECT_BASE_URL = process.env.VOUCHER_REDIRECT_BASE_URL as string;
export const VOUCHER_X_API_KEY = process.env.VOUCHER_X_API_KEY as string;

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID as string;
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL as string;
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY as string;
export const FIREBASE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET as string;

export const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID as string;
export const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET as string;
export const RAZORPAY_ACCOUNT_NUMBER = process.env.RAZORPAY_ACCOUNT_NUMBER as string;
export const RAZORPAY_BASE_URL = process.env.RAZORPAY_BASE_URL as string;
export const RAZORPAY_WEBHOOK_SECRET = process.env.RAZORPAY_WEBHOOK_SECRET as string;
export const RAZORPAY_TIMEOUT = 30000;