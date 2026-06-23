import axios, { AxiosError, AxiosResponse } from "axios";
import { OtpSms } from "../types";
import { SENDER_ID, SMS_API_KEY } from "../configs/config";

class SmsHelper {

  async sendZFOtp(mobile: string, name: string, otp: string) {
    const templateName = 'ZF OTP-1';
    const finalUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${SMS_API_KEY}&to=${mobile}&from=${SENDER_ID}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(name)}&var2=${encodeURIComponent(otp)}`;

    const loggerPayload = {
      url: finalUrl,
      request: finalUrl,
      response: "",
      createdAt: new Date(),
      createdBy: null
    }

    return await axios
      .get(finalUrl)
      .then(async (response: AxiosResponse) => {
        loggerPayload.response = response.data;
        return response.data;
      })
      .catch(async (error: AxiosError) => {
        if (error?.response) {
          loggerPayload.response = JSON.stringify(error?.response?.data);
          throw error.response?.data || new Error("Axios error");
        } else {
          loggerPayload.response = JSON.stringify(error?.response?.data);
          throw error;
        }
      }).finally(() => {
      });
  }

  async sendZFPasswordReset(mobile: string, name: string, otp: string) {
    const templateName = 'ZF Password Reset-1';
    let finalUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${SMS_API_KEY}&to=${mobile}&from=${SENDER_ID}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(name)}&var2=${encodeURIComponent(otp)}`;

    const loggerPayload = {
      url: finalUrl,
      request: finalUrl,
      response: "",
      createdAt: new Date(),
      createdBy: null
    }

    return await axios
      .get(finalUrl)
      .then(async (response: AxiosResponse) => {
        loggerPayload.response = response.data;
        return response.data;
      })
      .catch(async (error: AxiosError) => {
        if (error?.response) {
          loggerPayload.response = JSON.stringify(error?.response?.data);
          throw error.response?.data || new Error("Axios error");
        } else {
          loggerPayload.response = JSON.stringify(error?.response?.data);
          throw error;
        }
      }).finally(() => {
      });
  }

  async sendZFLogin(mobile: string, name: string, otp: string) {
    const templateName = 'ZF Login-1';
    const finalUrl = `https://2factor.in/API/R1/?module=TRANS_SMS&apikey=${SMS_API_KEY}&to=${mobile}&from=${SENDER_ID}&templatename=${encodeURIComponent(templateName)}&var1=${encodeURIComponent(name)}&var2=${encodeURIComponent(otp)}`;

    const loggerPayload = {
      url: finalUrl,
      request: finalUrl,
      response: "",
      createdAt: new Date(),
      createdBy: null
    }

    return await axios
      .get(finalUrl)
      .then(async (response: AxiosResponse) => {
        loggerPayload.response = response.data;
        return response.data;
      })
      .catch(async (error: AxiosError) => {
        if (error?.response) {
          loggerPayload.response = JSON.stringify(error?.response?.data);
          throw error.response?.data || new Error("Axios error");
        } else {
          loggerPayload.response = JSON.stringify(error?.response?.data);
          throw error;
        }
      }).finally(() => {
      });
  }
}



export const smsHelper = new SmsHelper()