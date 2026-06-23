export class RandomKeyInput {
  randomKey: string;
  status: boolean;

  constructor(data: Partial<RandomKeyInput>) {
    this.randomKey = data?.randomKey || "";
    this.status = data?.status ?? false;
  }
}
