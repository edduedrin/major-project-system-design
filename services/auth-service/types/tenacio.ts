export class TenacioResponse {
  resCode: number;
  resMessage: string;
  constructor(data: any) {
    this.resCode = data?.resCode || 400;
    this.resMessage = data?.resMessage || "Invalid request data";
  }
}

export class TenacioDigilockerInitiateRes extends TenacioResponse {
  resData: TenacioDigilockerInitiateData | null;
  constructor(data: TenacioDigilockerInitiateData) {
    super(data)
    this.resData = data
  }
}

export class TenacioDigilockerInitiateData {
  status?: string;
  requestId?: string;
  type?: string;
  serviceStatusCode?: number;
  data?: {
    url: string;
    sessionToken: string;
  };
  vendorResponse?: {
    statusCode: number;
    name: string;
    sequence: number;
  }[];
}



export class TenacioGetDigilockerDetailsRes extends TenacioResponse {
  resData: DigiLockerKycResponse | null;
  constructor(data: DigiLockerKycResponse) {
    super(data)
    this.resData = data
  }
}



export class DigiLockerKycResponse {
  status?: string;
  requestId?: string;
  type?: string;
  serviceStatusCode?: number;
  data?: DigiLockerKycData;
  vendorResponse?: VendorResponse[];

  constructor(init: DigiLockerKycResponse) {
    Object.assign(this, init);
  }
}

export class DigiLockerKycData {
  dob?: string;
  gender?: string;
  name?: string;
  maritalStatus?: string;
  title?: string;
  swd?: string;
  phone?: string;
  swdIndicator?: string;
  religion?: string;
  email?: string;
  maskedaadhaar?: string;
  photo?: Photo;
  address?: Address;

  constructor(init: DigiLockerKycData) {
    Object.assign(this, init);
  }
}
export class Photo {
  content?: string;
  format?: string;

  constructor(init: Photo) {
    Object.assign(this, init);
  }
}
export class Address {
  co?: string;
  country?: string;
  house?: string;
  loc?: string;
  state?: string;
  vtc?: string;
  pin?: string;
  landmark?: string;
  locality?: string;
  city?: string;
  line1?: string;
  line2?: string;
  type?: string;

  constructor(init: Address) {
    Object.assign(this, init);
  }
}
export class VendorResponse {
  statusCode?: number;
  name?: string;
  sequence?: number;

  constructor(init: VendorResponse) {
    Object.assign(this, init);
  }
}


export class TenacioMobileToBankResponse extends TenacioResponse {
  resData: TenacioMobileToBank | null;
  constructor(data: any) {
    super(data);
    this.resData = data ? new TenacioMobileToBank(data) : null;
  }
}

export class TenacioMobileToBank {
  status: string;
  requestId: string;
  type: string;
  serviceStatusCode: number;
  data: TenacioMobileToBankData;
  vendorResponse: TenacioMobileToBankVendorRes[];
  constructor(data: any) {
    this.status = data?.status || null;
    this.requestId = data?.requestId || null;
    this.type = data?.type || null;
    this.serviceStatusCode = data?.serviceStatusCode || null;
    this.data = new TenacioMobileToBankData(data);
    this.vendorResponse = Array.isArray(data?.vendorResponse)
      ? data.vendorResponse.map(
        (vr: any) => new TenacioMobileToBankVendorRes(vr)
      )
      : [];
  }
}

export class TenacioMobileToBankData {
  refId: string;
  nameAtBank: string;
  amountDeposited: number;
  utr: string;
  pymtModeCode: string;
  vpa: string;
  ifsc: string;
  accountNumber: string;
  ifscDetails: TenacioIfscDetailsData | null;
  constructor(data: any) {
    this.refId = data?.data?.refId || null;
    this.nameAtBank = data?.data?.nameAtBank || null;
    this.amountDeposited = data?.data?.amountDeposited || null;
    this.utr = data?.data?.utr || null;
    this.pymtModeCode = data?.data?.pymtModeCode || null;
    this.vpa = data?.data?.vpa || null;
    this.ifsc = data?.data?.ifsc || null;
    this.accountNumber = data?.data?.accountNumber || null;
    this.ifscDetails = data ? new TenacioIfscDetailsData(data) : null;
  }
}

export class TenacioMobileToBankVendorRes {
  statusCode: number;
  name: string;
  sequence: number;
  constructor(data: any) {
    this.statusCode = data?.statusCode || null;
    this.name = data?.name || null;
    this.sequence = data?.sequence || null;
  }
}

