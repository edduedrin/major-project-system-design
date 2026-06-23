import { NextFunction, Request, Response } from "express";
import { database } from "../server";
import { NotificationLogModel, NotificationModel, UserModel, RoleModel, AddressModel, CampaignModel } from "../schemas";
import { publishJob } from "../services/rabbitMqNew/publisher";
import { and, count, eq, gt, gte, ilike, isNotNull, lte, or, sql, inArray } from "drizzle-orm";
import admin from "../configs/firebase";
import { fileMiddleware } from "../middlewares/file-middleware";

export interface NotificationUserPayload {
    notificationId: number;
    userId: number;
    fcmToken: string;
    title: string;
    body: string;
    imageUrl?: string | null;
    scheduledAt?: string | null;
    redirectionLink?: string | null;
}

/** One queue message carries a batch (≤ 500 users) for a single multicast call. */
export interface NotificationBatchPayload {
    notificationId: number;
    title: string;
    body: string;
    imageUrl?: string | null;
    scheduledAt?: string | null;
    redirectionLink?: string | null;
    users: Array<{ userId: number; fcmToken: string }>;
}

export class NotificationController {
    public static async broadcastNotification(req: Request, res: Response, next: NextFunction) {
        try {
            const { title, body, scheduledAt, redirectionLink, type, startDate, endDate, scheduledTime, recurrence } = req.body;
            let { imageUrl, roleFilter, stateFilter, districtFilter, cityFilter, pincodeFilter, blockStatusFilter } = req.body;

            // Helper to parse comma separated strings or stringified JSON arrays into string arrays
            const parseStringArray = (input: any): string[] | undefined => {
                if (input === undefined) return undefined;
                if (typeof input === "string") {
                    try {
                        let parsed = JSON.parse(input);
                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    }
                } else if (Array.isArray(input)) {
                    return input.map(String);
                } else {
                    return [String(input)];
                }
            };

            if (roleFilter !== undefined) {
                if (typeof roleFilter === "string") {
                    try {
                        let parsed = JSON.parse(roleFilter);
                        roleFilter = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        const split = roleFilter.split(',').map(Number).filter((n: number) => !isNaN(n));
                        if (split.length > 0) {
                            roleFilter = split;
                        } else {
                            return res.status(400).json({ success: false, message: "Invalid roleFilter format." });
                        }
                    }
                } else if (typeof roleFilter === "number") {
                    roleFilter = [roleFilter];
                } else if (!Array.isArray(roleFilter)) {
                    return res.status(400).json({ success: false, message: "Invalid roleFilter format." });
                }
                roleFilter = roleFilter.map(Number);
            }

            const activeStateFilter = parseStringArray(stateFilter);
            const activeDistrictFilter = parseStringArray(districtFilter);
            const activeCityFilter = parseStringArray(cityFilter);
            const activeBlockStatusFilter = parseStringArray(blockStatusFilter);

            if (pincodeFilter !== undefined) {
                if (typeof pincodeFilter === "string") {
                    try {
                        let parsed = JSON.parse(pincodeFilter);
                        pincodeFilter = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        const split = pincodeFilter.split(',').map(Number).filter((n: number) => !isNaN(n));
                        if (split.length > 0) {
                            pincodeFilter = split;
                        } else {
                            return res.status(400).json({ success: false, message: "Invalid pincodeFilter format." });
                        }
                    }
                } else if (typeof pincodeFilter === "number") {
                    pincodeFilter = [pincodeFilter];
                } else if (!Array.isArray(pincodeFilter)) {
                    return res.status(400).json({ success: false, message: "Invalid pincodeFilter format." });
                }
                pincodeFilter = pincodeFilter.map(Number);
            }

            if (!title || !body) {
                return res.status(400).json({ success: false, message: "Title and body are required." });
            }

            if (type === 'campaign') {
                if (!startDate || !endDate || !recurrence) {
                    return res.status(400).json({ success: false, message: "Start date, end date, and recurrence are required for campaigns." });
                }
            }

            if (req.file) {
                const uploadedFileName = await fileMiddleware.uploadFile(req.file, "notification");
                if (uploadedFileName) {
                    imageUrl = uploadedFileName;
                }
            }

            const isCampaign = type === 'campaign';

            if (isCampaign) {
                const start = new Date(startDate);
                const end = new Date(endDate);

                const [campaign] = await database
                    .insert(CampaignModel)
                    .values({
                        name: title,
                        startDate: start,
                        endDate: end,
                        scheduledTime: scheduledTime || null,
                        recurrence: recurrence.toUpperCase(),
                        status: "ACTIVE"
                    })
                    .returning();

                const generateRecurrences = (start: Date, end: Date, recurrence: string, timeOption?: string): Date[] => {
                    const dates: Date[] = [];
                    let current = new Date(start);

                    if (timeOption && typeof timeOption === 'string') {
                        const [hours, minutes] = timeOption.split(':').map(Number);
                        if (!isNaN(hours) && !isNaN(minutes)) {
                            current.setHours(hours, minutes, 0, 0);
                        }
                    }

                    const daysOfWeek = ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"];
                    const targetDayIndex = daysOfWeek.indexOf(recurrence);

                    if (targetDayIndex !== -1) {
                        // Advance 'current' to the first matching day of the week
                        while (current.getDay() !== targetDayIndex && current <= end) {
                            current.setDate(current.getDate() + 1);
                        }
                        // Add occurrences every 7 days
                        while (current <= end) {
                            dates.push(new Date(current));
                            current.setDate(current.getDate() + 7);
                        }
                    } else {
                        while (current <= end) {
                            dates.push(new Date(current));
                            if (recurrence === 'HOURLY') {
                                current.setHours(current.getHours() + 1);
                            } else if (recurrence === 'DAILY') {
                                current.setDate(current.getDate() + 1);
                            } else if (recurrence === 'WEEKLY') {
                                current.setDate(current.getDate() + 7);
                            } else {
                                break;
                            }
                        }
                    }
                    return dates;
                };

                const recurrences = generateRecurrences(start, end, recurrence.toUpperCase(), scheduledTime);

                if (recurrences.length === 0) {
                    return res.status(400).json({ success: false, message: "Invalid dates or recurrence produced no notifications." });
                }

                const notificationValues = recurrences.map(scheduled => ({
                    title,
                    body,
                    imageUrl,
                    redirectionLink,
                    roleFilter: roleFilter || null,
                    stateFilter: activeStateFilter || null,
                    districtFilter: activeDistrictFilter || null,
                    cityFilter: activeCityFilter || null,
                    pincodeFilter: pincodeFilter || null,
                    blockStatusFilter: activeBlockStatusFilter || null,
                    status: "PENDING" as const,
                    type: "CAMPAIGN" as const,
                    campaignId: campaign.id,
                    scheduledAt: scheduled
                }));

                const notifications = await database
                    .insert(NotificationModel)
                    .values(notificationValues)
                    .returning();

                const now = new Date();
                const immediateNotifications = notifications.filter(n => n.scheduledAt && n.scheduledAt <= now);

                for (const n of immediateNotifications) {
                    await publishJob({
                        type: "notification",
                        payload: { notificationId: n.id }
                    });
                }

                return res.status(200).json({
                    success: true,
                    message: `Campaign scheduled successfully with ${notifications.length} notifications.`,
                    data: { campaign, notifications }
                });

            } else {
                const resolvedScheduledAt = scheduledAt ? new Date(scheduledAt) : null;

                // A notification is SCHEDULED when its scheduledAt is explicitly set to a future time.
                // Otherwise it fires immediately and is treated as REGULAR.
                const now = new Date();
                const notificationType: "REGULAR" | "SCHEDULED" =
                    resolvedScheduledAt && resolvedScheduledAt > now ? "SCHEDULED" : "REGULAR";

                // 1. Persist the notification record (source of truth)
                const [notification] = await database
                    .insert(NotificationModel)
                    .values({
                        title,
                        body,
                        imageUrl,
                        redirectionLink,
                        roleFilter: roleFilter || null,
                        stateFilter: activeStateFilter || null,
                        districtFilter: activeDistrictFilter || null,
                        cityFilter: activeCityFilter || null,
                        pincodeFilter: pincodeFilter || null,
                        blockStatusFilter: activeBlockStatusFilter || null,
                        status: "PENDING",
                        type: notificationType,
                        scheduledAt: resolvedScheduledAt
                    })
                    .returning();

                // 2. Publish to the broadcast queue only if immediate or past due.
                if (!resolvedScheduledAt || resolvedScheduledAt <= now) {
                    await publishJob({
                        type: "notification",
                        payload: { notificationId: notification.id }
                    });

                    return res.status(200).json({
                        success: true,
                        message: "Notification queued successfully.",
                        data: notification
                    });
                } else {
                    return res.status(200).json({
                        success: true,
                        message: `Notification scheduled successfully for ${resolvedScheduledAt.toISOString()}.`,
                        data: notification
                    });
                }
            }

        } catch (error) {
            next(error);
        }
    }

