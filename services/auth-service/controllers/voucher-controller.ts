import { NextFunction, Request, Response } from "express";
import { UserRepository } from "../repositories/user-repository";
import jwt, { JwtPayload } from "jsonwebtoken";
import { ACCESSS_TOKEN_SECRET } from "../configs/config";
import { RedisClient } from "../services/redis-client";
import { database } from "../server";
import { voucherOrders } from "../schemas/voucher-orders-model";
import { voucherOrderItems } from "../schemas/voucher-order-items-model";
import { and, eq, sql } from "drizzle-orm";
import { MechanicModel, PassbookAuditModel } from "../schemas";

interface VoucherTokenPayload extends JwtPayload {
    userCode: string;
}

export class VoucherController {

    private redisClient = RedisClient.getInstance();

    private generateToken = async (userCode: string): Promise<string> => {
        const token = jwt.sign(
            { userCode },
            ACCESSS_TOKEN_SECRET,
            { expiresIn: "20m" }
        );

        const client = this.redisClient.getClient();
        await client.del(`voucher_session:${userCode}`);
        await client.set(`voucher_session:${userCode}`, token, { EX: 20 * 60 });

        return token;
    }

    getUserDetails = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { VOUCHER_X_API_KEY } = await import("../configs/config");
            const apiKey = req.headers["x-api-key"] as string | undefined;
            const channelPartner = req.headers["x-channel-partner"] as string | undefined;
            const authHeader = req.headers["authorization"] as string | undefined;

            if (!apiKey || !channelPartner) {
                return res.status(401).json({
                    message: "Unauthorized: Missing API Key or Channel Partner",
                });
            }

