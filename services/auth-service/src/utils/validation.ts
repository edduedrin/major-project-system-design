export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function validateMobile(mobile: string): boolean {
  // Matches 10 to 15 digit phone numbers, optionally starting with +
  const mobileRegex = /^\+?[1-9]\d{9,14}$/;
  return mobileRegex.test(mobile);
}

export function validatePassword(password: string): boolean {
  // Require at least 6 characters
  return typeof password === "string" && password.length >= 6;
}
