import { database } from "../server";
import { CustomError, MarketProductFilter, AddOrderPayload, ViewOrderFilter, AddAddressPayload, ViewAddressFilter, UserDetails, RedemptionProductDetail, RedemptionOrder, AddMarketProduct, AddMarketProductResponse, EditMarketProduct, UpdateDeliveryStatusPayload } from "../types";
import { and, eq, ilike, desc, count, sql, asc, inArray, getTableColumns, gte, lte, InferInsertModel, max, sum, min, InferSelectModel, or } from "drizzle-orm";
import { fileMiddleware } from "../middlewares/file-middleware";
import { AmazonCartModel } from "../schemas/amazon-cart-model";
import { AmazonWishlistModel } from "../schemas/amazon-wishlist-model";
import { AmazonMarketAddressModel } from "../schemas/amazon-market-address-model";
import { AmazonMarketProductsModel } from "../schemas/amazon-market-products-model";
import { generateRandomToken } from "../utils/random";
import { AmazonMarketOrderItemsModel, MechanicModel, RedemptionModel, UserModel, AmazonDeliveryStatusEnum } from "../schemas";
import { passbookRepository } from "./passbook-repository";

export class AmazonMarketRepository {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({ responseCode: 400, responseMessage: "" });
    }

    async productGetCategories() {
        const result = await database.select({
            amazonCategory: AmazonMarketProductsModel.amazonCategory,
            amazonSubCategory: AmazonMarketProductsModel.amazonSubCategory,
            amazonCategoryUrl: AmazonMarketProductsModel.amazonCategoryUrl,
            amazonSubCategoryUrl: AmazonMarketProductsModel.amazonSubCategoryUrl,
            amazonStaticCategoryUrl: AmazonMarketProductsModel.amazonStaticCategoryUrl,
            amazonStaticSubCategoryUrl: AmazonMarketProductsModel.amazonStaticSubCategoryUrl,
        }).from(AmazonMarketProductsModel).where(
            and(
                eq(AmazonMarketProductsModel.isActive, true)
            )
        )
            .groupBy(
                AmazonMarketProductsModel.amazonCategory,
                AmazonMarketProductsModel.amazonSubCategory,
                AmazonMarketProductsModel.amazonCategoryUrl,
                AmazonMarketProductsModel.amazonSubCategoryUrl,
                AmazonMarketProductsModel.amazonStaticCategoryUrl,
                AmazonMarketProductsModel.amazonStaticSubCategoryUrl
            )

        return await Promise.all(result?.map(async ele => {
            [ele.amazonCategoryUrl, ele.amazonSubCategoryUrl] = await Promise.all([
                ele?.amazonStaticCategoryUrl ? ele?.amazonStaticCategoryUrl : ele?.amazonCategoryUrl ? fileMiddleware.getFileSignedUrl(ele?.amazonCategoryUrl, 'amazon-market') : '',
                ele?.amazonStaticSubCategoryUrl ? ele?.amazonStaticSubCategoryUrl : ele?.amazonSubCategoryUrl ? fileMiddleware.getFileSignedUrl(ele?.amazonSubCategoryUrl, 'amazon-market') : '',
            ])
            return ele
        }))
    }

    async fetchProducts(filters: MarketProductFilter) {
        const whereClauses: any[] = [];
        whereClauses.push(eq(AmazonMarketProductsModel.isActive, true));

        if (filters.productName && filters.productName.trim().length > 0) {
            whereClauses.push(ilike(AmazonMarketProductsModel.amazonProductName, `%${filters.productName.trim()}%`));
        }

        if(filters.category){
            whereClauses.push(ilike(AmazonMarketProductsModel.amazonCategory, filters?.category));
        }

        if(filters.subCategory){
            whereClauses.push(ilike(AmazonMarketProductsModel.amazonSubCategory, filters?.subCategory));
        }

        // price filters operate on amazonDiscountedPrice (fallback to amazonCspPrice if needed)
        if (filters.minPrice) {
            whereClauses.push(sql`${AmazonMarketProductsModel.amazonDiscountedPrice} >= ${filters.minPrice}`);
        }

        if (filters.maxPrice) {
            whereClauses.push(sql`${AmazonMarketProductsModel.amazonDiscountedPrice} <= ${filters.maxPrice}`);
        }

        const [{ totalCount }] = await database.select({ totalCount: count() })
            .from(AmazonMarketProductsModel)
            .where(and(...whereClauses));

        const rows = await database.select({
            slno: sql`row_number() over ( order by ${asc(AmazonMarketProductsModel.productId)})`.as("slno"),
            productId: AmazonMarketProductsModel.productId,
            amazonAsinSku: AmazonMarketProductsModel.amazonAsinSku,
            amazonProductName: AmazonMarketProductsModel.amazonProductName,
            amazonProductUrl: AmazonMarketProductsModel.amazonProductUrl,
            amazonCategory: AmazonMarketProductsModel.amazonCategory,
            amazonCategoryUrl: AmazonMarketProductsModel.amazonCategoryUrl,
            amazonStaticProductUrl: AmazonMarketProductsModel.amazonStaticProductUrl,
            amazonStaticCategoryUrl: AmazonMarketProductsModel.amazonStaticCategoryUrl,
            amazonStaticSubCategoryUrl: AmazonMarketProductsModel.amazonStaticSubCategoryUrl,
            amazonSubCategory: AmazonMarketProductsModel.amazonSubCategory,
            amazonSubCategoryUrl: AmazonMarketProductsModel.amazonSubCategoryUrl,
            amazonMrp: AmazonMarketProductsModel.amazonMrp,
            amazonCspPrice: AmazonMarketProductsModel.amazonCspPrice,
            amazonDiscountedPrice: AmazonMarketProductsModel.amazonDiscountedPrice,
            amazonPoints: AmazonMarketProductsModel.amazonPoints,
            amazonUrl: AmazonMarketProductsModel.amazonUrl,
            amazonCommentsVendor: AmazonMarketProductsModel.amazonCommentsVendor,
            amazonProductDescription: AmazonMarketProductsModel.amazonProductDescription,
        })
            .from(AmazonMarketProductsModel)
            .where(and(...whereClauses))
            .orderBy(asc(AmazonMarketProductsModel.productId))
            .limit(!filters.export ? filters.limit : totalCount)
            .offset(!filters.export ? filters.skip : 0);

        const resolvedRows = await Promise.all(rows.map(async (ele: any) => {
            [
                ele.amazonCategoryUrl,
                ele.amazonSubCategoryUrl,
                ele.amazonProductUrl,
            ] = await Promise.all([
                (!ele?.amazonStaticCategoryUrl && ele?.amazonCategoryUrl) ? fileMiddleware.getFileSignedUrl(ele.amazonCategoryUrl, "amazon-market") : ele?.amazonStaticCategoryUrl || "",
                (!ele?.amazonStaticSubCategoryUrl && ele?.amazonSubCategoryUrl) ? fileMiddleware.getFileSignedUrl(ele.amazonSubCategoryUrl, "amazon-market") : ele?.amazonStaticSubCategoryUrl || "",
                (!ele?.amazonStaticProductUrl && ele?.amazonProductUrl) ? fileMiddleware.getFileSignedUrl(ele.amazonProductUrl, "amazon-market") : ele?.amazonStaticProductUrl || "",
            ]);

            return ele;
        }))

        return {
            totalCount: totalCount || 0,
            reportList: resolvedRows,
        };
    }

    async insertProducts(userId: number, products: AddMarketProduct[]) {
        const response = new AddMarketProductResponse();

        for (const product of products) {
            try {
                const [existing] = await database
                    .select()
                    .from(AmazonMarketProductsModel)
                    .where(
                        and(
                            eq(AmazonMarketProductsModel.amazonAsinSku, product.amazonAsinSku),
                            eq(AmazonMarketProductsModel.isActive, true)
                        )
                    )
                    .limit(1);

                if (existing) {
                    response.failed.push({
                        product,
                        message: `Product with ASIN/SKU ${product.amazonAsinSku} already exists`
                    });
                    continue;
                }

                const [inserted] = await database.insert(AmazonMarketProductsModel).values({
                    amazonAsinSku: product?.amazonAsinSku,
                    amazonProductName: product?.amazonProductName,
                    amazonCategory: product?.amazonCategory,
                    amazonSubCategory: product?.amazonSubCategory,
                    amazonMrp: product?.amazonMrp,
                    amazonDiscountedPrice: product?.amazonDiscountedPrice,
                    amazonStaticCategoryUrl: product?.amazonStaticCategoryUrl,
                    amazonStaticSubCategoryUrl: product?.amazonStaticSubCategoryUrl,
                    amazonStaticProductUrl: product?.amazonStaticProductUrl,
                    amazonPoints: product?.amazonPoints,
                    amazonCspPrice: product?.amazonCspPrice,
                    createdBy: userId,
                    updatedBy: String(userId),
                    updatedAt: new Date(),
                    createdAt: new Date(),
                    isActive: true,
                    amazonDiff: "0.00"
                }).returning();

                if (inserted) {
                    response.success.push(inserted);
                }
            } catch (error: any) {
                response.failed.push({
                    product,
                    message: error?.message || "Insertion failed"
                });
            }
        }
        return response;
    }

    async editProduct(userId: number, payload: EditMarketProduct) {
        const [existing] = await database
            .select()
            .from(AmazonMarketProductsModel)
            .where(eq(AmazonMarketProductsModel.productId, payload.productId))
            .limit(1);

        if (!existing) {
            this.customError.responseMessage = "Product not found";
            throw this.customError;
        }

        if (!existing?.isActive) {
            this.customError.responseMessage = "Product is already deleted";
            throw this.customError;
        }

        const updateData: any = {
            updatedBy: String(userId),
            updatedAt: new Date(),
        };

        if (payload.amazonProductName) updateData.amazonProductName = payload.amazonProductName;
        if (payload.amazonMrp) updateData.amazonMrp = payload.amazonMrp;
        if (payload.amazonDiscountedPrice) updateData.amazonDiscountedPrice = payload.amazonDiscountedPrice;
        if (payload.amazonPoints) updateData.amazonPoints = payload.amazonPoints;
        // if (payload.amazonInventoryCount !== undefined) updateData.amazonInventoryCount = payload.amazonInventoryCount;
        if (payload.amazonCategory) updateData.amazonCategory = payload.amazonCategory;
        if (payload.amazonSubCategory) updateData.amazonSubCategory = payload.amazonSubCategory;
        if (payload.amazonProductDescription) updateData.amazonProductDescription = payload.amazonProductDescription;
        if (payload.amazonCspPrice) updateData.amazonCspPrice = payload.amazonCspPrice;
        if (payload.amazonModelNo) updateData.amazonModelNo = payload.amazonModelNo;
        if (payload.amazonCommentsVendor) updateData.amazonCommentsVendor = payload.amazonCommentsVendor;
        if (payload.isActive !== undefined) updateData.isActive = payload.isActive;
        if (payload.amazonStaticProductUrl !== undefined) updateData.amazonStaticProductUrl = payload.amazonStaticProductUrl;
        if (payload.amazonProductUrl) updateData.amazonProductUrl = payload.amazonProductUrl;
        if (payload.amazonStaticCategoryUrl !== undefined) updateData.amazonStaticCategoryUrl = payload.amazonStaticCategoryUrl;
        if (payload.amazonCategoryUrl) updateData.amazonCategoryUrl = payload.amazonCategoryUrl;
        if (payload.amazonStaticSubCategoryUrl !== undefined) updateData.amazonStaticSubCategoryUrl = payload.amazonStaticSubCategoryUrl;
        if (payload.amazonSubCategoryUrl) updateData.amazonSubCategoryUrl = payload.amazonSubCategoryUrl;

        await database.update(AmazonMarketProductsModel)
            .set(updateData)
            .where(eq(AmazonMarketProductsModel.productId, payload.productId));

        const [updated] = await database
            .select()
            .from(AmazonMarketProductsModel)
            .where(eq(AmazonMarketProductsModel.productId, payload.productId))
            .limit(1);

        return updated;
    }

    async addToCart(userId: number, productId: number, quantity = 1) {
        const [existing] = await database
            .select()
            .from(AmazonCartModel)
            .where(and(eq(AmazonCartModel.userId, userId), eq(AmazonCartModel.amazonMarketProductId, productId), eq(AmazonCartModel.isActive, true)))
            .limit(1);

        if (existing?.amazonMarketProductId) {
            await database.update(AmazonCartModel).set({ quantity: quantity }).where(eq(AmazonCartModel.amazonMarketProductId, productId));
            return { cartId: existing?.cartId, userId, productId, quantity: existing.quantity + quantity };
        }

        const [inserted] = await database.insert(AmazonCartModel).values({ userId, amazonMarketProductId: productId, quantity }).returning();
        return inserted;
    }

    async viewCart(userId: number, filter: MarketProductFilter) {
        const whereClauses: any[] = [];
        whereClauses.push(eq(AmazonCartModel.userId, userId));
        whereClauses.push(eq(AmazonCartModel.isActive, true));

        const rows = await database.select({
            cartId: AmazonCartModel.cartId,
            quantity: AmazonCartModel.quantity,
            productId: AmazonCartModel.amazonMarketProductId,
            productName: AmazonMarketProductsModel.amazonProductName,
            amazonProductUrl: AmazonMarketProductsModel.amazonProductUrl,
            amazonCategoryUrl: AmazonMarketProductsModel.amazonCategoryUrl,
            amazonSubCategoryUrl: AmazonMarketProductsModel.amazonSubCategoryUrl,
            amazonDiscountedPrice: AmazonMarketProductsModel.amazonDiscountedPrice,
            amazonPoints: sql<number>`${AmazonMarketProductsModel.amazonPoints}`,
        })
            .from(AmazonCartModel)
            .leftJoin(AmazonMarketProductsModel, eq(AmazonCartModel.amazonMarketProductId, AmazonMarketProductsModel.productId))
            .where(and(...whereClauses))
            // .limit(filter.limit)
            // .offset(filter.skip || 0)
            .orderBy(desc(AmazonCartModel.cartId));

        // Resolve signed URLs sequentially
        const resolved: any[] = [];
        for (const r of rows) {
            if (r?.amazonProductUrl) r.amazonProductUrl = await fileMiddleware.getFileSignedUrl(r.amazonProductUrl, "amazon-market");
            if (r?.amazonCategoryUrl) r.amazonCategoryUrl = await fileMiddleware.getFileSignedUrl(r.amazonCategoryUrl, "amazon-market");
            if (r?.amazonSubCategoryUrl) r.amazonSubCategoryUrl = await fileMiddleware.getFileSignedUrl(r.amazonSubCategoryUrl, "amazon-market");
            resolved.push(r);
        }

        const [{ totalCount }] = await database.select({ totalCount: count() }).from(AmazonCartModel).where(and(...whereClauses));

        return { totalCount: Number(totalCount || 0), reportList: resolved };
    }

    async updateQuantity(cartId: number, userId: number, quantity: number) {
        await database.update(AmazonCartModel).set({ quantity: quantity }).where(and(eq(AmazonCartModel.cartId, cartId), eq(AmazonCartModel.userId, userId)));
        const [row] = await database.select().from(AmazonCartModel).where(eq(AmazonCartModel.cartId, cartId)).limit(1);
        return row;
    }

    async removeFromCart(productId: number[], userId: number) {
        await database.update(AmazonCartModel).set({ isActive: false }).where(and(inArray(AmazonCartModel.amazonMarketProductId, productId || []), eq(AmazonCartModel.userId, userId)));
        return { success: true };
    }

    // Wishlist methods
    async addToWishlist(userId: number, productId: number) {
        const [existing] = await database
            .select()
            .from(AmazonWishlistModel)
            .where(and(eq(AmazonWishlistModel.userId, userId), eq(AmazonWishlistModel.amazonMarketProductId, productId), eq(AmazonWishlistModel.isActive, true)))
            .limit(1);

        if (existing?.amazonMarketProductId) {
            this.customError.responseMessage = "Product is already added into the wishlist";
            throw this.customError;
        }

        const [inserted] = await database.insert(AmazonWishlistModel).values({ userId, amazonMarketProductId: productId }).returning();
        return inserted;
    }

    async viewWishlist(userId: number, filter: any) {
        const whereClauses: any[] = [];
        whereClauses.push(eq(AmazonWishlistModel.userId, userId));
        whereClauses.push(eq(AmazonWishlistModel.isActive, true));

        const rows = await database.select({
            wishlistId: AmazonWishlistModel.wishlistId,
            productId: AmazonWishlistModel.amazonMarketProductId,
            productName: AmazonMarketProductsModel.amazonProductName,
            amazonProductUrl: AmazonMarketProductsModel.amazonProductUrl,
            amazonCategoryUrl: AmazonMarketProductsModel.amazonCategoryUrl,
            amazonSubCategoryUrl: AmazonMarketProductsModel.amazonSubCategoryUrl,
            amazonDiscountedPrice: AmazonMarketProductsModel.amazonDiscountedPrice,
            amazonPoints: AmazonMarketProductsModel.amazonPoints,
        })
            .from(AmazonWishlistModel)
            .leftJoin(AmazonMarketProductsModel, eq(AmazonWishlistModel.amazonMarketProductId, AmazonMarketProductsModel.productId))
            .where(and(...whereClauses))
            // .limit(filter.limit)
            // .offset(filter.skip || 0)
            .orderBy(desc(AmazonWishlistModel.wishlistId));

        // Resolve signed URLs sequentially
        const resolved: any[] = [];
        for (const r of rows) {
            if (r?.amazonProductUrl) r.amazonProductUrl = await fileMiddleware.getFileSignedUrl(r.amazonProductUrl, "amazon-market");
            if (r?.amazonCategoryUrl) r.amazonCategoryUrl = await fileMiddleware.getFileSignedUrl(r.amazonCategoryUrl, "amazon-market");
            if (r?.amazonSubCategoryUrl) r.amazonSubCategoryUrl = await fileMiddleware.getFileSignedUrl(r.amazonSubCategoryUrl, "amazon-market");
            resolved.push(r);
        }

        const [{ totalCount }] = await database.select({ totalCount: count() }).from(AmazonWishlistModel).where(and(...whereClauses));

        return { totalCount: Number(totalCount || 0), reportList: resolved };
    }

    async removeFromWishlist(productId: number, userId: number) {
        await database.update(AmazonWishlistModel).set({ isActive: false }).where(and(eq(AmazonWishlistModel.amazonMarketProductId, productId), eq(AmazonWishlistModel.userId, userId)));
        return { success: true };
    }

    // Addresses
    async addAddress(userId: number, payload: AddAddressPayload) {
        // if isDefault set, unset other defaults
        if (payload.isDefault) {
            await database.update(AmazonMarketAddressModel).set({ isDefault: false }).where(eq(AmazonMarketAddressModel.userId, userId));
        }

        const [inserted] = await database.insert(AmazonMarketAddressModel).values([{
            userId,
            addressLabel: payload?.addressLabel,
            pincode: payload.pincode,
            addressLine1: payload.addressLine1,
            addressLine2: payload.addressLine2,
            city: payload.city,
            state: payload.state,
            country: payload.country,
            latitude: payload.latitude ?? null,
            longitude: payload.longitude ?? null,
            isDefault: payload.isDefault ?? false,
            isActive: true,
        }] as InferSelectModel<typeof AmazonMarketAddressModel>[]).returning();

        return inserted;
    }

    async viewAddresses(userId: number, filter: ViewAddressFilter) {
        const whereClauses: any[] = [];
        whereClauses.push(eq(AmazonMarketAddressModel.userId, userId));
        whereClauses.push(eq(AmazonMarketAddressModel.isActive, true));

        const rows = await database.select({
            addressId: AmazonMarketAddressModel.addressId,
            addressLabel: AmazonMarketAddressModel.addressLabel,
            pincode: AmazonMarketAddressModel.pincode,
            addressLine1: AmazonMarketAddressModel.addressLine1,
            addressLine2: AmazonMarketAddressModel.addressLine2,
            city: AmazonMarketAddressModel.city,
            state: AmazonMarketAddressModel.state,
            country: AmazonMarketAddressModel.country,
            latitude: AmazonMarketAddressModel.latitude,
            longitude: AmazonMarketAddressModel.longitude,
            isDefault: AmazonMarketAddressModel.isDefault,
            isActive: AmazonMarketAddressModel.isActive,
            createdAt: AmazonMarketAddressModel.createdAt,
            updatedAt: AmazonMarketAddressModel.updatedAt,
        })
            .from(AmazonMarketAddressModel)
            .where(and(...whereClauses))
            .orderBy(desc(AmazonMarketAddressModel.addressId));

        return rows;
    }

    // Orders (no try/catch here - controller will handle errors)
    async createOrder(userId: number, payload: AddOrderPayload, userDetails: UserDetails) {
        return await database.transaction(async (tran) => {
            const [userPoints] = await tran.select().from(MechanicModel).where(
                and(
                    eq(MechanicModel.userId, userDetails.userId)
                )
            )

            if (Number(userPoints?.balancePoints || 0) < 1) {
                this.customError.responseMessage = "Insufficient balance";
                throw this.customError;
            }
            const [existingAddress] = await tran.select().from(AmazonMarketAddressModel).where(
                and(
                    eq(AmazonMarketAddressModel.userId, userDetails.userId),
                    eq(AmazonMarketAddressModel.isActive, true),
                    eq(AmazonMarketAddressModel.addressId, payload?.addressId as number)
                )
            )
                .limit(1)

            if (!existingAddress?.addressId) {
                this.customError.responseMessage = "Please provide valid address";
                throw this.customError;
            }

            const products = await tran
                .select()
                .from(AmazonMarketProductsModel)
                .where(
                    and(
                        eq(AmazonMarketProductsModel.isActive, true),
                        inArray(AmazonMarketProductsModel.productId, payload?.products?.map(ele => ele?.productId) as number[])
                    )
                )
            const fetchedProductId = products?.map(ele => ele?.productId) || []

            payload?.products?.map(product => {
                if (!fetchedProductId?.includes(product?.productId as number)) {
                    this.customError.responseMessage = `Product ID: ${product?.productId} is not found`;
                    throw this.customError;
                }
            })

            const { totalPoints, totalUnits } = payload.products.reduce(
                (acc, item) => {
                    const dbProduct = products.find(p => p.productId === item.productId);
                    acc.totalPoints += Number(dbProduct?.amazonPoints || 0) * (item.quantity || 1);
                    acc.totalUnits += item.quantity || 1;
                    return acc;
                },
                { totalPoints: 0, totalUnits: 0 }
            );

            if (totalPoints > Number(userPoints?.balancePoints)) {
                this.customError.responseMessage = `Insufficient balance`;
                throw this.customError;
            }

            const updateDetails = await tran
                .update(MechanicModel)
                .set({
                    redeemedPoints: sql`${MechanicModel.redeemedPoints} + ${totalPoints}`,
                    balancePoints: sql`${MechanicModel.balancePoints} - ${totalPoints}`,
                    redeemablePoints: sql`${MechanicModel.redeemablePoints} - ${totalPoints}`
                })
                .where(
                    and(
                        eq(MechanicModel.userId, userDetails.userId),
                        gte(MechanicModel.balancePoints, String(totalPoints))
                    )
                )

            if (!updateDetails?.rowCount || updateDetails?.rowCount == 0) {
                this.customError.responseMessage = "Insufficient balance";
                throw this.customError;
            }



            const [orderDetails] = await tran.insert(RedemptionModel).values({
                userId: userDetails.userId,
                redemptionRef: generateRandomToken(10),
                points: String(totalPoints),
                totalUnit: totalUnits,
                redemptionMode: "Market Products",
                createdBy: userDetails.userId,
                orderAddress: {
                    addressLine1: existingAddress?.addressLine1 as string,
                    addressLine2: existingAddress?.addressLine2 as string,
                    city: existingAddress?.city as string,
                    state: existingAddress?.state as string,
                    pincode: existingAddress?.pincode as string,
                    country: existingAddress?.country as string,
                }
            }).returning(getTableColumns(RedemptionModel))

            const itemsPayload = payload.products.flatMap(item => {
                const dbProduct = products.find(p => p.productId === item.productId);
                const quantity = item.quantity || 1;

                return Array.from({ length: quantity }, () => ({
                    redemptionId: orderDetails.redemptionId,
                    amazonProductId: dbProduct?.productId as number,
                    points: String(dbProduct?.amazonPoints),
                    createdBy: userId,
                    updatedBy: userId,
                }) as InferInsertModel<typeof AmazonMarketOrderItemsModel>);
            });

            await tran.insert(AmazonMarketOrderItemsModel).values(itemsPayload);
            await tran.update(AmazonCartModel).set({ isActive: false }).where(
                and(
                    inArray(AmazonCartModel.amazonMarketProductId, fetchedProductId),
                    eq(AmazonCartModel.isActive, true),
                    eq(AmazonCartModel.userId, userDetails?.userId)
                )
            )
            await passbookRepository.addTransaction(userDetails?.userId, "MARKETPLACE", -totalPoints, orderDetails, tran)
        })
    }

    async orderHistory(userId: number | undefined, filter: ViewOrderFilter, isAdmin: boolean = false) {

        const conditions = [eq(RedemptionModel.redemptionMode, "Market Products")];
        if (userId) {
            conditions.push(eq(RedemptionModel.userId, userId));
        } else if (filter.userId) {
            conditions.push(eq(RedemptionModel.userId, filter.userId));
        }

        if (filter.fromDate) {
            conditions.push(gte(RedemptionModel.createdAt, new Date(filter.fromDate)));
        }

        if (filter.toDate) {
            conditions.push(lte(RedemptionModel.createdAt, new Date(new Date(filter.toDate).setHours(23, 59, 59, 999))));
        }

        if (filter.status && filter.status.length > 0) {
            conditions.push(inArray(RedemptionModel.redemptionStatus, filter.status as any[]));
        }

        if (filter.searchStr) {
            conditions.push(or(
                ilike(RedemptionModel.redemptionRef, `%${filter.searchStr}%`),
                ilike(UserModel.userMobile, `%${filter.searchStr}%`),
                ilike(UserModel.userName, `%${filter.searchStr}%`)
            )!);
        }

        let totalCountQuery = database.select({ totalCount: count() }).from(RedemptionModel);

        if (filter.searchStr) {
            totalCountQuery = totalCountQuery.leftJoin(UserModel, eq(RedemptionModel.userId, UserModel.userId)) as any;
        }

        const [{ totalCount }] = await totalCountQuery.where(and(...conditions));

        const selectFields: any = {
            redemptionId: RedemptionModel.redemptionId,
            slno: sql<string>`row_number() over (order by ${desc(RedemptionModel.redemptionId)})`,
            createdAt: sql<string>`${RedemptionModel.createdAt}`,
            updatedAt: sql<string>`${RedemptionModel.processedAt}`,
            status: RedemptionModel.redemptionStatus,
            totalUnit: RedemptionModel.totalUnit,
            totalPoint: RedemptionModel.points,
            address: RedemptionModel.orderAddress,
            redemptionRef: RedemptionModel.redemptionRef,
            userId: RedemptionModel.userId,
        };

        if (isAdmin) {
            selectFields.userName = UserModel.userName;
        }

        let baseQuery = database.select(selectFields).from(RedemptionModel);

        if (isAdmin || filter.searchStr) {
            baseQuery = baseQuery.leftJoin(UserModel, eq(RedemptionModel.userId, UserModel.userId)) as any;
        }

        const redemptions = await baseQuery
            .where(
                and(...conditions)
            )
            .offset(filter?.skip)
            .limit(filter?.limit)
            .orderBy(desc(RedemptionModel.redemptionId))
            .groupBy(RedemptionModel.redemptionId, ...((isAdmin || filter.searchStr) ? [UserModel.userName, UserModel.userId, RedemptionModel.processedAt] : [RedemptionModel.processedAt]));

        const redemptionIds = redemptions.map((r: any) => r.redemptionId).filter(Boolean);

        let items: any[] = [];
        if (redemptionIds.length) {
            items = await database.select({
                redemptionId: AmazonMarketOrderItemsModel.redemptionId,
                productId: AmazonMarketOrderItemsModel.amazonProductId,
                productName: AmazonMarketProductsModel.amazonProductName,
                quantity: count(),
                totalPoints: sum(AmazonMarketOrderItemsModel.points),
                points: min(AmazonMarketOrderItemsModel.points),
                productValue: max(AmazonMarketOrderItemsModel.productValue),
                deliveryStatus: max(AmazonMarketOrderItemsModel.deliveryStatus),
                dispatchedAt: max(AmazonMarketOrderItemsModel.dispatchedAt),
                deliveredAt: max(AmazonMarketOrderItemsModel.deliveredAt),
                productImage: max(AmazonMarketProductsModel.amazonProductUrl),
                staticImage: max(AmazonMarketProductsModel.amazonStaticProductUrl),

            })
                .from(AmazonMarketOrderItemsModel)
                .leftJoin(AmazonMarketProductsModel, eq(AmazonMarketOrderItemsModel.amazonProductId, AmazonMarketProductsModel.productId))
                .where(inArray(AmazonMarketOrderItemsModel.redemptionId, redemptionIds))
                .groupBy(AmazonMarketOrderItemsModel.redemptionId, AmazonMarketOrderItemsModel.amazonProductId, AmazonMarketProductsModel.amazonProductName);
        }

        const itemsByRedemption: Record<number, any[]> = {};
        for (const it of items) {

            let imageUrl = "";
            if (it.staticImage && it.staticImage !== "") {
                imageUrl = it.staticImage;
            } else if (it.productImage) {
                imageUrl = await fileMiddleware.getFileSignedUrl(it.productImage, 'amazon-market');
            }

            const rid = Number(it.redemptionId);
            if (!itemsByRedemption[rid]) itemsByRedemption[rid] = [];
            itemsByRedemption[rid].push({
                productId: it?.productId,
                productName: it?.productName,
                quantity: Number(it?.quantity),
                points: it?.points,
                productValue: it?.productValue,
                deliveryStatus: it?.deliveryStatus,
                totalPoints: it?.totalPoints,
                dispatchedAt: it?.dispatchedAt,
                deliveredAt: it?.deliveredAt,
                imageUrl: imageUrl,
            });
        }

        // Attach productDetails and productNames to each redemption row
        const finalResult = redemptions.map(r => {
            const productList = itemsByRedemption[r.redemptionId]?.map(ele => {
                return {
                    ...ele,
                    deliveredAt: undefined,
                    dispatchedAt: undefined,
                    deliveryStatus: undefined,
                }
            })
            return {
                ...r,
                deliveredAt: itemsByRedemption[r.redemptionId]?.[0]?.deliveredAt || "",
                dispatchedAt: itemsByRedemption[r.redemptionId]?.[0]?.dispatchedAt || "",
                deliveryStatus: itemsByRedemption[r.redemptionId]?.[0]?.deliveryStatus || "",
                products: productList,
            }
        });

        return { totalCount, reportList: finalResult };
    }

    async getDeliveryStatuses() {
        return AmazonDeliveryStatusEnum.enumValues;
    }

    async updateDeliveryStatus(userId: number, payload: UpdateDeliveryStatusPayload) {
        const [existing] = await database
            .select()
            .from(RedemptionModel)
            .where(and(eq(RedemptionModel.redemptionId, payload.redemptionId), eq(RedemptionModel.redemptionMode, "Market Products")))
            .limit(1);

        if (!existing) {
            this.customError.responseMessage = "Redemption not found or not a Market Product order";
            throw this.customError;
        }

        const updateData: any = {
            deliveryStatus: payload?.status
        };

        if (payload?.status === "Shipping") {
            updateData.dispatchedAt = new Date();
        } else if (payload?.status === "Delivered") {
            updateData.deliveredAt = new Date();
        }

        await database.update(AmazonMarketOrderItemsModel)
            .set(updateData)
            .where(eq(AmazonMarketOrderItemsModel.redemptionId, payload.redemptionId));

        return { success: true };
    }
}

export const amazonMarketRepository = new AmazonMarketRepository();