            if (apiKey !== VOUCHER_X_API_KEY) {
                return res.status(401).json({
                    message: "Unauthorized: Invalid API Key",
                });
            }

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const token = authHeader.split(" ")[1];
            let decoded: VoucherTokenPayload;
            try {
                decoded = jwt.verify(token, ACCESSS_TOKEN_SECRET) as VoucherTokenPayload;
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const { userCode } = decoded;

            if (!userCode) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            // Verify with Redis (Single Session Check)
            const client = this.redisClient.getClient();
            const storedToken = await client.get(`voucher_session:${userCode}`);

            if (!storedToken || storedToken !== token) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const userRepository = new UserRepository();
            const userDetails = await userRepository.getUserDetailsByUserCode(userCode);
            //console.log(userDetails)
            const response = {
                success: true,
                data: {
                    userId: userDetails.userId,
                    name: userDetails.userName,
                    mobileNumber: userDetails.userMobile,
                    email: userDetails.userEmail,
                    currentBalance: userDetails.pointSummary.balancePoints,
                    timestamp: new Date().toISOString()
                },
                message: "Success"
            };

            return res.status(200).json(response);
        } catch (error) {
            next(error);
        }
    }

    getRedirectUrl = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { VOUCHER_REDIRECT_BASE_URL } = await import("../configs/config");
            const authHeader = req.headers["authorization"] as string | undefined;

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const authToken = authHeader.split(" ")[1];
            let decoded: VoucherTokenPayload;
            try {
                decoded = jwt.verify(authToken, ACCESSS_TOKEN_SECRET) as VoucherTokenPayload;
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const { userCode } = decoded;

            if (!userCode) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const token = await this.generateToken(userCode);
            const redirectUrl = `${VOUCHER_REDIRECT_BASE_URL}?token=${token}`;

            return res.status(200).json({
                message: "Redirect URL generated successfully",
                data: {
                    redirectUrl
                }
            });
        } catch (error) {
            next(error);
        }
    }

    placeOrder = async (req: Request, res: Response, next: NextFunction) => {
        let orderId: string | undefined;
        let resolvedUserId: string | undefined;
        try {
            const { VOUCHER_X_API_KEY } = await import("../configs/config");
            const apiKey = req.headers["x-api-key"] as string | undefined;
            const channelPartner = req.headers["x-channel-partner"] as string | undefined;
            const authHeader = req.headers["authorization"] as string | undefined;

            if (!apiKey || !channelPartner) {
                return res.status(401).json({
                    message: "Unauthorized: Missing API Key or Channel Partner",
                });
            }

            if (apiKey !== VOUCHER_X_API_KEY) {
                return res.status(401).json({
                    message: "Unauthorized: Invalid API Key",
                });
            }

            if (!authHeader || !authHeader.startsWith("Bearer ")) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const token = authHeader.split(" ")[1];
            let decoded: VoucherTokenPayload;
            try {
                decoded = jwt.verify(token, ACCESSS_TOKEN_SECRET) as VoucherTokenPayload;
            } catch (err) {
                return res.status(401).json({
                    success: false,
                    error: {
                        message: "Invalid token"
                    }
                });
            }

            const { userCode } = decoded;

            // Fetch user details to get correct userId
            const userRepository = new UserRepository();
            const userDetails = await userRepository.getUserDetailsByUserCode(userCode);

            if (!userDetails || !userDetails.userId) {
                return res.status(404).json({
                    message: "User not found associated with this token",
                });
            }

            // Input Validation - userId is removed from here as it is derived from token
            ({ orderId } = req.body);
            resolvedUserId = String(userDetails.userId);
            const { totalCartValue, itemDetails } = req.body;

            if (!orderId || !totalCartValue || !Array.isArray(itemDetails)) {
                return res.status(400).json({
                    message: "Invalid request payload: Missing required fields",
                });
            }

            const expectedTotal = itemDetails.reduce((sum: number, item: any) => sum + (Number(item.rate) * Number(item.qty)), 0);

            if (Number(totalCartValue) !== expectedTotal) {
                return res.status(400).json({
                    status: "error",
                    code: "400",
                    message: `Cart value mismatch: expected ${expectedTotal}, received ${totalCartValue}`,
                    orderId: orderId,
                    userId: resolvedUserId,
                    expectedTotal: expectedTotal,
                    receivedTotal: Number(totalCartValue)
                });
            }

            const isInsufficientBalance = Number(userDetails.pointSummary.balancePoints) < Number(totalCartValue);

            // Transaction
            const result = await database.transaction(async (tx) => {
                // Calculate success value from successful items if any, otherwise 0 or totalCartValue?
                // Assuming totalSuccessValue is the sum of rates of SUCCESS items
                let successValue = 0;
                let orderStatus = "CREATED";

                if (isInsufficientBalance) {
                    orderStatus = "FAILED";
                    successValue = 0;
                }

                const [insertedOrder] = await tx.insert(voucherOrders).values({
                    userId: String(userDetails.userId), // Use fetched userId
                    externalOrderId: orderId!, // validated above: orderId is defined at this point
                    totalCartValue: String(totalCartValue),
                    totalSuccessValue: String(successValue),
                    orderStatus: orderStatus as any, // Default
                }).returning();

                const itemsToInsert = itemDetails.map((item: any) => ({
                    orderId: insertedOrder.id,
                    externalTxnId: item.txnId,
                    voucherName: item.voucherName,
                    rate: String(item.rate),
                    quantity: item.qty,
                    itemStatus: (isInsufficientBalance ? "FAILED" : "CREATED") as any,
                    txnTime: item.txnTime ? new Date(item.txnTime) : new Date(),
                }));

                const insertedItems = await tx.insert(voucherOrderItems).values(itemsToInsert).returning();

                if (!isInsufficientBalance) {
                    await tx.update(MechanicModel).set({
                        balancePoints: sql`${MechanicModel.balancePoints} - ${totalCartValue}`,
                        redeemedPoints: sql`${MechanicModel.redeemedPoints} + ${totalCartValue}`
                    }).where(eq(MechanicModel.userId, userDetails.userId));

                    await tx.insert(PassbookAuditModel).values({
                        userId: userDetails.userId,
                        type: "Redeem",
                        action: "VOUCHER",
                        amount: String(totalCartValue),
                        openingBalance: String(userDetails.pointSummary.balancePoints),
                        closingBalance: String(Number(userDetails.pointSummary.balancePoints) - Number(totalCartValue)),
                        referenceId: orderId,
                        meta: { redemptionRef: orderId }
                    });
                }

                return { order: insertedOrder, items: insertedItems };
            });

            if (isInsufficientBalance) {
                return res.status(400).json({
                    message: "Insufficient balance",
                });
            }

            return res.status(200).json({
                status: "success",
                code: "100",
                orderId: result.order.externalOrderId,
                refId: result.order.refId,
                userId: String(userDetails.userId),
            });

        } catch (error: any) {
            if (error.code === '23505' && error.constraint === 'uq_orders_external_order_id') {
                return res.status(200).json({
                    status: "error",
                    code: "500",
                    message: "Redemption already exists for this order",
                    orderId: orderId,
                    userId: resolvedUserId,
                });
            }
            next(error);
        }
    }

    settlementCallback = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { VOUCHER_X_API_KEY } = await import("../configs/config");
            const apiKey = req.headers["x-api-key"] as string | undefined;
            const channelPartner = req.headers["x-channel-partner"] as string | undefined;

            if (!apiKey || !channelPartner) {
                return res.status(401).json({
                    message: "Unauthorized: Missing API Key or Channel Partner",
                });
            }

            if (apiKey !== VOUCHER_X_API_KEY) {
                return res.status(401).json({
                    message: "Unauthorized: Invalid API Key",
                });
            }

            const { userId, orderId, orderStatus, itemDetails } = req.body;

            if (!orderId || !orderStatus || !Array.isArray(itemDetails)) {
                return res.status(400).json({
                    message: "Invalid payload: Missing required fields",
                });
            }

            const internalStatus = orderStatus === 'R' ? 'REFUNDED' : (orderStatus === 'C' ? 'COMPLETED' : 'FAILED');
            if (internalStatus === 'FAILED') {
                return res.status(400).json({
                    message: "Invalid Order Status Provided",
                });
            }

            const result = await database.transaction(async (tx) => {
                // Fetch Existing Order
                const [existingOrder] = await tx.select().from(voucherOrders).where(eq(voucherOrders.externalOrderId, orderId));

                if (!existingOrder) {
                    throw new Error("Order Not Found"); // Handled by catch
                }

                if (existingOrder.orderStatus === "COMPLETED" || existingOrder.orderStatus === "REFUNDED" || existingOrder.orderStatus === "FAILED") {
                    // Idempotency check: if status matches, return success, else error
                    if (existingOrder.orderStatus === internalStatus) {
                        // Already processed with same status, return existing
                        const existingItems = await tx.select().from(voucherOrderItems).where(eq(voucherOrderItems.orderId, existingOrder.id));
                        return { order: existingOrder, items: existingItems, isIdempotent: true };
                    }
                    throw new Error("Order already settled with a different status");
                }


                // Update Items and Calculate Refund Amount
                const updatedItems = [];
                let refundAmount = 0;

                for (const item of itemDetails) {
                    const itemInternalStatus = item.status === 'R' ? 'REFUNDED' : (item.status === 'C' ? 'COMPLETED' : 'FAILED');

                    const [updatedItem] = await tx
                        .update(voucherOrderItems)
                        .set({
                            itemStatus: itemInternalStatus as any,
                        })
                        .where(
                            and(
                                eq(voucherOrderItems.orderId, existingOrder.id),
                                eq(voucherOrderItems.externalTxnId, item.txnId),
                                eq(voucherOrderItems.itemStatus, "CREATED")
                            )
                        )
                        .returning();

                    if (updatedItem) {
                        updatedItems.push(updatedItem);
                        if (updatedItem.itemStatus === 'REFUNDED') {
                            refundAmount += Number(updatedItem.rate) * Number(updatedItem.quantity);
                        }
                    }
                }

                // Update User Balance and Audit Log if Refund
                if (refundAmount > 0) {
                    const userId = Number(existingOrder.userId);

                    // Fetch current user details for opening balance
                    const [mechanic] = await tx.select().from(MechanicModel).where(eq(MechanicModel.userId, userId));

                    if (mechanic) {
                        const currentBalance = Number(mechanic.balancePoints);

                        await tx.update(MechanicModel).set({
                            balancePoints: sql`${MechanicModel.balancePoints} + ${refundAmount}`,
                            redeemedPoints: sql`${MechanicModel.redeemedPoints} - ${refundAmount}`
                        }).where(eq(MechanicModel.userId, userId));

                        await tx.insert(PassbookAuditModel).values({
                            userId: userId,
                            type: "Earn", // Treated as Earn back
                            action: "REFUND",
                            amount: String(refundAmount),
                            openingBalance: String(currentBalance),
                            closingBalance: String(currentBalance + refundAmount),
                            referenceId: existingOrder.externalOrderId,
                            meta: { redemptionRef: existingOrder.externalOrderId }
                        });
                    }
                }


                // Re-evaluate Order Status based on all items
                const allItems = await tx.select().from(voucherOrderItems).where(eq(voucherOrderItems.orderId, existingOrder.id));

                let newOrderStatus = "FAILED";
                const isAnyCompleted = allItems.some(item => item.itemStatus === "COMPLETED");
                const isAllRefunded = allItems.every(item => item.itemStatus === "REFUNDED");
                const isAnyCreated = allItems.some(item => item.itemStatus === "CREATED");

                if (isAnyCompleted) {
                    newOrderStatus = "COMPLETED";
                } else if (isAllRefunded) {
                    newOrderStatus = "REFUNDED";
                } else if (isAnyCreated) {
                    newOrderStatus = "CREATED";
                }
                // If neither (e.g. some failed, none completed, none created), it defaults to FAILED.

                // Calculate new Success Value
                const successValue = allItems
                    .filter((item) => item.itemStatus === "COMPLETED")
                    .reduce((acc, item) => acc + (Number(item.rate) * Number(item.quantity)), 0);


                const [updatedOrder] = await tx
                    .update(voucherOrders)
                    .set({
                        orderStatus: newOrderStatus as any,
                        totalSuccessValue: String(successValue),
                        updatedAt: new Date(),
                    })
                    .where(eq(voucherOrders.id, existingOrder.id))
                    .returning();


                return { order: updatedOrder, items: allItems, isIdempotent: false };
            });

            if (!result.order) {
                return res.status(404).json({
                    status: "error",
                    code: "404",
                    message: "Order not found",
                    orderId: orderId
                });
            }

            // Map internal status back to R/C for response
            const responseOrderStatus = result.order.orderStatus === 'REFUNDED' ? 'R' : (result.order.orderStatus === 'COMPLETED' ? 'C' : result.order.orderStatus);

            const userRepository = new UserRepository();
            let userMobile = "";
            try {
                const userDetails = await userRepository.getUserDetailsByUserId(Number(result.order.userId));
                userMobile = userDetails.userMobile || "";
            } catch (err) {
                // Ignore error if user is not found, keep mobileNumber as empty string
            }

            return res.status(200).json({
                status: "success",
                code: "200",
                refId: `ORDER-${result.order.externalOrderId}`,
                orderId: result.order.externalOrderId,
                orderStatus: responseOrderStatus,
                userId: result.order.userId,
                mobileNumber: userMobile,
                totalCartValue: Number(result.order.totalCartValue),
                itemDetails: result.items.map(item => ({
                    txnId: item.externalTxnId,
                    voucherName: item.voucherName,
                    rate: Number(item.rate),
                    qty: item.quantity,
                    status: item.itemStatus === 'REFUNDED' ? 'R' : (item.itemStatus === 'COMPLETED' ? 'C' : item.itemStatus)
                }))
            });

        } catch (error: any) {
            if (error.message === "Order Not Found") return res.status(404).json({
                status: "error",
                code: "404",
                message: "Order not found",
                orderId: req.body?.orderId
            });
            if (error.message === "Order already settled with a different status") return res.status(200).json({
                status: "success",
                code: "200",
                message: "order already settled",
                orderId: req.body?.orderId
            });
            next(error);
        }
    }

    getOrderStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { VOUCHER_X_API_KEY } = await import("../configs/config");
            const apiKey = req.headers["x-api-key"] as string | undefined;
            const channelPartner = req.headers["x-channel-partner"] as string | undefined;

            if (!apiKey || !channelPartner) {
                return res.status(401).json({
                    message: "Unauthorized: Missing API Key or Channel Partner",
                });
            }

            if (apiKey !== VOUCHER_X_API_KEY) {
                return res.status(401).json({
                    message: "Unauthorized: Invalid API Key",
                });
            }

            const { orderId } = req.body;

            if (!orderId) {
                return res.status(400).json({
                    message: "Invalid request payload: Missing orderId",
                });
            }

            const [order] = await database
                .select()
                .from(voucherOrders)
                .where(eq(voucherOrders.externalOrderId, orderId));

            if (!order) {
                return res.status(404).json({
                    status: "failed",
                    code: "404",
                    message: "Order not found",
                    orderId: orderId
                });
            }

            const items = await database
                .select()
                .from(voucherOrderItems)
                .where(eq(voucherOrderItems.orderId, order.id));

            return res.status(200).json({
                status: "success",
                code: "200",
                refId: order.refId,
                orderId: order.externalOrderId,
                //orderStatus: order.orderStatus,
                itemDetails: items.map(item => ({
                    txnId: item.externalTxnId,
                    voucherName: item.voucherName,
                    rate: Number(item.rate),
                    qty: item.quantity,
                    status: item.itemStatus,
                    txnTime: item.txnTime.toISOString()
                }))
            });

        } catch (error) {
            next(error);
        }
    }

}
export const voucherController = new VoucherController();