import { database } from "../server";
import { CategoryModel, SelectedShockReplacementModel, ShockReplacementSkusModel, SkuMasterModel, SubCategoryModel, UserModel } from "../schemas"; // adjust path if needed
import { eq, desc, asc, ilike, and, inArray, ne, count, or, sql, gte, lt } from "drizzle-orm";
import { InferInsertModel } from "drizzle-orm";
import { CustomError } from "../types";

// Auto-infer correct insert type from table
type NewSku = InferInsertModel<typeof SkuMasterModel>;
type NewCategory = InferInsertModel<typeof CategoryModel>;
type NewSubCategory = InferInsertModel<typeof SubCategoryModel>;

export class SkuRepository {
    /**
     * Create a new SKU entry
     */
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400,
        });
    }

    async createSku(data: NewSku[]) {
        const errors: string[] = [];
        const toInsert: NewSku[] = [];
        const seenCodes = new Set<string>();

        // 1. Filter internal duplicates from the input array
        const records: NewSku[] = [];
        for (const item of data) {
            if (seenCodes.has(item.skuCode)) {
                errors.push(`Duplicate SKU code found in the provided list: ${item.skuCode}`);
            } else {
                seenCodes.add(item.skuCode);
                records.push(item);
            }
        }

        if (records.length === 0) {
            return { created: [], errors };
        }

        // 2. Check DB for existing active SKUs among unique records
        const existingActive = await database
            .select({ skuCode: SkuMasterModel.skuCode })
            .from(SkuMasterModel)
            .where(
                and(
                    inArray(SkuMasterModel.skuCode, Array.from(seenCodes)),
                    eq(SkuMasterModel.isActive, true)
                )
            );

        const activeInDb = new Set(existingActive.map(s => s.skuCode));

        for (const item of records) {
            if (activeInDb.has(item.skuCode)) {
                errors.push(`SKU code "${item.skuCode}" already exists and is active.`);
            } else {
                toInsert.push(item);
            }
        }

        let created: any[] = [];
        if (toInsert.length > 0) {
            created = await database
                .insert(SkuMasterModel)
                .values(toInsert)
                .returning();
        }

        return { created, errors };
    }

    /**
     * Fetch all active SKUs
     */
    async getAllActiveSkus({ page, limit, category, subCategory }: { page: number; limit: number, category: string, subCategory: string }) {
        const offset = (page - 1) * limit;
        const [data, [{ total }]] = await Promise.all([
            database
                .select()
                .from(SkuMasterModel)
                .where(
                    and(
                        eq(SkuMasterModel.isActive, true),
                        Number(category) ? eq(SkuMasterModel.categoryId, Number(category)) : undefined,
                        Number(subCategory) ? eq(SkuMasterModel.subCategoryId, Number(subCategory)) : undefined,
                    )
                )
                .orderBy(asc(SkuMasterModel.skuId))
                .limit(limit)
                .offset(offset),
            database
                .select({ total: count() })
                .from(SkuMasterModel)
                .where(
                    and(
                        eq(SkuMasterModel.isActive, true),
                        Number(category) ? eq(SkuMasterModel.categoryId, Number(category)) : undefined,
                        Number(subCategory) ? eq(SkuMasterModel.subCategoryId, Number(subCategory)) : undefined,
                    )
                ),
        ]);
        return { data, total };
    }

    /**
     * Get SKU by ID
     */
    async getSkuById(skuId: number) {
        const [sku] = await database
            .select()
            .from(SkuMasterModel)
            .where(eq(SkuMasterModel.skuId, skuId))
            .limit(1);

        return sku || null;
    }

    /**
     * Search SKU by name (case-insensitive)
     */
    async searchSkuByName(keyword: string) {
        return database
            .select()
            .from(SkuMasterModel)
            .where(ilike(SkuMasterModel.skuName, `%${keyword}%`))
            .orderBy(desc(SkuMasterModel.createdAt));
    }

    /**
     * Update SKU details
     */
    async updateSku(skuId: number, data: Partial<NewSku>) {
        if (data.skuCode) {
            const [existing] = await database
                .select({ skuId: SkuMasterModel.skuId })
                .from(SkuMasterModel)
                .where(
                    and(
                        eq(SkuMasterModel.skuCode, data.skuCode),
                        eq(SkuMasterModel.isActive, true),
                        ne(SkuMasterModel.skuId, skuId)
                    )
                )
                .limit(1);

            if (existing) {
                this.customError.responseMessage = `SKU code "${data.skuCode}" already exists and is active.`;
                throw this.customError;
            }
        }

        const [updated] = await database
            .update(SkuMasterModel)
            .set(data)
            .where(eq(SkuMasterModel.skuId, skuId))
            .returning();

        return updated || null;
    }

    /**
     * Deactivate SKU (soft delete)
     */
    async deactivateSku(skuId: number) {
        return database
            .update(SkuMasterModel)
            .set({ isActive: false })
            .where(eq(SkuMasterModel.skuId, skuId));
    }

    /**
     * Permanently delete SKU
     */
    async deleteSku(skuId: number) {
        return database
            .delete(SkuMasterModel)
            .where(eq(SkuMasterModel.skuId, skuId));
    }
    async doesSkuExist(skuCode: string): Promise<boolean> {
        try {
            const result = await database
                .select({ skuId: SkuMasterModel.skuId })
                .from(SkuMasterModel)
                .where(eq(SkuMasterModel.skuCode, skuCode))
                .limit(1); // Optimization: fetch only one row

            return result.length > 0;
        } catch (error: any) {
            this.customError.responseMessage = error.message || "Failed to check SKU existence.";
            throw this.customError;
        }
    }
    /**
 * Fetch SKU details with Category & Subcategory details dynamically
 * @param column - The column name to filter (e.g., 'skuId', 'skuCode', 'categoryId', etc.)
 * @param value - The value to match
 */
    async getSkuWithRelationsBy(column: keyof typeof SkuMasterModel['_']['columns'], value: any) {
        try {
            // Ensure column is valid (avoid SQL injection)
            const validColumns = Object.keys(SkuMasterModel);
            if (!validColumns.includes(column)) {
                this.customError.responseMessage = `Invalid column name: ${column}`;
                throw this.customError;
            }

            const [result] = await database
                .select({
                    skuId: SkuMasterModel.skuId,
                    skuName: SkuMasterModel.skuName,
                    skuCode: SkuMasterModel.skuCode,
                    skuDescription: SkuMasterModel.skuDescription,
                    productValue: SkuMasterModel.productValue,
                    points: SkuMasterModel.points,
                    isActive: SkuMasterModel.isActive,
                    createdAt: SkuMasterModel.createdAt,

                    // Subcategory fields
                    subCategoryId: SubCategoryModel.subCategoryId,
                    subCategoryName: SubCategoryModel.subCategoryName,
                    subCategoryDescription: SubCategoryModel.subCategoryDescription,

                    // Category fields
                    categoryId: CategoryModel.categoryId,
                    categoryName: CategoryModel.categoryName,
                    categoryDescription: CategoryModel.categoryDescription,
                    categoryShortCode: CategoryModel.categoryShortCode,
                })
                .from(SkuMasterModel)
                .leftJoin(
                    SubCategoryModel,
                    eq(SkuMasterModel.subCategoryId, SubCategoryModel.subCategoryId)
                )
                .leftJoin(
                    CategoryModel,
                    eq(SkuMasterModel.categoryId, CategoryModel.categoryId)
                )
                .where(eq(SkuMasterModel[column], value))
                .limit(1);

            return result || null;
        } catch (error: any) {
            this.customError.responseMessage =
                error.message || "Failed to fetch SKU with related details.";
            throw this.customError;
        }
    }
    async getActiveSubCategoriesForCategory(categoryId: number, { page, limit }: { page: number; limit: number }) {
        const offset = (page - 1) * limit;
        const whereClause = and(eq(SubCategoryModel.categoryId, categoryId), eq(SubCategoryModel.isActive, true));
        const [data, [{ total }]] = await Promise.all([
            database
                .select({
                    subCategoryId: SubCategoryModel.subCategoryId,
                    subCategoryName: SubCategoryModel.subCategoryName,
                    subCategoryDescription: SubCategoryModel.subCategoryDescription,
                })
                .from(SubCategoryModel)
                .where(whereClause)
                .orderBy(asc(SubCategoryModel.subCategoryId))
                .limit(limit)
                .offset(offset),
            database.select({ total: count() }).from(SubCategoryModel).where(whereClause),
        ]);
        return { data, total };
    }

    async getAllSubCategoriesForCategory(categoryId: number, { page, limit }: { page: number; limit: number }) {
        const offset = (page - 1) * limit;
        const whereClause = eq(SubCategoryModel.categoryId, categoryId);
        const [data, [{ total }]] = await Promise.all([
            database
                .select({
                    subCategoryId: SubCategoryModel.subCategoryId,
                    subCategoryName: SubCategoryModel.subCategoryName,
                    subCategoryDescription: SubCategoryModel.subCategoryDescription,
                    isActive: SubCategoryModel.isActive,
                })
                .from(SubCategoryModel)
                .where(whereClause)
                .orderBy(asc(SubCategoryModel.subCategoryId))
                .limit(limit)
                .offset(offset),
            database.select({ total: count() }).from(SubCategoryModel).where(whereClause),
        ]);
        return { data, total };
    }

    async isCategoryShortCodeTaken(shortCode: string): Promise<boolean> {
        const [existing] = await database
            .select({ categoryId: CategoryModel.categoryId })
            .from(CategoryModel)
            .where(eq(CategoryModel.categoryShortCode, shortCode))
            .limit(1);
        return !!existing;
    }

    async getActiveCategories({ page, limit }: { page: number; limit: number }) {
        const offset = (page - 1) * limit;
        const whereClause = eq(CategoryModel.isActive, true);
        const [data, [{ total }]] = await Promise.all([
            database
                .select()
                .from(CategoryModel)
                .where(whereClause)
                .orderBy(asc(CategoryModel.categoryId))
                .limit(limit)
                .offset(offset),
            database.select({ total: count() }).from(CategoryModel).where(whereClause),
        ]);
        return { data, total };
    }

    async getAllCategories({ page, limit }: { page: number; limit: number }) {
        const offset = (page - 1) * limit;
        const [data, [{ total }]] = await Promise.all([
            database
                .select()
                .from(CategoryModel)
                .orderBy(asc(CategoryModel.categoryId))
                .limit(limit)
                .offset(offset),
            database.select({ total: count() }).from(CategoryModel),
        ]);
        return { data, total };
    }

    async getActiveSkusForCategoryAndSubCategory(categoryId: number, subCategoryId: number, { page, limit }: { page: number; limit: number }) {
        const offset = (page - 1) * limit;
        const whereClause = and(
            eq(SkuMasterModel.categoryId, categoryId),
            eq(SkuMasterModel.subCategoryId, subCategoryId),
            eq(SkuMasterModel.isActive, true)
        );
        const [data, [{ total }]] = await Promise.all([
            database
                .select()
                .from(SkuMasterModel)
                .where(whereClause)
                .orderBy(asc(SkuMasterModel.skuId))
                .limit(limit)
                .offset(offset),
            database.select({ total: count() }).from(SkuMasterModel).where(whereClause),
        ]);
        return { data, total };
    }

    async getActiveSkusForSubCategory(subCategoryId: number, { page, limit }: { page: number; limit: number }) {
        const offset = (page - 1) * limit;
        const whereClause = and(
            eq(SkuMasterModel.subCategoryId, subCategoryId),
            eq(SkuMasterModel.isActive, true)
        );
        const [data, [{ total }]] = await Promise.all([
            database
                .select()
                .from(SkuMasterModel)
                .where(whereClause)
                .orderBy(asc(SkuMasterModel.skuId))
                .limit(limit)
                .offset(offset),
            database.select({ total: count() }).from(SkuMasterModel).where(whereClause),
        ]);
        return { data, total };
    }

    async getAllSkusForSubCategory(subCategoryId: number, { page, limit }: { page: number; limit: number }) {
        const offset = (page - 1) * limit;
        const whereClause = eq(SkuMasterModel.subCategoryId, subCategoryId);
        const [data, [{ total }]] = await Promise.all([
            database
                .select()
                .from(SkuMasterModel)
                .where(whereClause)
                .orderBy(asc(SkuMasterModel.skuId))
                .limit(limit)
                .offset(offset),
            database.select({ total: count() }).from(SkuMasterModel).where(whereClause),
        ]);
        return { data, total };
    }

    async createCategory(data: NewCategory) {
        const [created] = await database
            .insert(CategoryModel)
            .values(data)
            .returning();
        return created;
    }

    async createCategoriesBulk(items: NewCategory[]) {
        const results: Array<{
            categoryName: string;
            categoryShortCode: string;
            status: "created" | "failed";
            data?: any;
            error?: string;
        }> = [];

        const seenShortCodes = new Set<string>();

        // Check existing short codes in DB in one query
        const shortCodes = items.map(i => i.categoryShortCode);
        const existingRows = await database
            .select({ categoryShortCode: CategoryModel.categoryShortCode })
            .from(CategoryModel)
            .where(inArray(CategoryModel.categoryShortCode, shortCodes));
        const existingShortCodes = new Set(existingRows.map(r => r.categoryShortCode));

        for (const item of items) {
            const code = item.categoryShortCode;
            if (seenShortCodes.has(code)) {
                results.push({
                    categoryName: item.categoryName,
                    categoryShortCode: code,
                    status: "failed",
                    error: `Duplicate short code "${code}" in the uploaded list`,
                });
                continue;
            }
            seenShortCodes.add(code);

            if (existingShortCodes.has(code)) {
                results.push({
                    categoryName: item.categoryName,
                    categoryShortCode: code,
                    status: "failed",
                    error: `Short code "${code}" is already in use`,
                });
                continue;
            }

            try {
                const [created] = await database
                    .insert(CategoryModel)
                    .values(item)
                    .returning();
                results.push({
                    categoryName: item.categoryName,
                    categoryShortCode: code,
                    status: "created",
                    data: created,
                });
                // Mark as existing so subsequent duplicates in same batch are caught
                existingShortCodes.add(code);
            } catch (err: any) {
                results.push({
                    categoryName: item.categoryName,
                    categoryShortCode: code,
                    status: "failed",
                    error: err.message || "Unexpected error",
                });
            }
        }

        return results;
    }

    async updateCategory(categoryId: number, data: Partial<NewCategory>) {
        const [updated] = await database
            .update(CategoryModel)
            .set(data)
            .where(eq(CategoryModel.categoryId, categoryId))
            .returning();
        return updated || null;
    }

    async deactivateCategory(categoryId: number) {
        return database
            .update(CategoryModel)
            .set({ isActive: false })
            .where(eq(CategoryModel.categoryId, categoryId));
    }

    async cascadeDeactivateCategory(categoryId: number) {
        // 1. Deactivate all subcategories of this category
        await database
            .update(SubCategoryModel)
            .set({ isActive: false })
            .where(eq(SubCategoryModel.categoryId, categoryId));
        // 2. Deactivate all SKUs of this category
        await database
            .update(SkuMasterModel)
            .set({ isActive: false })
            .where(eq(SkuMasterModel.categoryId, categoryId));
    }

    async getCategoryById(categoryId: number) {
        const [category] = await database
            .select()
            .from(CategoryModel)
            .where(eq(CategoryModel.categoryId, categoryId))
            .limit(1);
        return category || null;
    }

    async getCategoriesByNames(categoryNames: string[]) {
        if (!categoryNames.length) return [];
        return database
            .select({
                categoryId: CategoryModel.categoryId,
                categoryName: CategoryModel.categoryName,
            })
            .from(CategoryModel)
            .where(inArray(CategoryModel.categoryName, categoryNames));
    }

    async createSubCategory(data: NewSubCategory) {
        const [created] = await database
            .insert(SubCategoryModel)
            .values(data)
            .returning();
        return created;
    }

    async createSubCategoriesBulk(items: NewSubCategory[]) {
        const results: Array<{
            subCategoryName: string;
            status: "created" | "failed";
            data?: any;
            error?: string;
        }> = [];

        for (const item of items) {
            try {
                const [created] = await database
                    .insert(SubCategoryModel)
                    .values(item)
                    .returning();

                results.push({
                    subCategoryName: item.subCategoryName,
                    status: "created",
                    data: created,
                });
            } catch (err: any) {
                results.push({
                    subCategoryName: item.subCategoryName,
                    status: "failed",
                    error: err.message || "Unexpected databases error",
                });
            }
        }

        return results;
    }

    async updateSubCategory(subCategoryId: number, data: Partial<NewSubCategory>) {
        const [updated] = await database
            .update(SubCategoryModel)
            .set(data)
            .where(eq(SubCategoryModel.subCategoryId, subCategoryId))
            .returning();
        return updated || null;
    }

    async deactivateSubCategory(subCategoryId: number) {
        return database
            .update(SubCategoryModel)
            .set({ isActive: false })
            .where(eq(SubCategoryModel.subCategoryId, subCategoryId));
    }

    async cascadeDeactivateSubCategory(subCategoryId: number) {
        // Deactivate all SKUs under this subcategory
        await database
            .update(SkuMasterModel)
            .set({ isActive: false })
            .where(eq(SkuMasterModel.subCategoryId, subCategoryId));
    }

    async isParentCategoryActive(categoryId: number): Promise<boolean> {
        const [category] = await database
            .select({ isActive: CategoryModel.isActive })
            .from(CategoryModel)
            .where(eq(CategoryModel.categoryId, categoryId))
            .limit(1);
        return !!category?.isActive;
    }

    async getSubCategoryById(subCategoryId: number) {
        const [subcategory] = await database
            .select()
            .from(SubCategoryModel)
            .where(eq(SubCategoryModel.subCategoryId, subCategoryId))
            .limit(1);
        return subcategory || null;
    }

    async getSubCategoriesByNames(subCategoryNames: string[]) {
        if (!subCategoryNames.length) return [];
        return database
            .select({
                subCategoryId: SubCategoryModel.subCategoryId,
                categoryId: SubCategoryModel.categoryId,
                subCategoryName: SubCategoryModel.subCategoryName,
            })
            .from(SubCategoryModel)
            .where(inArray(SubCategoryModel.subCategoryName, subCategoryNames));
    }

    async createSkusBulk(items: NewSku[]) {
        const results: Array<{
            skuCode: string;
            status: "created" | "failed";
            data?: any;
            error?: string;
        }> = [];

        const seenSkuCodes = new Set<string>();

        // Check existing SKU codes in DB
        const skuCodes = items.map(i => i.skuCode);
        const existingRows = await database
            .select({ skuCode: SkuMasterModel.skuCode })
            .from(SkuMasterModel)
            .where(inArray(SkuMasterModel.skuCode, skuCodes));
        const existingSkuCodes = new Set(existingRows.map(r => r.skuCode));

        for (const item of items) {
            const code = item.skuCode;
            if (seenSkuCodes.has(code)) {
                results.push({
                    skuCode: code,
                    status: "failed",
                    error: `Duplicate SKU code "${code}" in the uploaded list`,
                });
                continue;
            }
            seenSkuCodes.add(code);

            if (existingSkuCodes.has(code)) {
                results.push({
                    skuCode: code,
                    status: "failed",
                    error: `SKU code "${code}" is already in use`,
                });
                continue;
            }

            try {
                const [created] = await database
                    .insert(SkuMasterModel)
                    .values(item)
                    .returning();
                results.push({
                    skuCode: code,
                    status: "created",
                    data: created,
                });
                existingSkuCodes.add(code);
            } catch (err: any) {
                results.push({
                    skuCode: code,
                    status: "failed",
                    error: err.message || "Unexpected error",
                });
            }
        }

        return results;
    }

    async getShockReplacementSkus() {
        const rows = await database
            .select({
                id: ShockReplacementSkusModel.id,
                sku: ShockReplacementSkusModel.skuCode,
                sku_name: ShockReplacementSkusModel.skuName,
                created_at: ShockReplacementSkusModel.createdAt,
                is_active: ShockReplacementSkusModel.isActive,
                created_by: ShockReplacementSkusModel.createdBy,
            })
            .from(ShockReplacementSkusModel)
            .where(eq(ShockReplacementSkusModel.isActive, true))
            .orderBy(desc(ShockReplacementSkusModel.createdAt));

        const missingNameCodes = Array.from(
            new Set(
                rows
                    .filter(row => !row.sku_name && row.sku)
                    .map(row => String(row.sku))
            )
        );

        if (!missingNameCodes.length) {
            return rows.map((row) => ({
                ...row,
                skuCode: row.sku,
                sku_code: row.sku,
                skuName: row.sku_name,
            }));
        }

        const skuMasters = await database
            .select({
                skuId: SkuMasterModel.skuId,
                skuCode: SkuMasterModel.skuCode,
                skuName: SkuMasterModel.skuName,
            })
            .from(SkuMasterModel)
            .where(
                or(
                    inArray(SkuMasterModel.skuCode, missingNameCodes),
                    inArray(SkuMasterModel.skuId, missingNameCodes.map(code => Number(code)).filter(code => !Number.isNaN(code)))
                )
            );

        const skuNameMap = new Map<string, string | null>();
        for (const item of skuMasters) {
            skuNameMap.set(String(item.skuCode), item.skuName);
            skuNameMap.set(String(item.skuId), item.skuName);
        }

        return rows.map(row => ({
            ...row,
            sku_name: row.sku_name || skuNameMap.get(String(row.sku)) || null,
            skuCode: row.sku,
            sku_code: row.sku,
            skuName: row.sku_name || skuNameMap.get(String(row.sku)) || null,
        }));
    }

    async getSelectedShockReplacementSkus({ skip, limit, userId }: { skip: number; limit: number; userId?: number }) {
        const whereClause = userId ? eq(SelectedShockReplacementModel.userId, userId) : undefined;

        const baseQuery = database
            .select({
                id: SelectedShockReplacementModel.id,
                sku: SelectedShockReplacementModel.skuCode,
                quantity: SelectedShockReplacementModel.quantity,
                sku_name: SelectedShockReplacementModel.skuName,
                created_at: SelectedShockReplacementModel.createdAt,
                created_by: SelectedShockReplacementModel.createdBy,
                userName: UserModel.userName,
            })
            .from(SelectedShockReplacementModel)
            .leftJoin(UserModel, eq(UserModel.userId, SelectedShockReplacementModel.userId));

        const countQuery = database
            .select({ total: count() })
            .from(SelectedShockReplacementModel);

        if (whereClause) {
            baseQuery.where(whereClause);
            countQuery.where(whereClause);
        }

        const [rows, [{ total }]] = await Promise.all([
            baseQuery
                .orderBy(desc(SelectedShockReplacementModel.createdAt))
                .limit(limit)
                .offset(skip),
            countQuery,
        ]);

        const data = rows.map((row) => ({
            ...row,
            skuCode: row.sku,
            sku_code: row.sku,
            skuName: row.sku_name,
        }));

        return { reportList: data, totalCount: total };
    }

    async getSelectedShockReplacementDetailsForReport({
        month,
        year,
        userId,
        page,
        limit,
    }: {
        month: number;
        year: number;
        userId?: number;
        page: number;
        limit: number;
    }) {
        const offset = (page - 1) * limit;
        const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
        const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));

        const whereClause = and(
            gte(SelectedShockReplacementModel.createdAt, startDate),
            lt(SelectedShockReplacementModel.createdAt, endDate),
            ...(userId ? [eq(SelectedShockReplacementModel.userId, userId)] : [])
        );

        const [data, [{ total }]] = await Promise.all([
            database
                .select({
                    // id: SelectedShockReplacementModel.id,
                    userName: UserModel.userName,
                    quantity: SelectedShockReplacementModel.quantity,
                    // skuName: SelectedShockReplacementModel.skuName,
                    submittedAt: SelectedShockReplacementModel.createdAt,
                    createdBy: SelectedShockReplacementModel.createdBy,
                })
                .from(SelectedShockReplacementModel)
                .leftJoin(UserModel, eq(UserModel.userId, SelectedShockReplacementModel.userId))
                .where(whereClause)
                .orderBy(desc(SelectedShockReplacementModel.createdAt))
                .limit(limit)
                .offset(offset),
            database
                .select({ total: count() })
                .from(SelectedShockReplacementModel)
                .where(whereClause),
        ]);

        const monthWiseMap = new Map<
            string,
            {
                monthName: string;
                month: number;
                year: number;
                datesMap: Map<string, any[]>;
            }
        >();

        for (const row of data) {
            const submittedAtDate = row.submittedAt ? new Date(row.submittedAt) : null;
            const monthNum = submittedAtDate ? submittedAtDate.getUTCMonth() + 1 : month;
            const yearNum = submittedAtDate ? submittedAtDate.getUTCFullYear() : year;
            const monthName = submittedAtDate
                ? submittedAtDate.toLocaleString("en-US", { month: "long", timeZone: "UTC" })
                : new Date(Date.UTC(year, month - 1, 1)).toLocaleString("en-US", { month: "long", timeZone: "UTC" });
            const dateKey = submittedAtDate ? submittedAtDate.toISOString().slice(0, 10) : `${yearNum}-${String(monthNum).padStart(2, "0")}-01`;
            const monthKey = `${yearNum}-${String(monthNum).padStart(2, "0")}`;

            if (!monthWiseMap.has(monthKey)) {
                monthWiseMap.set(monthKey, {
                    monthName,
                    month: monthNum,
                    year: yearNum,
                    datesMap: new Map<string, any[]>(),
                });
            }

            const monthGroup = monthWiseMap.get(monthKey)!;
            if (!monthGroup.datesMap.has(dateKey)) {
                monthGroup.datesMap.set(dateKey, []);
            }

            // monthGroup.datesMap.get(dateKey)!.push({
            //     id: row.id,
            //     userId: row.userId,
            //     userName: row.userName,
            //     skuCode: row.skuCode,
            //     quantity: row.quantity,
            //     skuName: row.skuName,
            //     submittedAt: row.submittedAt,
            //     createdBy: row.createdBy,
            //     monthName: monthGroup.monthName,
            // });
        }

        const groupedData = Array.from(monthWiseMap.entries())
            .sort((a, b) => (a[0] < b[0] ? 1 : -1))
            .map(([, monthGroup]) => ({
                monthName: monthGroup.monthName,
                month: monthGroup.month,
                year: monthGroup.year,
                dates: Array.from(monthGroup.datesMap.entries())
                    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
                    .map(([date, submissions]) => ({
                        date,
                        submissions,
                    })),
            }));

        return { data: groupedData, total };
    }

    async createShockReplacementSku(sku: string | number, createdBy?: number | null) {
        const skuInput = String(sku).trim();
        const skuAsId = Number(skuInput);

        const [skuMaster] = await database
            .select({
                skuCode: SkuMasterModel.skuCode,
                skuName: SkuMasterModel.skuName,
            })
            .from(SkuMasterModel)
            .where(
                and(
                    or(
                        eq(SkuMasterModel.skuCode, skuInput),
                        ...(!Number.isNaN(skuAsId) ? [eq(SkuMasterModel.skuId, skuAsId)] : [])
                    ),
                    eq(SkuMasterModel.isActive, true)
                )
            )
            .limit(1);

        if (!skuMaster) {
            this.customError.responseMessage = `SKU "${sku}" does not exist in SKU master`;
            this.customError.responseCode = 400;
            this.customError.statusCode = 400;
            throw this.customError;
        }

        const resolvedSkuCode = String(skuMaster.skuCode);

        const [existing] = await database
            .select({
                id: ShockReplacementSkusModel.id,
                sku: ShockReplacementSkusModel.skuCode,
            })
            .from(ShockReplacementSkusModel)
            .where(
                and(
                    eq(ShockReplacementSkusModel.skuCode, resolvedSkuCode),
                    eq(ShockReplacementSkusModel.isActive, true)
                )
            )
            .limit(1);

        if (existing) {
            this.customError.responseMessage = `SKU "${sku}" already exists in shock replacement config`;
            this.customError.responseCode = 400;
            this.customError.statusCode = 400;
            throw this.customError;
        }

        const inactiveRows = await database
            .select({
                id: ShockReplacementSkusModel.id,
            })
            .from(ShockReplacementSkusModel)
            .where(
                and(
                    eq(ShockReplacementSkusModel.skuCode, resolvedSkuCode),
                    eq(ShockReplacementSkusModel.isActive, false)
                )
            );

        if (inactiveRows.length > 0) {
            const sorted = [...inactiveRows].sort((a, b) => Number(a.id) - Number(b.id));
            const keepId = sorted[0].id;
            if (sorted.length > 1) {
                await database
                    .delete(ShockReplacementSkusModel)
                    .where(
                        and(
                            eq(ShockReplacementSkusModel.skuCode, resolvedSkuCode),
                            ne(ShockReplacementSkusModel.id, keepId)
                        )
                    );
            }
            const [reactivated] = await database
                .update(ShockReplacementSkusModel)
                .set({
                    isActive: true,
                    skuName: skuMaster.skuName,
                    createdBy: createdBy || null,
                })
                .where(eq(ShockReplacementSkusModel.id, keepId))
                .returning();

            if (!reactivated) return null;

            return {
                id: reactivated.id,
                sku: reactivated.skuCode,
                skuCode: reactivated.skuCode,
                sku_code: reactivated.skuCode,
                sku_name: reactivated.skuName,
                skuName: reactivated.skuName,
                created_at: reactivated.createdAt,
                is_active: reactivated.isActive,
                created_by: reactivated.createdBy,
            };
        }

        const [latest] = await database
            .select({ id: ShockReplacementSkusModel.id })
            .from(ShockReplacementSkusModel)
            .orderBy(desc(ShockReplacementSkusModel.id))
            .limit(1);

        const nextId = Number(latest?.id ?? 0) + 1;

        const [inserted] = await database
            .insert(ShockReplacementSkusModel)
            .values({
                id: String(nextId),
                skuCode: resolvedSkuCode,
                skuName: skuMaster.skuName,
                createdBy: createdBy || null,
            })
            .returning();

        if (!inserted) return null;

        return {
            id: inserted.id,
            sku: inserted.skuCode,
            skuCode: inserted.skuCode,
            sku_code: inserted.skuCode,
            sku_name: inserted.skuName,
            skuName: inserted.skuName,
            created_at: inserted.createdAt,
            is_active: inserted.isActive,
            created_by: inserted.createdBy,
        };
    }

    async deleteShockReplacementSku(sku: string | number) {
        const skuInput = String(sku).trim();
        if (!skuInput) return null;

        const mapDeleted = (deleted: typeof ShockReplacementSkusModel.$inferSelect) => ({
            id: deleted.id,
            sku: deleted.skuCode,
            skuCode: deleted.skuCode,
            sku_code: deleted.skuCode,
            sku_name: deleted.skuName,
            skuName: deleted.skuName,
            created_at: deleted.createdAt,
            is_active: deleted.isActive,
            created_by: deleted.createdBy,
        });

        let canonicalSkuCode: string | null = null;

        const [bySkuCode] = await database
            .select({ skuCode: ShockReplacementSkusModel.skuCode })
            .from(ShockReplacementSkusModel)
            .where(eq(ShockReplacementSkusModel.skuCode, skuInput))
            .limit(1);
        if (bySkuCode?.skuCode != null && String(bySkuCode.skuCode).length > 0) {
            canonicalSkuCode = String(bySkuCode.skuCode);
        }

        const parsedNum = Number(skuInput);
        const looksLikeIntegerId =
            skuInput !== "" && Number.isFinite(parsedNum) && Number.isInteger(parsedNum);

        if (!canonicalSkuCode && looksLikeIntegerId) {
            const [byConfigId] = await database
                .select({ skuCode: ShockReplacementSkusModel.skuCode })
                .from(ShockReplacementSkusModel)
                .where(eq(ShockReplacementSkusModel.id, skuInput))
                .limit(1);
            if (byConfigId?.skuCode != null && String(byConfigId.skuCode).length > 0) {
                canonicalSkuCode = String(byConfigId.skuCode);
            }
        }

        if (!canonicalSkuCode && looksLikeIntegerId && parsedNum > 0) {
            const [master] = await database
                .select({ skuCode: SkuMasterModel.skuCode })
                .from(SkuMasterModel)
                .where(eq(SkuMasterModel.skuId, parsedNum))
                .limit(1);
            if (master?.skuCode) canonicalSkuCode = String(master.skuCode);
        }

        if (!canonicalSkuCode) return null;

        const deletedRows = await database
            .delete(ShockReplacementSkusModel)
            .where(eq(ShockReplacementSkusModel.skuCode, canonicalSkuCode))
            .returning();

        if (!deletedRows.length) return null;
        return mapDeleted(deletedRows[0]);
    }

    async saveSelectedShockReplacementSkus(
        userId: number,
        selectedSkus: Array<string | number | { sku?: string | number; skuCode?: string | number; sku_code?: string | number; quantity?: number | string; qty?: number | string }>,
        createdBy?: number | null
    ) {
        const [alreadySubmitted] = await database
            .select({ id: SelectedShockReplacementModel.id })
            .from(SelectedShockReplacementModel)
            .where(
                and(
                    eq(SelectedShockReplacementModel.userId, userId),
                    sql`date_trunc('month', ${SelectedShockReplacementModel.createdAt}) = date_trunc('month', now())`
                )
            )
            .limit(1);

        if (alreadySubmitted) {
            this.customError.responseMessage = "Shock replacement can be submitted only once per month";
            this.customError.responseCode = 400;
            this.customError.statusCode = 400;
            throw this.customError;
        }

        const normalizedItems = selectedSkus
            .map((item) => {
                const skuValue =
                    typeof item === "object" && item !== null
                        ? item.sku ?? item.skuCode ?? item.sku_code
                        : item;
                const qtyValue =
                    typeof item === "object" && item !== null
                        ? item.quantity ?? item.qty ?? 1
                        : 1;
                const sku = String(skuValue ?? "").trim();
                const quantity = Number(qtyValue);
                return {
                    sku,
                    quantity: Number.isFinite(quantity) && quantity > 0 ? Math.floor(quantity) : 0,
                };
            })
            .filter((item) => item.sku.length > 0);

        if (!normalizedItems.length) {
            this.customError.responseMessage = "At least one SKU is required";
            this.customError.responseCode = 400;
            this.customError.statusCode = 400;
            throw this.customError;
        }

        const invalidQtySkus = normalizedItems.filter((item) => item.quantity <= 0).map((item) => item.sku);
        if (invalidQtySkus.length) {
            this.customError.responseMessage = `Quantity must be greater than 0 for SKU(s): ${invalidQtySkus.join(", ")}`;
            this.customError.responseCode = 400;
            this.customError.statusCode = 400;
            throw this.customError;
        }

        const aggregatedMap = new Map<string, number>();
        for (const item of normalizedItems) {
            aggregatedMap.set(item.sku, (aggregatedMap.get(item.sku) || 0) + item.quantity);
        }
        const normalizedSkus = Array.from(aggregatedMap.keys());

        // const activeSkus = await database
        //     .select({ skuCode: ShockReplacementSkusModel.skuCode })
        //     .from(ShockReplacementSkusModel)
        //     .where(eq(ShockReplacementSkusModel.isActive, true));

        // const activeSkuSet = new Set(activeSkus.map((row) => String(row.skuCode)));
        // const invalidSkus = normalizedSkus.filter((sku) => !activeSkuSet.has(sku));
        // if (invalidSkus.length) {
        //     this.customError.responseMessage = `These SKUs are not enabled for shock replacement: ${invalidSkus.join(", ")}`;
        //     this.customError.responseCode = 400;
        //     this.customError.statusCode = 400;
        //     throw this.customError;
        // }

        // const skuMasters = await database
        //     .select({
        //         skuCode: SkuMasterModel.skuCode,
        //         skuName: SkuMasterModel.skuName,
        //     })
        //     .from(SkuMasterModel)
        //     .where(inArray(SkuMasterModel.skuCode, normalizedSkus));

        // const skuNameMap = new Map(skuMasters.map((row) => [String(row.skuCode), row.skuName]));

        const rowsToInsert = normalizedSkus.map((sku) => ({
            userId,
            skuCode: sku,
            quantity: aggregatedMap.get(sku) || 1,
            skuName: sku || null,
            createdBy: createdBy || userId,
        }));

        const insertedRows = await Promise.all(
            rowsToInsert.map(async (row) => {
                const [upserted] = await database
                    .insert(SelectedShockReplacementModel)
                    .values(row)
                    .onConflictDoUpdate({
                        target: [SelectedShockReplacementModel.userId, SelectedShockReplacementModel.skuCode],
                        set: {
                            quantity: row.quantity,
                            skuName: row.skuName,
                            createdBy: row.createdBy,
                            createdAt: new Date(),
                        },
                    })
                    .returning();
                return upserted;
            })
        );

        return insertedRows.map((row) => ({
            id: row.id,
            user_id: row.userId,
            sku: row.skuCode,
            skuCode: row.skuCode,
            sku_code: row.skuCode,
            quantity: row.quantity,
            sku_name: row.skuName,
            skuName: row.skuName,
            created_at: row.createdAt,
            created_by: row.createdBy,
        }));
    }
}

export const skuRepository = new SkuRepository();
