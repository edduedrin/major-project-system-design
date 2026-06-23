import { UserDetails } from "./";

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

// export class AdminLogin {
//   tokens: LoginTokens;
//   userDetails: AdminDetails;
//   constructor(data: AdminLogin) {
//     this.tokens = new LoginTokens(data?.tokens || {});
//     this.userDetails = new AdminDetails(data?.userDetails || {});
//   }
// }


export class SetNewPassword {
  password: string;
  type: string;
  constructor(data: Partial<SetNewPassword>) {
    this.password = data?.password || ""
    this.type = data?.type || ""
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
    this.passwordRaw = data?.passwordRaw || ""
    this.type = data?.type || ""
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
    this.clientUuid = data?.clientUuid || ""
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

