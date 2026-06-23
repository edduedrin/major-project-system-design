export class TempApiLog {
  request: string | null = null;
  response: string | null = null;
  url: string | null = null;
  meta: string | null = null;
  token: string | null = null;
  requestAt: Date = new Date();

  constructor(data: Partial<TempApiLog>) {
    Object.assign(this, data);
  }
}

export class ServiceProviderLog {
  url: string | null = null;
  request: string | null = null;
  response: string | null = null;
  createdAt: Date = new Date();
  createdBy: number | null = null;
  constructor(data: Partial<ServiceProviderLog>) {
    Object.assign(this, data);
  }
}