    public static async getAllNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
            const offset = (page - 1) * limit;

            // --- Filters ---
            const { status, type, search, dateFrom, dateTo, scheduledFrom, scheduledTo } = req.query;

            const conditions: any[] = [];

            // Filter by notification status (PENDING | PROCESSING | FANNED_OUT | COMPLETED | FAILED)
            if (status) {
                const statuses = (status as string).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                if (statuses.length > 0) {
                    conditions.push(inArray(NotificationModel.status, statuses as any[]));
                }
            }

            // Filter by notification type (REGULAR | CAMPAIGN)
            if (type) {
                const types = (type as string).split(',').map(t => t.trim().toUpperCase()).filter(Boolean);
                if (types.length > 0) {
                    conditions.push(inArray(NotificationModel.type, types as any[]));
                }
            }

            // Full-text search across title and body (case-insensitive)
            if (search && (search as string).trim().length > 0) {
                const pattern = `%${(search as string).trim()}%`;
                conditions.push(
                    or(
                        ilike(NotificationModel.title, pattern),
                        ilike(NotificationModel.body, pattern)
                    )
                );
            }

            // Date range filter on createdAt
            if (dateFrom) {
                const from = new Date(dateFrom as string);
                if (!isNaN(from.getTime())) {
                    conditions.push(gte(NotificationModel.createdAt, from));
                }
            }
            if (dateTo) {
                const to = new Date(dateTo as string);
                if (!isNaN(to.getTime())) {
                    // Set time to end-of-day if only a date (no time) was provided
                    to.setHours(23, 59, 59, 999);
                    conditions.push(lte(NotificationModel.createdAt, to));
                }
            }