// Tenacio IFSC Details Response

export class TenacioIfscDetailsResponse extends TenacioResponse {
  resData: TenacioIfscDetails | null;
  constructor(data: any) {
    super(data);
    this.resData = data ? new TenacioIfscDetails(data) : null;
  }
}

export class TenacioIfscDetails {
  status: string;
  requestId: string;
  type: string;
  serviceStatusCode: number;
  data: TenacioIfscDetailsData | null;
  vendorResponse: TenacioIfscDetailsVendorRes[];
  serviceError?: TenacioIfscDetailsError | null;
  error?: TenacioIfscValidationError | null;

  constructor(data: any) {
    this.status = data?.status || null;
    this.requestId = data?.requestId || data?.request_id || null;
    this.type = data?.type || null;
    this.serviceStatusCode = data?.serviceStatusCode || null;
    this.data = data?.data ? new TenacioIfscDetailsData(data.data) : null;
    this.vendorResponse = Array.isArray(data?.vendorResponse)
      ? data.vendorResponse.map(
        (vr: any) => new TenacioIfscDetailsVendorRes(vr)
      )
      : [];
    this.serviceError = data?.serviceError
      ? new TenacioIfscDetailsError(data.serviceError)
      : null;
    this.error = data?.error
      ? new TenacioIfscValidationError(data.error)
      : null;
  }
}

export class TenacioIfscDetailsData {
  bankName: string;
  ifsc: string;
  branch: string;
  bankCode: string;
  address: string;
  city: string;
  district: string;
  state: string;
  centre: string;
  contact: string;
  micr: string;
  iso3166: string;
  rtgsAvailable: boolean;
  neftAvailable: boolean;
  impsAvailable: boolean;
  upiAvailable: boolean;
  swift: string;

  constructor(data: any) {
    this.bankName = data?.bankName || null;
    this.ifsc = data?.ifsc || null;
    this.branch = data?.branch || null;
    this.bankCode = data?.bankCode || null;
    this.address = data?.address || null;
    this.city = data?.city || null;
    this.district = data?.district || null;
    this.state = data?.state || null;
    this.centre = data?.centre || null;
    this.contact = data?.contact || null;
    this.micr = data?.micr || null;
    this.iso3166 = data?.iso3166 || null;
    this.rtgsAvailable = data?.rtgsAvailable ?? false;
    this.neftAvailable = data?.neftAvailable ?? false;
    this.impsAvailable = data?.impsAvailable ?? false;
    this.upiAvailable = data?.upiAvailable ?? false;
    this.swift = data?.swift || null;
  }
}

export class TenacioIfscDetailsVendorRes {
  statusCode: number;
  name: string;
  sequence: number;

  constructor(data: any) {
    this.statusCode = data?.statusCode || null;
    this.name = data?.name || null;
    this.sequence = data?.sequence || null;
  }
}

export class TenacioIfscDetailsError {
  message: string;
  details: any;

  constructor(data: any) {
    this.message = data?.message || null;
    this.details = data?.details || {};
  }
}

export class TenacioIfscValidationError {
  message: string;

  constructor(data: any) {
    this.message = data?.message || null;
  }
}


export class UPIByMobileResponse extends TenacioResponse {
  resData: UPIByMobile | null;
  constructor(data: any) {
    super(data);
    this.resData = new UPIByMobile(data);
  }
}

export class UPIByMobile {
  data: UPIByMobileData;
  status_code: number;
  success: boolean;
  message: string;
  message_code: string;
  constructor(data: any) {
    this.data = new UPIByMobileData(data?.data);
    this.status_code = data?.status_code || null;
    this.success = data?.success || null;
    this.message = data?.message || null;
    this.message_code = data?.message_code || null;
  }
}

export class UPIByMobileData {
  client_id: string | null;
  mobile_number: string | null;
  name: string | null;
  upi_id: string[] | null;
  constructor(data: any) {
    this.client_id = data?.client_id || null;
    this.mobile_number = data?.mobile_number || null;
    this.name = data?.name || null;
    this.upi_id = data?.upi_id || null;
  }
}

// Tenacio UPI by Mobile Number Response

export class TenacioUPIByMobileResponse extends TenacioResponse {
  resData: TenacioUPIByMobile | null;

