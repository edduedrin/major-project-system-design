import { database } from "../server"; // your drizzle instance
import { eq, sql, asc, inArray } from "drizzle-orm";
import { CustomError, RandomKeyInput } from "../types";
import { RandomKeysModel } from "../schemas";

interface BulkInsertPayload {
    key: string;
}

class RandomKeysRepository {
    customError: CustomError;

    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: "",
        });
    }

    async bulkInsertWithIgnore(keys: RandomKeyInput[]): Promise<number> {
        const records = keys.map((item) => ({
            randomKey: item.randomKey,
            status: item.status ?? false,
        }));

        const result = await database
            .insert(RandomKeysModel)
            .values(records)
            .onConflictDoNothing()
            .returning();

        return result.length;
    }

    async getFalseStatusCount(): Promise<number> {
        const result = await database
            .select({ count: sql<number>`count(*)` })
            .from(RandomKeysModel)
            .where(eq(RandomKeysModel.status, false));

        return result[0]?.count ?? 0;
    }

    async fetchAvailableKeys(limit: number) {
        return await database.transaction(async (tx) => {
            // Step 1: Select rows with FOR UPDATE lock
            const lockedRows = await tx.execute(sql`
            SELECT * FROM ${sql.identifier("tbl_random_keys")}
            WHERE status = false
            ORDER BY random_key_id
            LIMIT ${limit}
            FOR UPDATE
        `);

            const keys = lockedRows.rows as {
                random_key_id: number;
                random_key: string;
                status: boolean;
                created_at: Date;
            }[];

            const keyIds = keys.map((k) => k.random_key_id);
            const BATCH_SIZE = 500;

            // Step 2: Update in batches using Drizzle query builder

            // for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
            //     const batch = keyIds.slice(i, i + BATCH_SIZE);
            //     await tx
            //         .update(RandomKeysModel)
            //         .set({ status: true })
            //         .where(inArray(sql.identifier("random_key_id"), batch))
            //         .execute();
            // }

            for (let i = 0; i < keyIds.length; i += BATCH_SIZE) {
                const batch = keyIds.slice(i, i + BATCH_SIZE);
                await tx.execute(sql`
                    UPDATE ${sql.identifier("tbl_random_keys")}
                    SET status = true
                    WHERE random_key_id = ANY (${sql.raw(`ARRAY[${batch.join(",")}]::int[]`)})
            `);
            }


            return keys;
        });
    }
}

export const randomKeysRepository = new RandomKeysRepository();