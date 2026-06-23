import { database } from "../server"; // your drizzle instance
import { eq, sql, inArray, and, gte, lte, ilike } from "drizzle-orm";
import { CustomError, InsertQrIntoDbRequest, InventoryBatch as InventoryBatchType } from "../types";
import { InventoryBatch } from "../schemas";

class InventoryBatchRepository {
    customError: CustomError;

    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    async bulkInsert(payload: InsertQrIntoDbRequest): Promise<number> {
        try {
            const serialArray = `'{${payload.qrData.map(sn => `"${sn}"`).join(',')}}'::text[]`;

            const result = await database.execute(sql`
                SELECT insert_inventory_batch(
                    ${payload.skuCode},
                    ${payload.quantity},
                    ${payload.createdBy},
                    ${sql.raw(serialArray)}
                ) AS batch_id;
            `);

            const batchId = result.rows?.[0]?.batch_id as number;
            if (!batchId) {
                this.customError.responseMessage = "Failed to insert inventory batch.";
                throw this.customError;
            }

            return batchId;
        } catch (error: any) {
            this.customError.responseMessage = error.message || "Unexpected error during bulkInsert.";
            throw this.customError;
        }
    }
    async updateFieldByBatchId(batchId: number, fieldName: string, value: any): Promise<void> {
        try {
            const result = await database.execute(sql`
            UPDATE ${InventoryBatch}
            SET ${sql.identifier(fieldName)} = ${value}
            WHERE batch_id = ${batchId};
        `);

            if (result.rowCount === 0) {
                this.customError.responseMessage = "No rows updated. Invalid batchId or field.";
                throw this.customError;
            }
        } catch (error: any) {
            console.log("Error updating field:", error);
            this.customError.responseMessage = error.message || "Error updating field.";
            throw this.customError;
        }
    }
    async fetchBatchById(batchId: number): Promise<InventoryBatchType> {
        try {
            const result = await database
                .select()
                .from(InventoryBatch)
                .where(eq(InventoryBatch.batchId, batchId));

            if (result.length === 0) {
                this.customError.responseMessage = "Batch not found for the given batchId.";
                throw this.customError;
            }

            return result[0]; // assuming batchId is unique
        } catch (error: any) {
            this.customError.responseMessage = error.message || "Error fetching batch by ID.";
            throw this.customError;
        }
    }
    async fetchAllBatches(filters?: any): Promise<any> {
        try {
            const conditions = [];

            if (filters?.skuCode) {
                conditions.push(ilike(InventoryBatch.skuCode, `%${filters.skuCode}%`));
            }
            if (filters?.fromDate) {
                conditions.push(gte(InventoryBatch.createdAt, new Date(filters.fromDate)));
            }
            if (filters?.toDate) {
                let toDate = new Date(filters.toDate);
                toDate.setHours(23, 59, 59, 999);
                conditions.push(lte(InventoryBatch.createdAt, toDate));
            }

            const page = filters?.page ? parseInt(filters.page, 10) : 1;
            const limit = filters?.limit ? parseInt(filters.limit, 10) : 10;
            const offset = (page - 1) * limit;

            const baseQuery = database.select().from(InventoryBatch);
            const totalQuery = database.select({ count: sql`count(*)` }).from(InventoryBatch);

            if (conditions.length > 0) {
                const whereClause = and(...conditions);
                baseQuery.where(whereClause);
                totalQuery.where(whereClause);
            }

            const totalResult = await totalQuery;
            const total = Number(totalResult[0]?.count || 0);

            const result = await baseQuery
                .limit(limit)
                .offset(offset)
                .orderBy(sql`${InventoryBatch.batchId} DESC`); // order by latest first

            return {
                data: result,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit)
            };
        } catch (error: any) {
            this.customError.responseMessage = error.message || "Error fetching all batches.";
            throw this.customError;
        }
    }

    async getInventoryByBatchId(batchId: number) {
        try {
            const inventory = await database
                .select()
                .from(InventoryBatch)
                .where(eq(InventoryBatch.batchId, batchId))
                .execute();

            if (!inventory || inventory.length === 0) {
                throw new Error("No inventory found for the given batch ID.");
            }

            return inventory;
        } catch (error: any) {
            this.customError.responseMessage = error.message;
            throw this.customError;
        }
    }



}

export const inventoryBatchRepository = new InventoryBatchRepository();
