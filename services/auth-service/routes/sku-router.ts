import express, { Router } from "express";
import { authMiddleware } from "../middlewares/auth-middleware";
import { skuMasterController } from "../controllers";

const router: Router = express.Router();

// SKU Routes
router.get("/active", authMiddleware.verifyToken, skuMasterController.fetchActiveSkus);
router.get("/skus", authMiddleware.verifyToken, skuMasterController.fetchActiveSkus);
router.post("/skus/bulk", authMiddleware.verifyToken, skuMasterController.createSkusBulk);
router.post("/skus", authMiddleware.verifyToken, skuMasterController.createSku);
router.put("/skus/:id", authMiddleware.verifyToken, skuMasterController.updateSku);
router.delete("/skus/:id", authMiddleware.verifyToken, skuMasterController.deleteSku);
router.get("/shock-replacement-config", authMiddleware.verifyToken, skuMasterController.getShockReplacementSkus);
router.get("/shock-replacement-selected", authMiddleware.verifyToken, skuMasterController.getSelectedShockReplacementSkus);
router.get("/shock-replacement-selected/details",authMiddleware.adminVerifyToken,skuMasterController.getSelectedShockReplacementDetailsForReport);
router.post("/shock-replacement/submit", authMiddleware.verifyToken, skuMasterController.submitShockReplacementSelection);
router.post("/shock-replacement-config", authMiddleware.verifyToken, skuMasterController.createShockReplacementSku);
router.delete("/shock-replacement-config/:sku", authMiddleware.verifyToken, skuMasterController.deleteShockReplacementSku);

// Category Routes
router.get("/categories", authMiddleware.verifyToken, skuMasterController.fetchActiveCategories);
router.get("/categories/all", authMiddleware.verifyToken, skuMasterController.fetchAllCategories);
router.get("/categories/check-shortcode", authMiddleware.verifyToken, skuMasterController.checkCategoryShortCodeAvailability);
router.post("/categories/bulk", authMiddleware.verifyToken, skuMasterController.createCategoriesBulk);
router.post("/categories", authMiddleware.verifyToken, skuMasterController.createCategory);
router.put("/categories/:id", authMiddleware.verifyToken, skuMasterController.updateCategory);
router.delete("/categories/:id", authMiddleware.verifyToken, skuMasterController.deleteCategory);

// Subcategory Routes
router.get(
    "/categories/:categoryId/subcategories",
    authMiddleware.verifyToken,
    skuMasterController.fetchActiveSubCategoriesForCategory
);

router.get(
    "/categories/:categoryId/subcategories/all",
    authMiddleware.verifyToken,
    skuMasterController.fetchAllSubCategoriesForCategory
);

router.post("/subcategories/bulk", authMiddleware.verifyToken, skuMasterController.createSubCategoriesBulk);

router.post("/subcategories", authMiddleware.verifyToken, skuMasterController.createSubCategory);

router.put("/subcategories/:id", authMiddleware.verifyToken, skuMasterController.updateSubCategory);

router.delete("/subcategories/:id", authMiddleware.verifyToken, skuMasterController.deleteSubCategory);

router.get(
    "/categories/:categoryId/subcategories/:subCategoryId/skus",
    authMiddleware.verifyToken,
    skuMasterController.fetchActiveSkusForCategoryAndSubCategory
);

router.get(
    "/subcategories/:subCategoryId/skus",
    authMiddleware.verifyToken,
    skuMasterController.fetchActiveSkusForSubCategory
);

router.get(
    "/subcategories/:subCategoryId/skus/all",
    authMiddleware.verifyToken,
    skuMasterController.fetchAllSkusForSubCategory
);

export default router;