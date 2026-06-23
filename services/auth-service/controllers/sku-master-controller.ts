import { Request, Response, NextFunction } from "express";
import { skuRepository } from "../repositories";
import { customValidators } from "../utils/custom-validators";
import { CustomError } from "../types";

class SkuMasterController {
    customError: CustomError;
    constructor() {
        this.customError = new CustomError({
            responseMessage: "",
            responseCode: 400
        })
    }

    fetchActiveSkus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const category = String(req?.query?.category) || "";
            const subCategory = String(req?.query?.subCategory) || "";
            const { data, total } = await skuRepository.getAllActiveSkus({ page, limit, category, subCategory });
            return res.json({
                message: "Skus fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    };

    fetchActiveCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const { data, total } = await skuRepository.getActiveCategories({ page, limit });
            return res.json({
                message: "Categories fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    };

    fetchAllCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const { data, total } = await skuRepository.getAllCategories({ page, limit });
            return res.json({
                message: "All categories fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    };

    checkCategoryShortCodeAvailability = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { shortCode } = req.query;
            if (!shortCode || typeof shortCode !== "string" || shortCode.trim() === "") {
                return res.status(400).json({
                    message: "shortCode query parameter is required",
                    code: 400,
                });
            }
            const isTaken = await skuRepository.isCategoryShortCodeTaken(shortCode.trim().toUpperCase());
            if (isTaken) {
                return res.status(409).json({
                    message: "Short code is already taken",
                    code: 409,
                    data: { shortCode: shortCode.trim().toUpperCase(), available: false },
                });
            }
            return res.json({
                message: "Short code is available",
                code: 200,
                data: { shortCode: shortCode.trim().toUpperCase(), available: true },
            });
        } catch (error) {
            next(error);
        }
    };

    fetchActiveSubCategoriesForCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { categoryId } = req.params;
            const parsedCategoryId = Number(categoryId);
            if (isNaN(parsedCategoryId)) {
                return res.status(400).json({ message: "Invalid category ID", code: 400 });
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const { data, total } = await skuRepository.getActiveSubCategoriesForCategory(parsedCategoryId, { page, limit });
            return res.json({
                message: "Subcategories fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    };

    fetchAllSubCategoriesForCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { categoryId } = req.params;
            const parsedCategoryId = Number(categoryId);
            if (isNaN(parsedCategoryId)) {
                return res.status(400).json({ message: "Invalid category ID", code: 400 });
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const { data, total } = await skuRepository.getAllSubCategoriesForCategory(parsedCategoryId, { page, limit });
            return res.json({
                message: "All subcategories fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    };

    fetchActiveSkusForCategoryAndSubCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { categoryId, subCategoryId } = req.params;
            const parsedCategoryId = Number(categoryId);
            const parsedSubCategoryId = Number(subCategoryId);
            if (isNaN(parsedCategoryId) || isNaN(parsedSubCategoryId)) {
                return res.status(400).json({ message: "Invalid category or subcategory ID", code: 400 });
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const { data, total } = await skuRepository.getActiveSkusForCategoryAndSubCategory(parsedCategoryId, parsedSubCategoryId, { page, limit });
            return res.json({
                message: "Skus fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    fetchActiveSkusForSubCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { subCategoryId } = req.params;
            const parsedSubCategoryId = Number(subCategoryId);
            if (isNaN(parsedSubCategoryId)) {
                return res.status(400).json({ message: "Invalid subcategory ID", code: 400 });
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const { data, total } = await skuRepository.getActiveSkusForSubCategory(parsedSubCategoryId, { page, limit });
            return res.json({
                message: "Skus fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    fetchAllSkusForSubCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { subCategoryId } = req.params;
            const parsedSubCategoryId = Number(subCategoryId);
            if (isNaN(parsedSubCategoryId)) {
                return res.status(400).json({ message: "Invalid subcategory ID", code: 400 });
            }
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 10));
            const { data, total } = await skuRepository.getAllSkusForSubCategory(parsedSubCategoryId, { page, limit });
            return res.json({
                message: "All skus fetched successfully",
                code: 200,
                data,
                pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
            });
        } catch (error) {
            next(error);
        }
    }

    // Category CRUD
    createCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = customValidators.validateCategory(req.body);
            const isTaken = await skuRepository.isCategoryShortCodeTaken(data.categoryShortCode.toUpperCase());
            if (isTaken) {
                return res.status(400).json({
                    message: `Category short code "${data.categoryShortCode.toUpperCase()}" is already in use`,
                    code: 400,
                });
            }
            const category = await skuRepository.createCategory({
                ...data,
                categoryShortCode: data.categoryShortCode.toUpperCase(),
            });
            return res.status(201).json({
                message: "Category created successfully",
                code: 201,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    createCategoriesBulk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.body;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({
                    message: "Request body must be a non-empty array of categories",
                    code: 400,
                });
            }

            // Validate and normalise each item individually
            const validItems: any[] = [];
            const preResults: any[] = [];

            for (const item of payload) {
                try {
                    const validated = customValidators.validateCategory(item);
                    validItems.push({
                        ...validated,
                        categoryShortCode: validated.categoryShortCode.toUpperCase(),
                    });
                } catch (err: any) {
                    preResults.push({
                        categoryName: item?.categoryName ?? null,
                        categoryShortCode: item?.categoryShortCode ?? null,
                        status: "failed",
                        error: err?.responseMessage || err?.message || "Validation error",
                    });
                }
            }

            const bulkResults = validItems.length > 0
                ? await skuRepository.createCategoriesBulk(validItems)
                : [];

            const allResults = [...preResults, ...bulkResults];
            const created = allResults.filter(r => r.status === "created").length;
            const failed = allResults.filter(r => r.status === "failed").length;

            let message = "All categories created successfully";
            if (created > 0 && failed > 0) message = "Partial success: some categories were created, others failed";
            else if (created === 0) message = "Failed to create any categories";

            return res.status(created > 0 ? 201 : 400).json({
                message,
                code: created > 0 ? 201 : 400,
                data: {
                    summary: { total: allResults.length, created, failed },
                    results: allResults,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    updateCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categoryId = Number(req.params.id);
            if (isNaN(categoryId)) throw new Error("Invalid Category ID");
            const data = req.body;
            const category = await skuRepository.updateCategory(categoryId, data);
            // If being deactivated, cascade to children
            if (data.isActive === false) {
                await skuRepository.cascadeDeactivateCategory(categoryId);
            }
            return res.json({
                message: "Category updated successfully",
                code: 200,
                data: category
            });
        } catch (error) {
            next(error);
        }
    }

    deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const categoryId = Number(req.params.id);
            if (isNaN(categoryId)) throw new Error("Invalid Category ID");
            await skuRepository.deactivateCategory(categoryId);
            await skuRepository.cascadeDeactivateCategory(categoryId);
            return res.json({
                message: "Category deleted successfully",
                code: 200
            });
        } catch (error) {
            next(error);
        }
    }

    // SubCategory CRUD
    createSubCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = customValidators.validateSubCategory(req.body);
            const subCategory = await skuRepository.createSubCategory(data);
            return res.status(201).json({
                message: "Subcategory created successfully",
                code: 201,
                data: subCategory
            });
        } catch (error) {
            next(error);
        }
    }

    createSubCategoriesBulk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.body;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({
                    message: "Request body must be a non-empty array of subcategories",
                    code: 400,
                });
            }

            // 1. Validate syntax and collect valid items
            const parsedItems: any[] = [];
            const preResults: any[] = [];

            for (const item of payload) {
                try {
                    const validated = customValidators.validateSubCategoryBulk(item);
                    parsedItems.push(validated);
                } catch (err: any) {
                    preResults.push({
                        subCategoryName: item?.subCategoryName ?? null,
                        status: "failed",
                        error: err?.responseMessage || err?.message || "Validation error",
                    });
                }
            }

            // 2. Resolve category names to IDs
            let bulkResults: any[] = [];
            if (parsedItems.length > 0) {
                const uniqueCategoryNames = Array.from(new Set(parsedItems.map(p => p.categoryName)));
                const categories = await skuRepository.getCategoriesByNames(uniqueCategoryNames);
                const categoryMap = new Map(categories.map(c => [c.categoryName, c.categoryId]));

                const itemsToInsert: any[] = [];
                for (const item of parsedItems) {
                    const mappedId = categoryMap.get(item.categoryName);
                    if (!mappedId) {
                        preResults.push({
                            subCategoryName: item.subCategoryName,
                            status: "failed",
                            error: `Category name "${item.categoryName}" not found`,
                        });
                    } else {
                        // Transform item to match DB schema (swap categoryName for categoryId)
                        itemsToInsert.push({
                            categoryId: mappedId,
                            subCategoryName: item.subCategoryName,
                            subCategoryDescription: item.subCategoryDescription,
                            fileUrl: item.fileUrl,
                        });
                    }
                }

                if (itemsToInsert.length > 0) {
                    bulkResults = await skuRepository.createSubCategoriesBulk(itemsToInsert);
                }
            }

            // 3. Summarize outcomes
            const allResults = [...preResults, ...bulkResults];
            const created = allResults.filter(r => r.status === "created").length;
            const failed = allResults.filter(r => r.status === "failed").length;

            let message = "All subcategories created successfully";
            if (created > 0 && failed > 0) message = "Partial success: some subcategories were created, others failed";
            else if (created === 0) message = "Failed to create any subcategories";

            return res.status(created > 0 ? 201 : 400).json({
                message,
                code: created > 0 ? 201 : 400,
                data: {
                    summary: { total: allResults.length, created, failed },
                    results: allResults,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    updateSubCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const subCategoryId = Number(req.params.id);
            if (isNaN(subCategoryId)) throw new Error("Invalid Subcategory ID");
            const data = req.body;
            // Guard: cannot activate subcategory if parent category is inactive
            if (data.isActive === true) {
                const subCategory = await skuRepository.getSubCategoryById(subCategoryId);
                if (!subCategory) {
                    return res.status(404).json({ message: "Subcategory not found", code: 404 });
                }
                const parentActive = await skuRepository.isParentCategoryActive(subCategory.categoryId);
                if (!parentActive) {
                    return res.status(400).json({
                        message: "Cannot activate subcategory because its parent category is inactive",
                        code: 400,
                    });
                }
            }
            const subCategory = await skuRepository.updateSubCategory(subCategoryId, data);
            // Cascade: if deactivating, also deactivate child SKUs
            if (data.isActive === false) {
                await skuRepository.cascadeDeactivateSubCategory(subCategoryId);
            }
            return res.json({
                message: "Subcategory updated successfully",
                code: 200,
                data: subCategory
            });
        } catch (error) {
            next(error);
        }
    }

    deleteSubCategory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const subCategoryId = Number(req.params.id);
            if (isNaN(subCategoryId)) throw new Error("Invalid Subcategory ID");
            await skuRepository.deactivateSubCategory(subCategoryId);
            await skuRepository.cascadeDeactivateSubCategory(subCategoryId);
            return res.json({
                message: "Subcategory deleted successfully",
                code: 200
            });
        } catch (error) {
            next(error);
        }
    }

    // SKU CRUD
    createSku = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = customValidators.validateSkuArray(req.body);
            const { created, errors } = await skuRepository.createSku(data);

            const hasCreated = created.length > 0;
            const hasErrors = errors.length > 0;

            let message = "SKUs created successfully";
            if (hasCreated && hasErrors) {
                message = "Partial success: Some SKUs were created, while others failed.";
            } else if (!hasCreated && hasErrors) {
                message = "Failed to create any SKUs.";
            }

            return res.json({
                message,
                code: 200,
                data: {
                    created,
                    errors
                }
            });
        } catch (error) {
            next(error);
        }
    }

    createSkusBulk = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = req.body;
            if (!Array.isArray(payload) || payload.length === 0) {
                return res.status(400).json({
                    message: "Request body must be a non-empty array of SKUs",
                    code: 400,
                });
            }

            // 1. Validate syntax and collect valid items
            const parsedItems: any[] = [];
            const preResults: any[] = [];

            for (const item of payload) {
                try {
                    const validated = customValidators.validateSkuBulk(item);
                    parsedItems.push(validated);
                } catch (err: any) {
                    preResults.push({
                        skuCode: item?.skuCode ?? null,
                        status: "failed",
                        error: err?.responseMessage || err?.message || "Validation error",
                    });
                }
            }

            // 2. Resolve subCategory names to IDs (both subCategoryId and categoryId)
            let bulkResults: any[] = [];
            if (parsedItems.length > 0) {
                const uniqueSubCategoryNames = Array.from(new Set(parsedItems.map(p => p.subCategoryName)));
                const subCategories = await skuRepository.getSubCategoriesByNames(uniqueSubCategoryNames);
                const subCategoryMap = new Map(subCategories.map(sc => [sc.subCategoryName, sc]));

                const itemsToInsert: any[] = [];
                for (const item of parsedItems) {
                    const mappedSubCategory = subCategoryMap.get(item.subCategoryName);
                    if (!mappedSubCategory) {
                        preResults.push({
                            skuCode: item.skuCode,
                            status: "failed",
                            error: `Subcategory name "${item.subCategoryName}" not found`,
                        });
                    } else {
                        // Transform item to match DB schema
                        itemsToInsert.push({
                            categoryId: mappedSubCategory.categoryId,
                            subCategoryId: mappedSubCategory.subCategoryId,
                            skuName: item.skuName,
                            skuCode: item.skuCode,
                            skuDescription: item.skuDescription,
                            productValue: item.productValue,
                            points: item.points,
                        });
                    }
                }

                if (itemsToInsert.length > 0) {
                    bulkResults = await skuRepository.createSkusBulk(itemsToInsert);
                }
            }

            // 3. Summarize outcomes
            const allResults = [...preResults, ...bulkResults];
            const created = allResults.filter(r => r.status === "created").length;
            const failed = allResults.filter(r => r.status === "failed").length;

            let message = "All SKUs created successfully";
            if (created > 0 && failed > 0) message = "Partial success: some SKUs were created, others failed";
            else if (created === 0) message = "Failed to create any SKUs";

            return res.status(created > 0 ? 201 : 400).json({
                message,
                code: created > 0 ? 201 : 400,
                data: {
                    summary: { total: allResults.length, created, failed },
                    results: allResults,
                },
            });
        } catch (error) {
            next(error);
        }
    }

    updateSku = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const skuId = Number(req.params.id);
            if (isNaN(skuId)) throw new Error("Invalid SKU ID");
            const data = req.body;
            // Guard: cannot activate SKU if parent subcategory or category is inactive
            if (data.isActive === true) {
                const sku = await skuRepository.getSkuById(skuId);
                if (!sku) {
                    return res.status(404).json({ message: "SKU not found", code: 404 });
                }
                const subCategory = await skuRepository.getSubCategoryById(sku.subCategoryId);
                if (!subCategory?.isActive) {
                    return res.status(400).json({
                        message: "Cannot activate SKU because its parent subcategory is inactive",
                        code: 400,
                    });
                }
                const parentActive = await skuRepository.isParentCategoryActive(sku.categoryId);
                if (!parentActive) {
                    return res.status(400).json({
                        message: "Cannot activate SKU because its parent category is inactive",
                        code: 400,
                    });
                }
            }
            const sku = await skuRepository.updateSku(skuId, data);
            return res.json({
                message: "SKU updated successfully",
                code: 200,
                data: sku
            });
        } catch (error) {
            next(error);
        }
    }

    deleteSku = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const skuId = Number(req.params.id);
            if (isNaN(skuId)) throw new Error("Invalid SKU ID");
            await skuRepository.deactivateSku(skuId);
            return res.json({
                message: "SKU deleted successfully",
                code: 200
            });
        } catch (error) {
            next(error);
        }
    }

