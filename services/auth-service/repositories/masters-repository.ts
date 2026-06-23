import { and, eq, sql } from "drizzle-orm";
import { AssetModel, FAQModel, TicketCategoryModel, TicketModel } from "../schemas";
import { database } from "../server";
import { CustomError } from "../types";
import { ticketStatusEnum } from "../schemas/ticket-model";
import { fileMiddleware } from "../middlewares/file-middleware";
type TicketStatus = (typeof ticketStatusEnum.enumValues)[number];
class MastersRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseCode: 400,
            responseMessage: ""
        })
    }

    async getTicketList() {
        const res = await database.select().from(TicketCategoryModel).where(
            and(
                eq(TicketCategoryModel.isActive, true)
            )
        )

        return res;
    }

    async getTicketCount(categoryId: number) {
        const res = await database
            .select({
                count: sql<number>`count(*)`
            })
            .from(TicketModel)
            .where(
                and(
                    eq(TicketModel.ticketCategoryId, categoryId),
                    eq(TicketModel.isActive, true)
                )
            );

        return res[0]?.count ?? 0;
    }

    async getTicketCountByStatus(status?: TicketStatus) {
        const whereConditions = [eq(TicketModel.isActive, true)];

        // if status exists → add where condition
        if (status) {
            whereConditions.push(eq(TicketModel.ticketStatus, status));
        }

        const res = await database
            .select({
                count: sql<number>`count(*)`
            })
            .from(TicketModel)
            .where(and(...whereConditions));

        return res[0]?.count ?? 0;
    }


    async getTicketCategories() {
        const res = await database.select().from(TicketCategoryModel).where(
            and(
                eq(TicketCategoryModel.isActive, true)
            )
        )
        return res;
    }

    async getFAQs() {
        const res = await database.select().from(FAQModel).where(
            and(
                eq(FAQModel.isActive, true)
            )
        )
        return res;
    }

    async createFAQ(data: { faqAnswer: string, faqQuestion: string, createdBy: number }) {
        const res = await database.insert(FAQModel).values({ ...data, isActive: true, createdBy: data?.createdBy }).returning();
        return res[0];
    }

    async deleteFAQ(faqId: number) {
        const res = await database
            .update(FAQModel)
            .set({ isActive: false })
            .where(eq(FAQModel.faqId, faqId))
            .returning();
        return res[0];
    }

    async getAssets() {
        const rows = await database
            .select()
            .from(AssetModel)
            .where(eq(AssetModel.isActive, true));

        return await Promise.all(rows.map(async (ele: any) => {
            ele.assetUrl = ele?.staticAssetUrl ? ele.staticAssetUrl :
                ele?.assetUrl ? await fileMiddleware.getFileSignedUrl(ele.assetUrl, "asset") : "";
            return ele;
        }));
    }

    async createAsset(data: any) {
        const res = await database.insert(AssetModel).values(data).returning();
        return res[0];
    }

    async updateAsset(assetId: number, data: any) {
        const res = await database
            .update(AssetModel)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(AssetModel.assetId, assetId))
            .returning();
        return res[0];
    }

    async deleteAsset(assetId: number) {
        const res = await database
            .update(AssetModel)
            .set({ isActive: false, updatedAt: new Date() })
            .where(eq(AssetModel.assetId, assetId))
            .returning();
        return res[0];
    }
}

export const mastersRepository = new MastersRepository(); 