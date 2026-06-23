import { blockLevelEnum } from "../schemas/enum-index"
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
    // Validation: password required
    if (!this.password) {
      throw new Error("Password is required");
    }

    // Validation: either mobile or email required
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
    this.earnedPoints = String(Number(data?.earnedPoints) || "0"); // 0.00 to 0
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

export class BankDetails {
  accountNumber: string;
  accountIfsc: string;
  accountType: string;
  bankName: string;
  bankBranch: string;
  accountHolderName: string;
  upiId: string;
  chequeUrl: string;
  updatedAt: string;

  constructor(data: any = {}) {
    this.accountNumber = data?.accountNumber || "";
    this.accountIfsc = data?.accountIfsc || "";
    this.accountType = data?.accountType || "";
    this.bankName = data?.bankName || "";
    this.bankBranch = data?.bankBranch || "";
    this.accountHolderName = data?.accountHolderName || "";
    this.upiId = data?.upiId || "";
    this.chequeUrl = data?.chequeUrl || "";
    this.updatedAt = data?.updatedAt || "";
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
  userRole: string;
  roleName: string;
  userSubRole: string;
  userRoleId: string;
  userSubRoleId: string;
  blockStatus: typeof blockLevelEnum.enumValues[number];

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
    this.userId = data?.userId || "";
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
    this.userCode = data?.userCode || ""
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
export class LoginTokens {
  accessToken: string;
  refreshToken: string;
  constructor(data: LoginTokens) {
    this.accessToken = data?.accessToken || "";
    this.refreshToken = data?.refreshToken || "";
  }
}

export class RetailerPayload {
  storeName: string;
  retailerName: string;
  mobileNumber: string;
  currentAddress: string;
  currentPincode: number | null;
  stateName: string;
  districtName: string;
  cityName: string;
  gstNumber: string | null;
  constructor(data: Partial<RetailerPayload>) {
    this.storeName = data?.storeName || ""
    this.retailerName = data?.retailerName || ""
    this.mobileNumber = data?.mobileNumber || ""
    this.currentAddress = data?.currentAddress || ""
    this.currentPincode = Number(data?.currentPincode) ? Number(data?.currentPincode) : null
    this.stateName = data?.stateName || ""
    this.districtName = data?.districtName || ""
    this.cityName = data?.cityName || ""
    this.gstNumber = data?.gstNumber || null
  }
}

export class RetailerFilter {
  pincode: number | null;
  retailer: string;
  retailerIds: number[]
  constructor(data: Partial<RetailerFilter>) {
    this.pincode = data?.pincode || null
    this.retailer = data?.retailer || ""
    this.retailerIds = data?.retailerIds || []
  }
}

export class UserProfileUpdate {
  userName: string;
  gender: string;
  age: string;
  currentAddress: string;
  workshopName: string;
  pincode: string;
  district: string;
  workshopAddress: string;
  currentPincode: number | null;
  currentState: string;
  currentCity: string;
  userProfile: string = "";
  referralCode: string = "";
  dob: string = "";
  constructor(data: Partial<UserProfileUpdate>) {
    this.userName = data?.userName || ""
    this.gender = data?.gender || ""
    this.age = data?.age || ""
    this.currentAddress = data?.currentAddress || ""
    this.workshopName = data?.workshopName || ""
    this.pincode = data?.pincode || ""
    this.district = data?.district || ""
    this.workshopAddress = data?.workshopAddress || ""
    this.currentPincode = Number(data?.currentPincode) ? Number(data?.currentPincode) : null
    this.referralCode = data?.referralCode || ""
    this.dob = data?.dob || ""
    this.currentState = data?.currentState || ""
    this.currentCity = data?.currentCity || ""
  }
}


export class assignTicket {
  roleId!: number
  ticketId!: number

  constructor(data: assignTicket) {
    this.roleId = data.roleId
    this.ticketId = data.ticketId
  }
}

export class resolveTicket {
  ticketId: number
  resolvedComments: string

  constructor(data: resolveTicket) {
    this.ticketId = data.ticketId
    this.resolvedComments = data.resolvedComments
  }
}