    getShockReplacementSkus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const data = await skuRepository.getShockReplacementSkus();
            return res.json({
                message: "Shock replacement SKUs fetched successfully",
                code: 200,
                data,
            });
        } catch (error) {
            next(error);
        }
    }

    getSelectedShockReplacementSkus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const skip = req.query.skip !== undefined ? Math.max(0, Number(req.query.skip) || 0) : Math.max(0, Number(req.body?.skip) || 0);
            const limit = req.query.limit !== undefined ? Math.min(100, Math.max(1, Number(req.query.limit) || 10)) : Math.min(100, Math.max(1, Number(req.body?.limit) || 10));

            const userIdQuery = req.query.userId !== undefined ? Number(req.query.userId) : undefined;
            const userIdBody = req.body?.userId !== undefined ? Number(req.body.userId) : undefined;
            const userId = userIdQuery !== undefined ? userIdQuery : userIdBody;

            if (userId !== undefined && (!Number.isInteger(userId) || userId <= 0)) {
                return res.status(400).json({
                    message: "Valid userId must be a positive integer",
                    code: 400,
                });
            }

            const result = await skuRepository.getSelectedShockReplacementSkus({ skip, limit, userId });
            return res.json({
                message: "Selected shock replacement SKUs fetched successfully",
                code: 200,
                data: result
            });
        } catch (error) {
            next(error);
        }
    }

    getSelectedShockReplacementDetailsForReport = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const month = Number(req.query.month);
            const year = Number(req.query.year);
            const userId = req.query.userId !== undefined ? Number(req.query.userId) : undefined;
            const userName = typeof req.query.userName === "string" ? req.query.userName.trim() : undefined;
            const submittedDate = typeof req.query.date === "string" ? req.query.date.trim() : undefined;
            const page = Math.max(1, Number(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

            if (!Number.isInteger(month) || month < 1 || month > 12) {
                return res.status(400).json({
                    message: "Valid month is required (1-12)",
                    code: 400,
                });
            }

            if (!Number.isInteger(year) || year < 2000 || year > 2100) {
                return res.status(400).json({
                    message: "Valid year is required",
                    code: 400,
                });
            }

            if (req.query.userId !== undefined && (!Number.isInteger(userId) || Number(userId) <= 0)) {
                return res.status(400).json({
                    message: "userId must be a positive integer",
                    code: 400,
                });
            }

            if (submittedDate !== undefined && !/^\d{4}-\d{2}-\d{2}$/.test(submittedDate)) {
                return res.status(400).json({
                    message: "date must be in YYYY-MM-DD format",
                    code: 400,
                });
            }

            const { data, total } = await skuRepository.getSelectedShockReplacementDetailsForReport({
                month,
                year,
                userId,
                page,
                limit,
            });

            return res.json({
                message: "Selected shock replacement details fetched successfully",
                code: 200,
                data,
                pagination: {
                    total,
                    page,
                    limit,
                    totalPages: Math.ceil(total / limit),
                },
            });
        } catch (error) {
            next(error);
        }
    }

    createShockReplacementSku = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const candidateSku = req.body?.sku ?? req.body?.sku_code ?? req.body?.skuCode ?? req.body?.skuId;
            const rawSku =
                typeof candidateSku === "object" && candidateSku !== null
                    ? candidateSku.value ?? candidateSku.sku ?? candidateSku.sku_code ?? candidateSku.skuCode ?? candidateSku.skuId
                    : candidateSku;
            const skuInput = typeof rawSku === "string" ? rawSku.trim() : rawSku;

            if (
                skuInput === undefined ||
                skuInput === null ||
                String(skuInput).trim() === ""
            ) {
                return res.status(400).json({
                    message: "Valid sku is required (sku/sku_code/skuCode/skuId)",
                    code: 400,
                });
            }

            const createdByValue = Number(req?.userDetails?.userId || req?.user?.userId || req.body?.createdBy || 0);
            const createdBy = Number.isFinite(createdByValue) && createdByValue > 0 ? createdByValue : null;
            const created = await skuRepository.createShockReplacementSku(skuInput, createdBy);
            return res.status(201).json({
                message: "Shock replacement SKU created successfully",
                code: 201,
                data: created,
            });
        } catch (error) {
            next(error);
        }
    }

    submitShockReplacementSelection = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const submittedSkus = Array.isArray(req.body)
                ? req.body
                : req.body?.skus ?? req.body?.selectedSkus ?? req.body?.skuCodes;
            if (!Array.isArray(submittedSkus) || submittedSkus.length === 0) {
                return res.status(400).json({
                    message: "Request body must be a non-empty array of items with sku and quantity",
                    code: 400,
                });
            }

            const userId = Number(req?.userDetails?.userId || req.body?.userId || 0);
            if (!Number.isFinite(userId) || userId <= 0) {
                return res.status(400).json({
                    message: "Valid userId is required",
                    code: 400,
                });
            }

            const createdByValue = Number(req?.userDetails?.userId || req?.user?.userId || req.body?.createdBy || userId);
            const createdBy = Number.isFinite(createdByValue) && createdByValue > 0 ? createdByValue : userId;
            const created = await skuRepository.saveSelectedShockReplacementSkus(userId, submittedSkus, createdBy);

            return res.status(201).json({
                message: "Shock replacement selection submitted successfully",
                code: 201,
                data: created,
            });
        } catch (error) {
            next(error);
        }
    }

    deleteShockReplacementSku = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const skuInput = typeof req.params?.sku === "string" ? req.params.sku.trim() : req.params?.sku;
            if (skuInput === undefined || skuInput === null || String(skuInput).trim() === "") {
                return res.status(400).json({
                    message: "Valid sku param is required",
                    code: 400,
                });
            }

            const deleted = await skuRepository.deleteShockReplacementSku(skuInput);
            if (!deleted) {
                return res.status(404).json({
                    message: "Shock replacement SKU not found",
                    code: 404,
                });
            }

            return res.json({
                message: "Shock replacement SKU deleted successfully",
                code: 200,
                data: deleted,
            });
        } catch (error) {
            next(error);
        }
    }
}

export const skuMasterController = new SkuMasterController();
