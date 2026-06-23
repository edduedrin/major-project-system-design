export class OtpRequest {
  type: string;
  mobile: string;
  constructor(data: Partial<OtpRequest>) {
    this.type = data?.type || "";
    this.mobile = data?.mobile || ""
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
