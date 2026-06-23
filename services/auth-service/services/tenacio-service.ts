import axios from "axios";
import { TENACIO_BANK_FETCH__WFID, TENACIO_BANK_IFSC_FETCH_WFID, TENACIO_BASEURL, TENACIO_CLIENT_ID, TENACIO_DIGI_FETCH_WFID, TENACIO_DIGI_INITIATE_WFID, TENACIO_GST_BASIC_FETCH_WFID, TENACIO_ITR_FETCH_WFID, TENACIO_PAN_BASIC_FETCH_WFID, TENACIO_UPI_FETCH_WFID, TENACIO_X_API_KEY } from "../configs/config";
import { CustomError, TenacioDigilockerInitiateRes, TenacioGetDigilockerDetailsRes, TenacioGstResponse, TenacioIfscDetailsResponse, TenacioITRComplianceRes, TenacioMobileToBankResponse, TenacioResponse, TenacioUPIByMobileResponse, TenacioPanResponse } from "../types";
import { loggerRepository } from "../repositories";
import { kycAadhaarValidationSample, kycItrValidationSample, kycPanValidationSample } from "../utils/sample-response";

export class TenacioService {
  customError: CustomError;
  baseUrl: string;
  tenacioClientId: string;
  tenacioXApiKey: string;
  constructor() {
    this.customError = new CustomError({
      responseCode: 500,
      responseMessage: "Service unavailable - Tenacio"
    })
    this.baseUrl = TENACIO_BASEURL;
    this.tenacioClientId = TENACIO_CLIENT_ID;
    this.tenacioXApiKey = TENACIO_X_API_KEY;
  }

