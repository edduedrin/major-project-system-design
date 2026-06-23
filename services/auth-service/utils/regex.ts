export const mobileValidate = (str: string) => {
  let pattern = /^[6789]\d{9}$/;
  return !pattern.test(str);
};

export const mailValidation = (str: string) => {
  const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return !pattern.test(str);
};

export const otpValidate = (otp: string): boolean => {
  const pattern = /^\d{4}$/;
  return pattern.test(otp);
};

export const validatePassword = (password: string) => {
  const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_]).{8,}$/;
  return !pattern.test(password);
};

export const isValidAadhaar = (str: string) => {
  const pattern = /^\d{12}$/;
  return !pattern.test(str);
};

export const isValidPan = (str: string) => {
  const pattern = /[A-Z]{5}[0-9]{4}[A-Z]{1}/;
  return !pattern.test(str);
};

export const removeSpace = (str: string) => {
  return String(str).replace(/\s+/g, "");
};

export const validEmail = (email:string) => {
  const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return !regex.test(email);
};

export const validAlphaNumeric = (email:string) => {
  const regex = /^[a-zA-Z0-9 ]*$/;
  return !regex.test(email);
};

export const validPincode = (str:string) => {
  const regex = /^\d{6}$/;
  return !regex.test(str);
};

export const validDigit = (str:string) => {
  const regex = /^\d+$/;
  return !regex.test(str);
};

export const validGst = (str:string) => {
  const regex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return !regex.test(str);
};

export const validPan = (str:string) => {
  const regex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
  return !regex.test(str);
}