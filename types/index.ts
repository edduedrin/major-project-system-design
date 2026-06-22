declare module "express-serve-static-core" {
  interface Request {
    user: UserSearch;
    userDetails: UserDetails;
    metaData: any;
  }
}

export class CustomError extends Error {
  statusCode: number;
  responseCode: number;
  responseMessage: string;
  validationErrors?: Array<{ field: string; message: string }>;
  constructor(data: Partial<CustomError>) {
    super(data?.responseMessage);
    this.statusCode = data?.statusCode || 200;
    this.responseCode = data?.responseCode || 500;
    this.responseMessage = data?.responseMessage || "Something went wrong, please try again";
    this.validationErrors = data?.validationErrors;
  }
}

export class CompareHash {
  originalValue: string;
  hashedValue: string;
  constructor(data: CompareHash) {
    this.originalValue = data?.originalValue || "";
    this.hashedValue = data?.hashedValue || "";
  }
}

export class ParseDate {
  date: string = "";
  format?: string;
  start?: boolean;
  end?: boolean;
}

export class OtpSms {
  mobile: string;
  otp: string;
  constructor(data: OtpSms) {
    this.mobile = data?.mobile as string;
    this.otp = data?.otp as string;
  }
}

export class OtpInsert {
  otp: string;
  createdAt: Date;
  expiryAt: Date;
  userMobile: string;
  constructor(data: OtpInsert) {
    this.otp = data?.otp as string;
    this.createdAt = data?.createdAt as Date;
    this.expiryAt = data?.expiryAt as Date;
    this.userMobile = data?.userMobile as string;
  }
}

export class OtpRequest {
  type: string;
  mobile: string;
  constructor(data: Partial<OtpRequest>) {
    this.type = data?.type || "";
    this.mobile = data?.mobile || "";
  }
}

export interface RegisterOtpPayload {
  mobile: string;
  otpCode: string;
  expiresAt: Date;
  isUsed?: boolean;
}

export class VerifyOtpRequest {
  type: string;
  mobile: string;
  otp: string;
  constructor(data: VerifyOtpRequest) {
    this.type = data?.type || "";
    this.mobile = data?.mobile || "";
    this.otp = data.otp || "";
  }
}

export class registerUserPayload {
  userName: string;
  userEmail: string;
  displayName: string;
  userPassword: string;
  userMobile: string;
  userRole: number;
  createdBy?: number;
  updatedBy?: number;
  fcmToken?: string;
  constructor(payload: {
    userName: string;
    userEmail: string;
    displayName: string;
    userPassword: string;
    userMobile: string;
    userRole: number;
    createdBy?: number;
    updatedBy?: number;
    fcmToken?: string;
  }) {
    this.userName = payload.userName.trim();
    this.userEmail = payload.userEmail.trim().toLowerCase();
    this.displayName = payload.displayName.trim();
    this.userPassword = payload.userPassword;
    this.userMobile = payload.userMobile.trim();
    this.userRole = payload.userRole;
    this.createdBy = payload.createdBy;
    this.updatedBy = payload.updatedBy;
    this.fcmToken = payload?.fcmToken;
  }
}

export class userSignInPayload {
  mobile: string;
  email: string;
  password: string;
  fcmToken: string;
  constructor(data: { mobile?: string; email?: string; password?: string, fcmToken?: string }) {
    this.mobile = data?.mobile?.trim() || "";
    this.email = data?.email?.trim() || "";
    this.password = data?.password?.trim() || "";
    this.fcmToken = data?.fcmToken || "";
    if (!this.password) {
      throw new Error("Password is required");
    }
    if (!this.mobile && !this.email) {
      throw new Error("Either mobile or email must be provided");
    }
  }
}

export class PointSummary {
  earnedPoints: string;
  redeemedPoints: string;
  balancePoints: string;
  scannedPoints: string;
  bonusPoints: string;
  tdsKitty: string;
  pointConversion: string;
  tdsDeducted: string;
  redeemablePoints: string;
  constructor(data: any = {}) {
    this.earnedPoints = String(Number(data?.earnedPoints) || "0");
    this.redeemedPoints = String(Number(data?.redeemedPoints) || "0");
    this.balancePoints = String(Number(data?.balancePoints) || "0");
    this.scannedPoints = String(Number(data?.bonusPoints) || "0");
    this.bonusPoints = String(Number(data?.bonusPoints) || "0");
    this.tdsKitty = String(Number(data?.tdsKitty) || "0");
    this.pointConversion = String(Number(data?.pointConversion) || "0");
    this.tdsDeducted = String(Number(data?.tdsDeducted) || "0");
    this.redeemablePoints = String(Number(data?.redeemablePoints) || "0");
  }
}

export class AddressDetails {
  currentAddress: string;
  currentCity: string;
  currentDistrict: string;
  currentPincode: number;
  currentState: string;
  workshopAddress: string;
  constructor(data: any = {}) {
    this.currentAddress = data?.currentAddress || "";
    this.currentCity = data?.currentCity || "";
    this.currentDistrict = data?.currentDistrict || "";
    this.currentPincode = data?.currentPincode || 0;
    this.currentState = data?.currentState || "";
    this.workshopAddress = data?.workshopAddress || "";
  }
}

