export class TempApiLog {
  request: string;
  meta: string;
  token?: string;
  url: string;
  response?: string;

  constructor(data: Partial<TempApiLog>) {
    this.request = data.request || '';
    this.meta = data.meta || '';
    this.token = data.token;
    this.url = data.url || '';
    this.response = data.response;
  }
}
