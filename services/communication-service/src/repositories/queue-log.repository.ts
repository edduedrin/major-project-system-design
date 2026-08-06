import { database } from "../server";
import { queueLogs } from "../database/schema/schema";
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { QueueStatus } from "../types";

export class QueueLogRepository {
  public async create(data: typeof queueLogs.$inferInsert) {
    const [result] = await database.insert(queueLogs).values(data).returning();
    return result;
  }

  public async findById(id: string) {
    const [result] = await database
      .select()
      .from(queueLogs)
      .where(eq(queueLogs.id, id));
    return result || null;
  }

  public async findByEventId(eventId: string) {
    const results = await database
      .select()
      .from(queueLogs)
      .where(eq(queueLogs.eventId, eventId));
    return results;
  }

  public async updateStatus(
    id: string,
    updates: {
      status: QueueStatus;
      retryCount?: number;
      errorMessage?: string;
      completedAt?: Date;
      processingTime?: number;
    }
  ) {
    const [result] = await database
      .update(queueLogs)
      .set(updates)
      .where(eq(queueLogs.id, id))
      .returning();
    return result;
  }

  public async findLogs(filters: {
    status?: string;
    queueName?: string;
    eventId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [];

    if (filters.status) {
      conditions.push(eq(queueLogs.status, filters.status));
    }
    if (filters.queueName) {
      conditions.push(eq(queueLogs.queueName, filters.queueName));
    }
    if (filters.eventId) {
      conditions.push(eq(queueLogs.eventId, filters.eventId));
    }
    if (filters.startDate) {
      conditions.push(gte(queueLogs.createdAt, filters.startDate));
    }
    if (filters.endDate) {
      conditions.push(lte(queueLogs.createdAt, filters.endDate));
    }

    const limit = filters.limit || 50;
    const offset = filters.offset || 0;

    const query = database
      .select()
      .from(queueLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(queueLogs.createdAt))
      .limit(limit)
      .offset(offset);

    return await query;
  }

  public async delete(id: string) {
    const [result] = await database
      .delete(queueLogs)
      .where(eq(queueLogs.id, id))
      .returning();
    return result;
  }
}
