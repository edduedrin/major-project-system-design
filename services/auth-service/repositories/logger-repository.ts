import { ServiceProviderLogModel, TempLogModel } from "../schemas";
import { database } from "../server";
import { ServiceProviderLog, TempApiLog } from "../types";

export class LoggerRepository {
  constructor() { }
  async tempLogs(payload: TempApiLog) {
    await database.insert(TempLogModel).values({
      request: payload.request,
      response: payload.response,
      url: payload.url,
      createdAt: payload.requestAt,
      apiMetaData: payload.meta,
    });
  }

  async serviceProviderInsert(payload: ServiceProviderLog) {
    await database.insert(ServiceProviderLogModel).values(payload);
  }
}

export const loggerRepository = new LoggerRepository();
