export class TokenPayload {
    mobile: string;
    userId: number;
    userCode: string;
    email: string;
    userRoleId: string;
    clientUuid: string;
    sessionId: string;
    constructor(data: TokenPayload) {
        this.mobile = data?.mobile || "";
        this.userId = data?.userId;
        this.userCode = data?.userCode || "";
        this.email = data?.email || "";
        this.clientUuid = data?.clientUuid || "";
        this.sessionId = data?.sessionId || "";
        this.userRoleId = data?.userRoleId || "";
    }
}

export class RefreshTokenPayload {
  token: string;
  type: string;
  constructor(data: Partial<RefreshTokenPayload>) {
    this.token = data?.token || "";
    this.type = data?.type || "";
  }
}

export class CustomerTokenPayload {
  customerMobile: string;
  clientUuid: string;
  sessionId: string;
  constructor(data: Partial<CustomerTokenPayload>) {
    this.customerMobile = data?.customerMobile || "";
    this.clientUuid = data?.clientUuid || "";
    this.sessionId = data?.sessionId || "";
  }
}
