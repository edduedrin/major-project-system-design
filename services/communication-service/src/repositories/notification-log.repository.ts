import { database } from "../server";
import { notificationLogs } from "../database/schema/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { NotificationType } from "../types";

export class NotificationLogRepository {
  public async create(data: typeof notificationLogs.$inferInsert) {
    const [result] = await database.insert(notificationLogs).values(data).returning();
    return result;
  }

  public async findLogs(filters: {
    recipientId?: string;
    notificationType?: NotificationType;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [];

    if (filters.recipientId) {
      conditions.push(eq(notificationLogs.recipientId, filters.recipientId));
    }
    if (filters.notificationType) {
      conditions.push(eq(notificationLogs.notificationType, filters.notificationType));
    }
    if (filters.status) {
      conditions.push(eq(notificationLogs.status, filters.status));
    }
    if (filters.startDate) {
      conditions.push(gte(notificationLogs.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(notificationLogs.createdAt, filters.endDate));
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    return await database
      .select()
      .from(notificationLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(notificationLogs.createdAt))
      .limit(limit)
      .offset(offset);
  }
}
