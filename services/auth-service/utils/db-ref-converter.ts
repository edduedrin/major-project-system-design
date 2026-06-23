import { genderEnum } from "../schemas/user-model";
import { CustomError, UserDetails } from "../types";
import { BLOCK_ID, REDEMPTION_ID, REDEMPTION_STATUS, ROLES } from "./constant";
import { removeSpace } from "./regex";

// export const parseTranStatusId = (str: string): number => {
//   let strId: number = 1;
//   switch (str) {
//     case "approved":
//       strId = 1;
//       break;
//     case "failed":
//       strId = 0;
//     default:
//       strId = 1;
//   }
//   throw new CustomError({
//     responseCode: 400,
//     responseMessage: "Invalid transaction status",
//   });
// };

// export const parseBlockStatusId = (str: string): number => {
//   let strId: number = 1;
//   switch (str) {
//     case "none":
//       strId = BLOCK_ID.none;
//       break;
//     case "login":
//       strId = BLOCK_ID.login;
//       break;
//     case "scan":
//       strId = BLOCK_ID.scan;
//       break;
//     case "redemption":
//       strId = BLOCK_ID.redeem;
//     default:
//       throw new CustomError({
//         responseCode: 400,
//         responseMessage: "Invalid Block status",
//       });
//   }
//   return strId;
// };

// export const parseRedemptionModeId = (str: string): number => {
//   let strId: number = 1;
//   switch (str) {
//     case "upi":
//       strId = REDEMPTION_ID.upi;
//       break;
//     case "bank-transfer":
//       strId = REDEMPTION_ID.bankTransfer;
//       break;
//     case "credit-note":
//       strId = REDEMPTION_ID.creditNote;
//     default:
//       throw new CustomError({
//         responseCode: 400,
//         responseMessage: "Invalid redemption type",
//       });
//   }
//   return strId;
// };

// export const parseRedemptionStatusId = (str: string): number => {
//   let strId: number = 1;
//   switch (str) {
//     case "approved":
//       strId = REDEMPTION_STATUS.approved;
//       break;
//     case "rejected":
//       strId = REDEMPTION_STATUS.rejected;
//       break;
//     case "pending":
//       strId = REDEMPTION_STATUS.pending;
//     default:
//       throw new CustomError({
//         responseCode: 400,
//         responseMessage: "Invalid redemption type",
//       });
//   }
//   return strId;
// };

// export const checkAdmin = (userDetails: UserDetails): boolean => {
//     let adminFlag = false;
//     if (
//         [
//             SUB_ROLES.clientAdmin,
//             SUB_ROLES.evolveAdmin,
//             SUB_ROLES.financeAdmin,
//         ].includes(Number(userDetails.userSubRoleId) || 0)
//     ) {
//         adminFlag = true;
//     }
//     return adminFlag;
// }

export const checkAdmin = (roleId: number): boolean => {
    let adminFlag = false;
    if (
      [
        ROLES.MARKETING_MANAGER,ROLES.REGION_MANAGER
      ].includes(Number(roleId) || 0)
    ) {
      adminFlag = true;
    }
    return adminFlag;
}

export const genderEnumConversion = (str: string | null) => {
    if (!str) return null
    if (removeSpace(str)?.toLowerCase() == "male") {
        return "Male"
    } else if (removeSpace(str)?.toLowerCase() == "female") {
        return "Female"
    } else if (removeSpace(str)?.toLowerCase()?.includes('other')) {
        return 'Others'
    } else {
        return null
    }
}