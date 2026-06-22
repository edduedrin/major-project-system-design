import bcrypt from "bcryptjs";
import { CompareHash, CustomError, ParseDate } from "../types";
import crypto from "crypto";
import { differenceInYears, endOfDay, format, isValid, parse, startOfDay } from "date-fns";

export const generateOtp = (): number => {
  return Math.floor(1000 + Math.random() * 9000);
};

export const generateHash = async (value: string): Promise<string> => {
  return await bcrypt.hash(value, 9);
};

export const compareHash = async ({
  hashedValue,
  originalValue,
}: CompareHash): Promise<boolean> => {
  return await bcrypt.compare(originalValue, hashedValue);
};

export const removeUndefinedProperties = (obj: any) => {
  return Object.fromEntries(
    Object.entries(obj).filter(([_, value]) => value !== undefined)
  );
};

export const generateRandomToken = (length = 8) => {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
};

export const isValidDate = (date: string, formatStr: string = "dd-MM-yyyy") => {
  const parsedDate = parse(date, formatStr, new Date());
  return !(isValid(parsedDate) && format(parsedDate, formatStr) === date);
};

export const parseDate = ({
  date,
  format = "dd-MM-yyyy",
  start = false,
  end = false,
}: ParseDate) => {
  if (isValidDate(date, format)) {
    const customError = new CustomError({
      responseCode: 400,
      responseMessage: `Invalid Date: ${date}`,
    });

    throw customError;
  }
  let parsedDate = parse(date, format, new Date());
  if (start) {
    parsedDate = startOfDay(parsedDate);
  }
  if (end) {
    parsedDate = endOfDay(parsedDate);
  }
  return parsedDate;
};

export const getAgeFromDob = (dobStr: string) => {
  if (!dobStr) return null;

  const dob = parse(dobStr, "dd-MM-yyyy", new Date());

  if (!isValid(dob)) return null;

  return differenceInYears(new Date(), dob);
};

export const convertToNumber = (value: any) => {
  if (["string", "number"].includes(typeof value)) return Number(value) || 0;
  else return 0;
};
