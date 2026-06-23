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

export class TransactionalSms {
  mobile: string;
  templateName: string;
  var1?: string;
  var2?: string;
  constructor(data: Partial<TransactionalSms>) {
    this.mobile = data?.mobile as string;
    this.templateName = data?.templateName as string;
    this.var1 = data?.var1;
    this.var2 = data?.var2;
  }
}