            // Date range filter on scheduledAt
            if (scheduledFrom) {
                const from = new Date(scheduledFrom as string);
                if (!isNaN(from.getTime())) {
                    conditions.push(gte(NotificationModel.scheduledAt, from));
                }
            }
            if (scheduledTo) {
                const to = new Date(scheduledTo as string);
                if (!isNaN(to.getTime())) {
                    to.setHours(23, 59, 59, 999);
                    conditions.push(lte(NotificationModel.scheduledAt, to));
                }
            }

            if (req.userDetails && Number(req.userDetails.userRoleId) === 1) {
                conditions.push(
                    inArray(
                        NotificationModel.id,
                        database.select({ id: NotificationLogModel.notificationId })
                            .from(NotificationLogModel)
                            .where(eq(NotificationLogModel.userId, req.userDetails.userId))
                    )
                );
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            const [{ total }] = await database
                .select({ total: count() })
                .from(NotificationModel)
                .where(whereClause);

            const notifications = await database
                .select()
                .from(NotificationModel)
                .where(whereClause)
                .orderBy(sql`${NotificationModel.createdAt} DESC`)
                .limit(limit)
                .offset(offset);

            return res.status(200).json({
                success: true,
                message: "Notifications fetched successfully.",
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getRolesForFilter(req: Request, res: Response, next: NextFunction) {
        try {
            const roles = await database.select().from(RoleModel);
            return res.status(200).json({
                success: true,
                message: "Roles fetched successfully.",
                data: roles
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getStatesForFilter(req: Request, res: Response, next: NextFunction) {
        try {
            const uniqueStates = await database.execute(sql`SELECT DISTINCT current_state FROM tbl_address WHERE current_state IS NOT NULL`);
            const states = uniqueStates.rows.map(row => row.current_state as string);
            return res.status(200).json({
                success: true,
                data: states
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getDistrictsForFilter(req: Request, res: Response, next: NextFunction) {
        try {
            const stateFilterRaw = req.query.state;
            let states: string[] = [];

            if (stateFilterRaw) {
                if (typeof stateFilterRaw === 'string') {
                    try {
                        let parsed = JSON.parse(stateFilterRaw);
                        states = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        states = stateFilterRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    }
                } else if (Array.isArray(stateFilterRaw)) {
                    states = stateFilterRaw.map(String);
                }
            }

            let query = sql`SELECT DISTINCT current_district FROM tbl_address WHERE current_district IS NOT NULL`;
            if (states.length > 0) {
                query = sql`SELECT DISTINCT current_district FROM tbl_address WHERE current_district IS NOT NULL AND current_state IN ${sql`(${sql.join(states.map(s => sql`${s}`), sql`, `)})`}`;
            }

            const uniqueDistricts = await database.execute(query);
            const districts = uniqueDistricts.rows.map(row => row.current_district as string);
            return res.status(200).json({
                success: true,
                data: districts
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getCitiesForFilter(req: Request, res: Response, next: NextFunction) {
        try {
            const districtFilterRaw = req.query.district;
            let districts: string[] = [];

            if (districtFilterRaw) {
                if (typeof districtFilterRaw === 'string') {
                    try {
                        let parsed = JSON.parse(districtFilterRaw);
                        districts = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        districts = districtFilterRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    }
                } else if (Array.isArray(districtFilterRaw)) {
                    districts = districtFilterRaw.map(String);
                }
            }

            let query = sql`SELECT DISTINCT current_city FROM tbl_address WHERE current_city IS NOT NULL`;
            if (districts.length > 0) {
                query = sql`SELECT DISTINCT current_city FROM tbl_address WHERE current_city IS NOT NULL AND current_district IN ${sql`(${sql.join(districts.map(s => sql`${s}`), sql`, `)})`}`;
            }

            const uniqueCities = await database.execute(query);
            const cities = uniqueCities.rows.map(row => row.current_city as string);
            return res.status(200).json({
                success: true,
                data: cities
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getPincodesForFilter(req: Request, res: Response, next: NextFunction) {
        try {
            const cityFilterRaw = req.query.city;
            let cities: string[] = [];

            if (cityFilterRaw) {
                if (typeof cityFilterRaw === 'string') {
                    try {
                        let parsed = JSON.parse(cityFilterRaw);
                        cities = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        cities = cityFilterRaw.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    }
                } else if (Array.isArray(cityFilterRaw)) {
                    cities = cityFilterRaw.map(String);
                }
            }

            let query = sql`SELECT DISTINCT current_pincode FROM tbl_address WHERE current_pincode IS NOT NULL`;

            if (cities.length > 0) {
                query = sql`SELECT DISTINCT current_pincode FROM tbl_address WHERE current_pincode IS NOT NULL AND current_city IN ${sql`(${sql.join(cities.map(s => sql`${s}`), sql`, `)})`}`;
            }

            const uniquePincodes = await database.execute(query);
            const pincodes = uniquePincodes.rows.map(row => row.current_pincode as number);
            return res.status(200).json({
                success: true,
                data: pincodes
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getBlockStatusesForFilter(req: Request, res: Response, next: NextFunction) {
        try {
            const uniqueStatuses = await database.execute(sql`SELECT unnest(enum_range(NULL::block_level_enum)) AS status`);
            const statuses = uniqueStatuses.rows.map(row => row.status as string);
            return res.status(200).json({
                success: true,
                data: statuses
            });
        } catch (error) {
            next(error);
        }
    }

    public static async calculateTargetUsers(req: Request, res: Response, next: NextFunction) {
        try {
            let { roleFilter, stateFilter, districtFilter, cityFilter, pincodeFilter, blockStatusFilter } = req.body;

            const parseStringArray = (input: any): string[] | undefined => {
                if (input === undefined) return undefined;
                if (typeof input === "string") {
                    try {
                        let parsed = JSON.parse(input);
                        return Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        return input.split(',').map(s => s.trim()).filter(s => s.length > 0);
                    }
                } else if (Array.isArray(input)) {
                    return input.map(String);
                } else {
                    return [String(input)];
                }
            };

            if (roleFilter !== undefined) {
                if (typeof roleFilter === "string") {
                    try {
                        let parsed = JSON.parse(roleFilter);
                        roleFilter = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        const split = roleFilter.split(',').map(Number).filter((n: number) => !isNaN(n));
                        if (split.length > 0) roleFilter = split;
                        else return res.status(400).json({ success: false, message: "Invalid roleFilter format." });
                    }
                } else if (typeof roleFilter === "number") {
                    roleFilter = [roleFilter];
                } else if (!Array.isArray(roleFilter)) {
                    return res.status(400).json({ success: false, message: "Invalid roleFilter format." });
                }
                roleFilter = roleFilter.map(Number);
            }

            const activeStateFilter = parseStringArray(stateFilter);
            const activeDistrictFilter = parseStringArray(districtFilter);
            const activeCityFilter = parseStringArray(cityFilter);
            const activeBlockStatusFilter = parseStringArray(blockStatusFilter);

            if (pincodeFilter !== undefined) {
                if (typeof pincodeFilter === "string") {
                    try {
                        let parsed = JSON.parse(pincodeFilter);
                        pincodeFilter = Array.isArray(parsed) ? parsed : [parsed];
                    } catch (e) {
                        const split = pincodeFilter.split(',').map(Number).filter((n: number) => !isNaN(n));
                        if (split.length > 0) pincodeFilter = split;
                        else return res.status(400).json({ success: false, message: "Invalid pincodeFilter format." });
                    }
                } else if (typeof pincodeFilter === "number") {
                    pincodeFilter = [pincodeFilter];
                } else if (!Array.isArray(pincodeFilter)) {
                    return res.status(400).json({ success: false, message: "Invalid pincodeFilter format." });
                }
                pincodeFilter = pincodeFilter.map(Number);
            }

            let geographicUserIds: number[] | null = null;
            const hasGeographicFilters =
                (activeStateFilter && activeStateFilter.length > 0) ||
                (activeDistrictFilter && activeDistrictFilter.length > 0) ||
                (activeCityFilter && activeCityFilter.length > 0) ||
                (pincodeFilter && pincodeFilter.length > 0);

            if (hasGeographicFilters) {
                const addressConditions = [];

                if (activeStateFilter && activeStateFilter.length > 0) {
                    addressConditions.push(inArray(AddressModel.currentState, activeStateFilter));
                }
                if (activeDistrictFilter && activeDistrictFilter.length > 0) {
                    addressConditions.push(inArray(AddressModel.currentDistrict, activeDistrictFilter));
                }
                if (activeCityFilter && activeCityFilter.length > 0) {
                    addressConditions.push(inArray(AddressModel.currentCity, activeCityFilter));
                }
                if (pincodeFilter && pincodeFilter.length > 0) {
                    addressConditions.push(inArray(AddressModel.currentPincode, pincodeFilter));
                }

                const matchedAddresses = await database
                    .select({ userId: AddressModel.userId })
                    .from(AddressModel)
                    .where(and(...addressConditions, isNotNull(AddressModel.userId)));

                geographicUserIds = [...new Set(matchedAddresses.map(a => a.userId as number))];

                if (geographicUserIds.length === 0) {
                    return res.status(200).json({ success: true, count: 0 });
                }
            }

            const conditions = [
                isNotNull(UserModel.fcmToken),
                gt(UserModel.fcmToken, "")
            ];

            if (roleFilter && roleFilter.length > 0) {
                conditions.push(inArray(UserModel.userRole, roleFilter));
            }

            if (activeBlockStatusFilter && activeBlockStatusFilter.length > 0) {
                conditions.push(inArray(UserModel.blockStatus, activeBlockStatusFilter as any[]));
            }

            if (geographicUserIds) {
                conditions.push(inArray(UserModel.userId, geographicUserIds));
            }

            const [{ total }] = await database
                .select({ total: count() })
                .from(UserModel)
                .where(and(...conditions));

            return res.status(200).json({
                success: true,
                count: total
            });

        } catch (error) {
            next(error);
        }
    }

    /**
     * Stage 1 — Fan-out.
     * Called by notification.consumer when a broadcast message arrives.
     * Fetches all users with a valid FCM token and publishes one
     * `notification.user` message per user. The per-user consumer handles
     * the actual Firebase send + logging.
     */
    public static async processNotification(notificationId: number): Promise<void> {
        // 1. Fetch the notification record
        const [notification] = await database
            .select()
            .from(NotificationModel)
            .where(eq(NotificationModel.id, notificationId))
            .limit(1);

        if (!notification) {
            throw new Error(`Notification ID ${notificationId} not found in DB`);
        }

        // Idempotency guard — skip if fan-out already done or terminal
        if (["FANNED_OUT", "COMPLETED", "FAILED"].includes(notification.status)) {
            console.log(`[notification.queue] Notification ID ${notificationId} already ${notification.status}, skipping.`);
            return;
        }

        console.log(`[notification.queue] Fan-out started for notification ID: ${notificationId}`);

        // 2. Mark as PROCESSING
        await database
            .update(NotificationModel)
            .set({ status: "PROCESSING", updatedAt: new Date() })
            .where(eq(NotificationModel.id, notificationId));

        // 3. Cursor-paginate users — constant memory regardless of user count.
        //    PAGE_SIZE controls how many rows are held in memory per iteration.
        //    Within each page, users are further split into BATCH_SIZE chunks
        //    (Firebase multicast limit) and published as separate queue messages.
        const PAGE_SIZE = 5_000;  // rows fetched per DB round-trip
        const BATCH_SIZE = 500;    // tokens per sendEachForMulticast call

        let lastUserId = 0;
        let totalUsers = 0;
        let batchCount = 0;

        // Pre-fetch geographical restrictions if any
        let geographicUserIds: number[] | null = null;
        const hasGeographicFilters =
            (notification.stateFilter && notification.stateFilter.length > 0) ||
            (notification.districtFilter && notification.districtFilter.length > 0) ||
            (notification.cityFilter && notification.cityFilter.length > 0) ||
            (notification.pincodeFilter && notification.pincodeFilter.length > 0);

        if (hasGeographicFilters) {
            const addressConditions = [];

            if (notification.stateFilter && notification.stateFilter.length > 0) {
                addressConditions.push(inArray(AddressModel.currentState, notification.stateFilter));
            }
            if (notification.districtFilter && notification.districtFilter.length > 0) {
                addressConditions.push(inArray(AddressModel.currentDistrict, notification.districtFilter));
            }
            if (notification.cityFilter && notification.cityFilter.length > 0) {
                addressConditions.push(inArray(AddressModel.currentCity, notification.cityFilter));
            }
            if (notification.pincodeFilter && notification.pincodeFilter.length > 0) {
                addressConditions.push(inArray(AddressModel.currentPincode, notification.pincodeFilter));
            }

            const matchedAddresses = await database
                .select({ userId: AddressModel.userId })
                .from(AddressModel)
                .where(and(...addressConditions, isNotNull(AddressModel.userId)));

            // Extract the user ids and remove duplicates.
            geographicUserIds = [...new Set(matchedAddresses.map(a => a.userId as number))];

            // If filters are applied but no users match, we can fast-fail.
            if (geographicUserIds.length === 0) {
                console.log(`[notification.queue] No users matched geographical filters. Marking COMPLETED.`);
                await database
                    .update(NotificationModel)
                    .set({ status: "COMPLETED", processedAt: new Date(), updatedAt: new Date() })
                    .where(eq(NotificationModel.id, notificationId));
                return;
            }
        }

        // Resolve signed URL for the image if it exists and is an object key (to support older HTTP urls as well)
        let resolvedImageUrl = notification.imageUrl;
        if (resolvedImageUrl && !resolvedImageUrl.startsWith('http')) {
            const signedUrl = await fileMiddleware.getFileSignedUrl(resolvedImageUrl, "notification", 604800);
            if (signedUrl) resolvedImageUrl = signedUrl;
        }

        while (true) {
            const conditions = [
                isNotNull(UserModel.fcmToken),
                gt(UserModel.fcmToken, ""),
                gt(UserModel.userId, lastUserId)
            ];

            if (notification.roleFilter && notification.roleFilter.length > 0) {
                conditions.push(inArray(UserModel.userRole, notification.roleFilter));
            }

            if (notification.blockStatusFilter && notification.blockStatusFilter.length > 0) {
                conditions.push(inArray(UserModel.blockStatus, notification.blockStatusFilter as any[]));
            }

            if (geographicUserIds) {
                // Use IN clause to intersect with geographical matches
                conditions.push(inArray(UserModel.userId, geographicUserIds));
            }

            const page = await database
                .select({ userId: UserModel.userId, fcmToken: UserModel.fcmToken })
                .from(UserModel)
                .where(and(...conditions))
                .orderBy(UserModel.userId)   // required for stable cursor
                .limit(PAGE_SIZE);

            if (page.length === 0) break;

            // Publish each 500-token Firebase batch from this page
            for (let i = 0; i < page.length; i += BATCH_SIZE) {
                const batch = page.slice(i, i + BATCH_SIZE);
                await publishJob({
                    type: "notification.user",
                    payload: {
                        notificationId: notification.id,
                        title: notification.title,
                        body: notification.body,
                        imageUrl: resolvedImageUrl,
                        redirectionLink: notification.redirectionLink,
                        scheduledAt: notification.scheduledAt?.toISOString() ?? null,
                        users: batch.map(u => ({ userId: u.userId, fcmToken: u.fcmToken! }))
                    } satisfies NotificationBatchPayload
                });
                batchCount++;
            }

            totalUsers += page.length;
            lastUserId = page[page.length - 1].userId;

            // If this page was smaller than PAGE_SIZE we've reached the end
            if (page.length < PAGE_SIZE) break;
        }

        if (totalUsers === 0) {
            console.log(`[notification.queue] No users with FCM tokens. Marking COMPLETED.`);
            await database
                .update(NotificationModel)
                .set({ status: "COMPLETED", processedAt: new Date(), updatedAt: new Date() })
                .where(eq(NotificationModel.id, notificationId));
            return;
        }

        // 4. FANNED_OUT — all batch messages enqueued across all pages.
        //    Consumers will mark COMPLETED once sentCount + failureCount = totalUsers.
        await database
            .update(NotificationModel)
            .set({
                status: "FANNED_OUT",
                totalUsers,
                updatedAt: new Date()
            })
            .where(eq(NotificationModel.id, notificationId));

        console.log(`[notification.queue] FANNED_OUT notification ID: ${notificationId}. ${totalUsers} users → ${batchCount} batch(es) (paginated, PAGE_SIZE=${PAGE_SIZE}).`);
    }

    /**
     * Stage 2 — Batch delivery via multicast.
     * Called by notification.user.consumer for each batch message.
     * Sends one sendEachForMulticast call (≤500 tokens), then logs
     * per-user results and syncs sentCount / failureCount from the log table.
     * Marks the notification COMPLETED when all users are accounted for,
     * or FAILED on a catastrophic error.
     */
    public static async sendBatch(payload: NotificationBatchPayload): Promise<void> {
        const { notificationId, title, body, imageUrl, scheduledAt, redirectionLink, users } = payload;
        const processedAt = new Date();

        try {
            const multicastMessage: admin.messaging.MulticastMessage = {
                tokens: users.map(u => u.fcmToken),
                notification: {
                    title,
                    body,
                    ...(imageUrl && { imageUrl })
                },
                data: {
                    ...(redirectionLink && { redirectionLink }),
                    notificationId: notificationId.toString()
                }
            };

            const batchResponse = await admin.messaging().sendEachForMulticast(multicastMessage);

            let successCount = 0;
            let failureCount = 0;

            // Build all log rows and tally counts in a single pass
            const logRows = batchResponse.responses.map((resp, i) => {
                const user = users[i];

                if (resp.success) {
                    successCount++;
                    console.log(`[notification.user] ✅ Sent to user ${user.userId}`);
                } else {
                    failureCount++;
                    console.warn(`[notification.user] ⚠️ Failed for user ${user.userId}: ${resp.error?.message ?? "Unknown Firebase error"}`);
                }

                return {
                    notificationId,
                    userId: user.userId,
                    status: resp.success ? "SENT" as const : "FAILED" as const,
                    failureReason: resp.success ? null : (resp.error?.message ?? "Unknown Firebase error"),
                    scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
                    processedAt
                };
            });

            // Single bulk INSERT — onConflictDoNothing makes this safe on redelivery
            await database.insert(NotificationLogModel).values(logRows).onConflictDoNothing();

            // Sync exact counts from notification_logs (immune to redelivery double-counting)
            await NotificationController.syncCounts(notificationId);

            // Check if all users processed → mark COMPLETED
            await NotificationController.checkAndComplete(notificationId);

            console.log(`[notification.user] Batch done — ✅ ${successCount} sent, ❌ ${failureCount} failed (notificationId=${notificationId})`);

        } catch (err: any) {
            // Catastrophic failure (Firebase unreachable, DB down, etc.) — mark FAILED
            console.error(`[notification.user] 🚨 Catastrophic batch failure for notificationId=${notificationId}:`, err);
            await database
                .update(NotificationModel)
                .set({ status: "FAILED", updatedAt: new Date() })
                .where(eq(NotificationModel.id, notificationId))
                .catch(() => { });
            throw err; // re-throw so the consumer nacks to DLQ
        }
    }

    /**
     * Checks whether sentCount + failureCount equals totalUsers.
     * If so, marks the notification as COMPLETED.
     * Runs after every batch so the last one to finish triggers completion.
     */
    private static async checkAndComplete(notificationId: number): Promise<void> {
        const [notification] = await database
            .select({
                status: NotificationModel.status,
                totalUsers: NotificationModel.totalUsers,
                sentCount: NotificationModel.sentCount,
                failureCount: NotificationModel.failureCount
            })
            .from(NotificationModel)
            .where(eq(NotificationModel.id, notificationId))
            .limit(1);

        if (!notification) return;

        const processed = (notification.sentCount ?? 0) + (notification.failureCount ?? 0);
        const total = notification.totalUsers ?? 0;

        if (total > 0 && processed >= total) {
            await database
                .update(NotificationModel)
                .set({ status: "COMPLETED", processedAt: new Date(), updatedAt: new Date() })
                .where(
                    // Only transition from FANNED_OUT — prevents overwriting an already-FAILED record
                    eq(NotificationModel.id, notificationId)
                );
            console.log(`[notification.user] 🏁 Notification ${notificationId} COMPLETED (${processed}/${total} users processed).`);
        }
    }

    public static async logResult(
        payload: NotificationUserPayload,
        success: boolean,
        failureReason: string | null = null,
        processedAt: Date = new Date()
    ): Promise<void> {
        await database.insert(NotificationLogModel).values({
            notificationId: payload.notificationId,
            userId: payload.userId,
            status: success ? "SENT" : "FAILED",
            failureReason: success ? null : failureReason,
            scheduledAt: payload.scheduledAt ? new Date(payload.scheduledAt) : null,
            processedAt
        });
    }

    /**
     * Recomputes sentCount / failureCount by counting rows in notification_logs
     * and writes the exact values back to NotificationModel in one UPDATE.
     * Safe to call multiple times — idempotent by design.
     */
    public static async syncCounts(notificationId: number): Promise<void> {
        const rows = await database
            .select({
                status: NotificationLogModel.status,
                total: count()
            })
            .from(NotificationLogModel)
            .where(eq(NotificationLogModel.notificationId, notificationId))
            .groupBy(NotificationLogModel.status);

        const sentCount = rows.find(r => r.status === "SENT")?.total ?? 0;
        const failureCount = rows.find(r => r.status === "FAILED")?.total ?? 0;

        await database
            .update(NotificationModel)
            .set({ sentCount, failureCount })
            .where(eq(NotificationModel.id, notificationId));
    }

    public static async getNotificationLogs(req: Request, res: Response, next: NextFunction) {
        try {
            const notificationId = parseInt(req.params.notificationId, 10);
            if (isNaN(notificationId)) {
                return res.status(400).json({ success: false, message: "Invalid notification ID." });
            }

            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
            const offset = (page - 1) * limit;

            const [{ total }] = await database
                .select({ total: count() })
                .from(NotificationLogModel)
                .where(eq(NotificationLogModel.notificationId, notificationId));

            const logs = await database
                .select()
                .from(NotificationLogModel)
                .where(eq(NotificationLogModel.notificationId, notificationId))
                .orderBy(sql`${NotificationLogModel.createdAt} DESC`)
                .limit(limit)
                .offset(offset);

            return res.status(200).json({
                success: true,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data: logs
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getCampaigns(req: Request, res: Response, next: NextFunction) {
        try {
            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
            const offset = (page - 1) * limit;

            // --- Filters ---
            const { status, recurrence, search, startFrom, startTo, endFrom, endTo } = req.query;

            const conditions: any[] = [];

            // Filter by campaign status (ACTIVE | COMPLETED | CANCELLED)
            if (status) {
                const statuses = (status as string).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                if (statuses.length > 0) {
                    conditions.push(inArray(CampaignModel.status, statuses as any[]));
                }
            }

            // Filter by recurrence (HOURLY | DAILY | WEEKLY | MONDAY … SUNDAY)
            if (recurrence) {
                const recurrences = (recurrence as string).split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
                if (recurrences.length > 0) {
                    conditions.push(inArray(CampaignModel.recurrence, recurrences as any[]));
                }
            }

            // Case-insensitive search on campaign name
            if (search && (search as string).trim().length > 0) {
                conditions.push(ilike(CampaignModel.name, `%${(search as string).trim()}%`));
            }

            // Date range filter on startDate
            if (startFrom) {
                const from = new Date(startFrom as string);
                if (!isNaN(from.getTime())) conditions.push(gte(CampaignModel.startDate, from));
            }
            if (startTo) {
                const to = new Date(startTo as string);
                if (!isNaN(to.getTime())) {
                    to.setHours(23, 59, 59, 999);
                    conditions.push(lte(CampaignModel.startDate, to));
                }
            }

            // Date range filter on endDate
            if (endFrom) {
                const from = new Date(endFrom as string);
                if (!isNaN(from.getTime())) conditions.push(gte(CampaignModel.endDate, from));
            }
            if (endTo) {
                const to = new Date(endTo as string);
                if (!isNaN(to.getTime())) {
                    to.setHours(23, 59, 59, 999);
                    conditions.push(lte(CampaignModel.endDate, to));
                }
            }

            const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

            const [{ total }] = await database
                .select({ total: count() })
                .from(CampaignModel)
                .where(whereClause);

            const campaigns = await database
                .select()
                .from(CampaignModel)
                .where(whereClause)
                .orderBy(sql`${CampaignModel.createdAt} DESC`)
                .limit(limit)
                .offset(offset);

            return res.status(200).json({
                success: true,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data: campaigns
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getCampaignNotifications(req: Request, res: Response, next: NextFunction) {
        try {
            const campaignId = parseInt(req.params.campaignId, 10);
            if (isNaN(campaignId)) {
                return res.status(400).json({ success: false, message: "Invalid campaign ID." });
            }

            const page = Math.max(1, parseInt(req.query.page as string) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
            const offset = (page - 1) * limit;

            // --- Filters ---
            const { status, scheduledFrom, scheduledTo } = req.query;

            const conditions: any[] = [eq(NotificationModel.campaignId, campaignId)];

            // Filter by notification status (PENDING | PROCESSING | FANNED_OUT | COMPLETED | FAILED)
            if (status) {
                const statuses = (status as string).split(',').map(s => s.trim().toUpperCase()).filter(Boolean);
                if (statuses.length > 0) {
                    conditions.push(inArray(NotificationModel.status, statuses as any[]));
                }
            }

            // Date range filter on scheduledAt
            if (scheduledFrom) {
                const from = new Date(scheduledFrom as string);
                if (!isNaN(from.getTime())) conditions.push(gte(NotificationModel.scheduledAt, from));
            }
            if (scheduledTo) {
                const to = new Date(scheduledTo as string);
                if (!isNaN(to.getTime())) {
                    to.setHours(23, 59, 59, 999);
                    conditions.push(lte(NotificationModel.scheduledAt, to));
                }
            }

            const whereClause = and(...conditions);

            const [{ total }] = await database
                .select({ total: count() })
                .from(NotificationModel)
                .where(whereClause);

            const notifications = await database
                .select()
                .from(NotificationModel)
                .where(whereClause)
                .orderBy(sql`${NotificationModel.scheduledAt} ASC`)
                .limit(limit)
                .offset(offset);

            return res.status(200).json({
                success: true,
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
                data: notifications
            });
        } catch (error) {
            next(error);
        }
    }

    public static async getNotificationImageUrl(req: Request, res: Response, next: NextFunction) {
        try {
            const notificationId = parseInt(req.params.notificationId, 10);
            if (isNaN(notificationId)) {
                return res.status(400).json({ success: false, message: "Invalid notification ID." });
            }

            const [notification] = await database
                .select({ imageUrl: NotificationModel.imageUrl })
                .from(NotificationModel)
                .where(eq(NotificationModel.id, notificationId))
                .limit(1);

            if (!notification) {
                return res.status(404).json({ success: false, message: "Notification not found." });
            }

            if (!notification.imageUrl) {
                return res.status(404).json({ success: false, message: "Notification has no image." });
            }

            // If it's already an HTTP URL (from legacy records), just return it
            if (notification.imageUrl.startsWith('http')) {
                return res.status(200).json({ success: true, url: notification.imageUrl });
            }

            // Otherwise resolve the signed URL
            const signedUrl = await fileMiddleware.getFileSignedUrl(notification.imageUrl, "notification", 604800);
            if (!signedUrl) {
                return res.status(500).json({ success: false, message: "Failed to generate signed URL." });
            }

            return res.status(200).json({ success: true, url: signedUrl });
        } catch (error) {
            next(error);
        }
    }
}
