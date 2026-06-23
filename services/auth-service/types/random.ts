export class CompareHash {
  originalValue: string;
  hashedValue: string;
  constructor(data: CompareHash) {
    this.originalValue = data?.originalValue || "";
    this.hashedValue = data?.hashedValue || "";
  }
}

export class ParseDate {
  date: string = "";
  format?: string;
  start?: boolean;
  end?: boolean;
}