  async initiateDigilocker() {
    //admin access (later)
    const url = `${this.baseUrl}services/digilocker-generate-url`; // add digilocker initate url
    let payload = {
      input: {
        redirectUrl: "https://tenacio.io",
        consent: true
      }
    }
    const logData = {
      url,
      request: JSON.stringify(payload),
      response: "",
      createdAt: new Date(),
      createdBy: 0,
    };
    try {

      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_DIGI_INITIATE_WFID,
          "Content-Type": "application/json",
        },
      });
      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };
      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioDigilockerInitiateRes({ ...modifiedRes, ...res?.data });
    } catch (e: any) {
      logData.response = JSON.stringify(
        e?.response?.data?.message || e?.message || e
      );
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioDigilockerInitiateRes({
        resCode: e?.response?.data?.serviceStatusCode || 0,
        resMessage: e?.response?.data?.status || "unknown error",
        ...e?.response.data?.data,
      });
    }
  }
  async getDigilockerDetails(sessionId: string) {
    //admin access (later)
    const url = `${this.baseUrl}services/aadhaar-download`; // add digilocker initate url
    let payload = {
      input: {
        sessionToken: sessionId,
        consent: true
      }
    }
    const logData = {
      url,
      request: JSON.stringify(payload),
      response: "",
      createdAt: new Date(),
      createdBy: 0,
    };
    try {

      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_DIGI_FETCH_WFID,
          "Content-Type": "application/json",
        },
      });

      // const res = kycAadhaarValidationSample //sample response

      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };
      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioGetDigilockerDetailsRes({ ...modifiedRes, ...res?.data });
    } catch (e: any) {

      logData.response = JSON.stringify(
        e?.response?.data?.message || e?.message || e
      );
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioGetDigilockerDetailsRes({
        resCode: e?.response.data?.serviceStatusCode || 0,
        resMessage: e?.response.data?.status || "unknown error",
        ...e?.response.data?.data,
      });
    }
  }

  getUpiIdList = async (mobile: string) => {
    const url = `${this.baseUrl}services/mobile-all-vpa`;
    let payload = {
      input: {
        mobileNumber: mobile,
        consent: true
      }
    };
    const logData = {
      url,
      request: JSON.stringify(payload),
      createdAt: new Date(),
      createdBy: 0,
      response: "",
    };
    try {

      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_UPI_FETCH_WFID,
          "Content-Type": "application/json",
        },
      });
      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };
      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioUPIByMobileResponse({ ...modifiedRes, ...res?.data });
    } catch (e: any) {
      console.log(e?.message || e);
      logData.response = JSON.stringify(
        e?.message || e?.response?.data?.data || e
      );
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioUPIByMobileResponse({
        resCode: e?.response.data?.serviceStatusCode || 0,
        resMessage: e?.response.data?.status || "unknown error",
        ...e?.response.data?.data,
      });
    }
  };

  getBankDetails = async (mobile: string) => {
    //admin access (later)
    const url = `${this.baseUrl}services/mobile-to-bank-ac`;
    let payload = {
      input: {
        mobileNumber: mobile,
        consent: true
      }
    };
    const logData = {
      url,
      request: JSON.stringify(payload),
      response: "",
      createdAt: new Date(),
      createdBy: 0,
    };
    try {

      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_BANK_FETCH__WFID,
          "Content-Type": "application/json",
        },
      });
      const ifscDetails = await this.getBankIfscDetails(res?.data?.data?.ifsc) || null;
      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };
      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioMobileToBankResponse({ ...modifiedRes, ...res?.data, ...ifscDetails?.resData?.data || null });
    } catch (e: any) {
      console.log("cddscdscerror\n", e?.response?.data)

      logData.response = JSON.stringify(
        e?.response?.data?.message || e?.message || e
      );
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioMobileToBankResponse({
        resCode: e?.response.data?.serviceStatusCode || 0,
        resMessage: e?.response.data?.status || "unknown error",
        ...e?.response.data?.data,
      });
    }
  };

  getBankIfscDetails = async (ifscNumber: string) => {
    const url = `${this.baseUrl}services/ifsc-details`;
    let payload = {
      input: {
        ifscNumber: ifscNumber,
        consent: true
      }
    };

    const logData = {
      url,
      request: JSON.stringify(payload),
      response: "",
      createdAt: new Date(),
      createdBy: 0,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_BANK_IFSC_FETCH_WFID,
          "Content-Type": "application/json",
        },
      });

      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };
      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioIfscDetailsResponse({ ...modifiedRes, ...res?.data });

    } catch (e: any) {
      logData.response = JSON.stringify(
        e?.response?.data?.message || e?.message || e
      );
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioIfscDetailsResponse({
        resCode: e?.response.data?.serviceStatusCode || 0,
        resMessage: e?.response.data?.status || "unknown error",
        ...e?.response.data?.data,
      });
    }

  };

  getITRDetails = async (panNumber: string) => {
    const url = `${this.baseUrl}services/itr-compliance-check`;
    let payload = {
      input: {
        panNumber,
        consent: true
      }
    };

    const logData = {
      url,
      request: JSON.stringify(payload),
      response: "",
      createdAt: new Date(),
      createdBy: 0,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_ITR_FETCH_WFID,
          "Content-Type": "application/json",
        },
      });

      // const res:any = kycItrValidationSample; //sample

      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };
      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioITRComplianceRes({ ...modifiedRes, resData: res?.data?.data, ...res?.data,  });

    } catch (e: any) {
      logData.response = JSON.stringify(
        e?.response?.data?.message || e?.message || e
      );
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioITRComplianceRes({
        resCode: e?.response.data?.serviceStatusCode || 0,
        resMessage: e?.response.data?.status || "unknown error",
        ...e?.response.data?.data,
      });
    }

  };

  async panBasicValidation(panNumber: string) {
    const url = `${this.baseUrl}services/pan-basic`;
    const payload = {
      input: {
        panNumber,
        consent: true,
      },
    };

    const logData = {
      url,
      request: JSON.stringify(payload),
      response: "",
      createdAt: new Date(),
      createdBy: 0,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_PAN_BASIC_FETCH_WFID,
          "Content-Type": "application/json",
        },
      });

      // const res = kycPanValidationSample;

      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };

      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);

      return new TenacioPanResponse({ ...modifiedRes, ...res?.data });
    } catch (e: any) {
      logData.response = JSON.stringify(e?.response?.data || e?.message || e);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioPanResponse({
        resCode: e?.response?.data?.serviceStatusCode || 0,
        resMessage: e?.response?.data?.status || "unknown error",
        ...e?.response?.data,
      });
    }
  }

  async gstBasicValidation(gstin: string) {
    const url = `${this.baseUrl}services/gst-basic`;
    const payload = {
      input: {
        gstin,
        consent: true,
      },
    };

    const logData = {
      url,
      request: JSON.stringify(payload),
      response: "",
      createdAt: new Date(),
      createdBy: 0,
    };

    try {
      const res = await axios.post(url, payload, {
        headers: {
          "client-id": this.tenacioClientId,
          "x-api-key": this.tenacioXApiKey,
          "workflow-id": TENACIO_GST_BASIC_FETCH_WFID,
          "Content-Type": "application/json",
        },
      });

      const modifiedRes: TenacioResponse = {
        resCode: res?.data?.serviceStatusCode,
        resMessage: res?.data?.status,
      };

      logData.response = JSON.stringify(res?.data);
      loggerRepository.serviceProviderInsert(logData);

      return new TenacioGstResponse({ ...modifiedRes, ...res?.data });
    } catch (e: any) {
      logData.response = JSON.stringify(e?.response?.data || e?.message || e);
      loggerRepository.serviceProviderInsert(logData);
      return new TenacioGstResponse({
        resCode: e?.response?.data?.serviceStatusCode || 0,
        resMessage: e?.response?.data?.status || "unknown error",
        ...e?.response?.data,
      });
    }
  }
}

export const tenacioService = new TenacioService();