export class UserDetails {
  userId: number;
  userName: string;
  userCode: string;
  userEmail: string;
  displayName: string;
  userMobile: string;
  userRoleId: string;
  userSubRoleId: string;
  userRole: string;
  roleName: string;
  userSubRole: string;
  blockStatus: string;
  gender: string;
  age: string;
  dob: string;
  workshopName: string;
  workshopId: number;
  workshopAddress: string;
  aadhaarNumber: string;
  profileUrl: string;
  aadhaarProfileUrl: string;
  aadhaarFrontUrl: string;
  aadhaarBackUrl: string;
  panUrl: string;
  panNumber: string;
  tdsSlabs: string;
  kycApproval: boolean;
  tdsAadhaarVerification: boolean;
  tdsPanVerification: boolean;
  tdsITRVerification: string;
  tdsConsent: boolean;
  tier: string;
  notificationCount: string;
  pointSummary: PointSummary;
  addressDetails: AddressDetails;
  lastLoginAt: string = "";
  lastLogoutAt: string = "";
  fcmToken: string = "";
  createdAt: string = "";
  createdBy: string = "";
  updatedAt: string = "";
  updatedBy: string = "";
  language: string = "";
  referralCode: string = "";
  isPinSet: boolean = false;
  isShockReplacement: boolean = false;

  constructor(data: any) {
    this.userId = data?.userId || 0;
    this.userName = data?.userName || "";
    this.userCode = data?.userCode || "";
    this.userEmail = data?.userEmail || "";
    this.displayName = data?.displayName || "";
    this.userMobile = data?.userMobile || "";
    this.userRoleId = data?.userRoleId?.toString() || "";
    this.userSubRoleId = data?.userSubRoleId?.toString() || "";
    this.userRole = data?.userRole || "";
    this.roleName = data?.userRole || "";
    this.userSubRole = data?.subRoleName || "";
    this.blockStatus = data?.blockStatus || "";
    this.gender = data?.gender || "";
    this.age = String(data?.age) || "";
    this.dob = data?.dob || "";
    this.lastLoginAt = data?.lastLoginAt || "";
    this.lastLogoutAt = data?.lastLogoutAt || "";
    this.fcmToken = data?.fcmToken || "";
    this.workshopName = data?.workshopName || "";
    this.workshopId = Number(data?.workshopId || 0) || 0;
    this.workshopAddress = data?.workshopAddress || "";
    this.aadhaarNumber = data?.aadhaarNumber || "";
    this.aadhaarProfileUrl = data?.aadhaarProfileUrl || "";
    this.profileUrl = data?.profileUrl || "";
    this.aadhaarFrontUrl = data?.aadhaarFrontUrl || "";
    this.aadhaarBackUrl = data?.aadhaarBackUrl || "";
    this.panUrl = data?.panUrl || "";
    this.panNumber = data?.panNumber || "";
    this.isPinSet = data?.isPinSet || false;
    this.tdsSlabs = String(Number(data?.tdsSlabs || "20"));
    this.tdsConsent = data?.tdsConsent || false;
    this.tier = data?.tier || "";
    this.notificationCount = data?.notificationCount || "";
    this.referralCode = data?.referralCode || "";
    this.kycApproval = data?.kycApproval || false;
    this.tdsAadhaarVerification = data?.tdsAadhaarVerification || "";
    this.tdsPanVerification = data?.tdsPanVerification || "";
    this.tdsITRVerification = data?.tdsITRVerification || "";
    this.pointSummary = new PointSummary(data || {});
    this.addressDetails = new AddressDetails(data || {});
    this.isShockReplacement = data?.isShockReplacement || false;
  }
}

export class UserSearch {
  mobile: string;
  email: string;
  userId: number;
  userCode: string;
  constructor(data: UserSearch) {
    this.mobile = data?.mobile || "";
    this.email = data?.email || "";
    this.userId = data?.userId || 0;
    this.userCode = data?.userCode || "";
  }
}

export class LoginTokens {
  accessToken: string;
  refreshToken: string;
  constructor(data: LoginTokens) {
    this.accessToken = data?.accessToken || "";
    this.refreshToken = data?.refreshToken || "";
  }
}

export class UserLogin {
  tokens: LoginTokens;
  userDetails: UserDetails;
  constructor(data: UserLogin) {
    this.tokens = new LoginTokens(data?.tokens || {});
    this.userDetails = new UserDetails(data?.userDetails || {});
  }
}

export class SetNewPassword {
  password: string;
  type: string;
  constructor(data: Partial<SetNewPassword>) {
    this.password = data?.password || "";
    this.type = data?.type || "";
  }
}

export class ResetPassword {
  mobile: string;
  password: string;
  passwordRaw: string;
  type: string;
  constructor(data: ResetPassword) {
    this.mobile = data?.mobile || "";
    this.password = data?.password || "";
    this.passwordRaw = data?.passwordRaw || "";
    this.type = data?.type || "";
  }
}

export class VerifyUserRequest {
  type: string;
  mobile: string;
  otp: string;
  password: string;
  email: string;
  clientUuid: string;
  constructor(data: VerifyUserRequest) {
    this.type = data?.type || "";
    this.mobile = data?.mobile || "";
    this.otp = data.otp || "";
    this.password = data?.password || "";
    this.email = data?.email || "";
    this.clientUuid = data?.clientUuid || "";
  }
}

export class SetPinRequest {
  pin: string;
  constructor(data: SetPinRequest) {
    this.pin = data?.pin || "";
  }
}

export class VerifyPinRequest {
  pin: string;
  constructor(data: VerifyPinRequest) {
    this.pin = data?.pin || "";
  }
}
