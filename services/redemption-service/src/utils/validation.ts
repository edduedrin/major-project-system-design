export function validateRedemptionRequest(data: any): boolean {
  if (!data || typeof data !== "object") return false;
  return true;
}
