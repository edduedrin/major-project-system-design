export function validateSerialNumber(serialNumber: string): boolean {
  // Serial number must be alphanumeric and optionally contain hyphens, length 8 to 50
  const serialRegex = /^[A-Z0-9-]{8,50}$/i;
  return serialRegex.test(serialNumber);
}