  constructor(data: any) {
    super(data);
    this.resData = new TenacioUPIByMobile(data);
  }
}

export class TenacioUPIByMobile {
  status: string;
  requestId: string;
  type: string;
  serviceStatusCode: number;
  data: TenacioUPIByMobileData;
  vendorResponse: TenacioUPIByMobileVendorRes[];

  constructor(data: any) {
    this.status = data?.status || null;
    this.requestId = data?.requestId || null;
    this.type = data?.type || null;
    this.serviceStatusCode = data?.serviceStatusCode || null;
    this.data = new TenacioUPIByMobileData(data?.data);
    this.vendorResponse = Array.isArray(data?.vendorResponse)
      ? data.vendorResponse.map(
        (vr: any) => new TenacioUPIByMobileVendorRes(vr)
      )
      : [];
  }
}

export class TenacioUPIByMobileData {
  vpa: string[];
  name: string;

  constructor(data: any) {
    this.vpa = Array.isArray(data?.vpa) ? data.vpa : [];
    this.name = data?.name || null;
  }
}

export class TenacioUPIByMobileVendorRes {
  statusCode: number;
  name: string;
  sequence: number;

  constructor(data: any) {
    this.statusCode = data?.statusCode || null;
    this.name = data?.name || null;
    this.sequence = data?.sequence || null;
  }
}

export class TenacioITRComplianceRes extends TenacioResponse {
  resData: TenacioITRComplianceData | null;
  status: string
  requestId: string
  type: string
  serviceStatusCode: number | null;
  constructor(data: TenacioITRComplianceRes) {
    super(data);
    this.resData = data?.resData;
    this.status = data?.status;
    this.requestId = data?.requestId;
    this.type = data?.type;
    this.serviceStatusCode = data?.serviceStatusCode;
  }
}



export class TenacioITRComplianceData {
  panNumber: string;
  maskedName: string;
  panAadhaarLinked: boolean;
  panStatus: string;
  validPan: boolean;
  compliant: boolean;
  specifiedPersonUnder206: string;
  panAllotmentDate: string;
  constructor(data: Partial<TenacioITRComplianceData>) {
    this.panNumber = data?.panNumber || ""
    this.maskedName = data?.maskedName || ""
    this.panAadhaarLinked = data?.panAadhaarLinked || false
    this.panStatus = data?.panStatus || ""
    this.validPan = data?.validPan || false
    this.compliant = data?.compliant || false
    this.specifiedPersonUnder206 = data?.specifiedPersonUnder206 || ""
    this.panAllotmentDate = data?.panAllotmentDate || ""
  }
}

// ------------------
// Tenacio PAN Basic
// ------------------
export class TenacioPanResponse extends TenacioResponse {
  resData: TenacioPanData | null;
  serviceError?: { message?: string; details?: any } | null;
  requestId?: string;
  constructor(data: any) {
    super(data);
    // normalize keys that sometimes come as `request_id`
    this.requestId = data?.requestId || data?.request_id || null;
    this.serviceError = data?.serviceError || data?.error || null;
    this.resData = data?.data ? new TenacioPanData(data?.data) : null;
  }
}

export class TenacioPanData {
  panNumber?: string | null;
  fullName?: string | null;
  category?: string | null;

  constructor(data: any) {
    this.panNumber = data?.panNumber || null;
    this.fullName = data?.fullName || data?.name || null;
    this.category = data?.category || null;
  }
}

export class TenacioGstResponse extends TenacioResponse {
  resData: TenacioGstData | null;
  serviceError?: { message?: string; details?: any } | null;
  requestId?: string;
  constructor(data: any) {
    super(data);
    this.requestId = data?.requestId || data?.request_id || null;
    this.serviceError = data?.serviceError || data?.error || null;
    this.resData = data?.data ? new TenacioGstData(data?.data) : null;
  }
}

export class TenacioGstData {
  gstin?: string | null;
  legalName?: string | null;
  tradeName?: string | null;
  gstStatus?: string | null;
  constitution?: string | null;
  registrationDate?: string | null;

  constructor(data: any) {
    this.gstin = data?.gstin || null;
    this.legalName = data?.legalName || data?.legal_name || null;
    this.tradeName = data?.tradeName || data?.trade_name || null;
    this.gstStatus = data?.gstStatus || data?.status || null;
    this.constitution = data?.constitution || null;
    this.registrationDate = data?.registrationDate || null;
  }
}