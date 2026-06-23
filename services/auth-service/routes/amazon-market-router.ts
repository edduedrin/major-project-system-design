import express, { Router } from "express";
import { amazonMarketController } from "../controllers";
import { authMiddleware } from "../middlewares/auth-middleware";
import { fileMiddleware } from "../middlewares/file-middleware";

const router: Router = express.Router();
const fields = [
    { name: "productImage", maxCount: 1 },
    { name: "categoryImage", maxCount: 1 },
    { name: "subCategoryImage", maxCount: 1 }
];

router.post("/product-categories", authMiddleware.verifyToken, amazonMarketController.productCategories);
router.post("/products", authMiddleware.verifyToken, amazonMarketController.fetchProducts);
router.post("/add-products", authMiddleware.verifyToken, amazonMarketController.addProducts);
router.post(
    "/edit-product",
    authMiddleware.verifyToken,
    fileMiddleware.acceptMultipleFields(fields),
    amazonMarketController.editProduct
);
router.post("/add-cart", authMiddleware.verifyToken, amazonMarketController.addToCart);
router.post("/list-cart", authMiddleware.verifyToken, amazonMarketController.viewCart);
router.post("/update-cart", authMiddleware.verifyToken, amazonMarketController.updateCart);
router.post("/remove-cart", authMiddleware.verifyToken, amazonMarketController.removeFromCart);

router.post("/add-wishlist", authMiddleware.verifyToken, amazonMarketController.addToWishlist);
router.post("/list-wishlist", authMiddleware.verifyToken, amazonMarketController.viewWishlist);
router.post("/remove-wishlist", authMiddleware.verifyToken, amazonMarketController.removeFromWishlist);

router.post("/create-order", authMiddleware.verifyToken, amazonMarketController.createOrder);
router.post("/list-orders", authMiddleware.verifyToken, amazonMarketController.orderHistory);
router.post("/update-delivery-status", authMiddleware.adminVerifyToken, amazonMarketController.updateDeliveryStatus);
router.get("/delivery-statuses", authMiddleware.verifyToken, amazonMarketController.getDeliveryStatuses);

router.post("/add-address", authMiddleware.verifyToken, amazonMarketController.addAddress);
router.post("/list-addresses", authMiddleware.verifyToken, amazonMarketController.listAddresses);


export default router;
