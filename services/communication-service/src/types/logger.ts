export interface TempApiLog {
  requestId?: string;
  method?: string;
  url?: string;
  status?: number;
  responseTime?: number;
  ip?: string;
  userAgent?: string;
  body?: any;
  params?: any;
  query?: any;
}
