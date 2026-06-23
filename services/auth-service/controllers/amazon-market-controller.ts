import { Request, Response, NextFunction } from "express";
import { amazonMarketRepository } from "../repositories";
import { customValidators } from "../utils/custom-validators";
import { checkIfUserIsAdmin } from "../utils/checkIfUserIsAdmin";
import { fileMiddleware } from "../middlewares/file-middleware";

class AmazonMarketController {


    productCategories = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const products = await amazonMarketRepository.productGetCategories();
            return res?.json({
                message: "success",
                code: 200,
                data: products
            })
        } catch (error) {
            next(error);
        }
    }

    fetchProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.amazonProductSearchValidator(req.body || {});

            const products = await amazonMarketRepository.fetchProducts(payload);

            return res.json({ code: 200, message: "Products fetched", data: products });
        } catch (error) {
            next(error);
        }
    };

    addProducts = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.addMarketProductValidator(req.body);
            const result = await amazonMarketRepository.insertProducts(req.userDetails?.userId, payload);
            return res.json({ code: 200, message: "Products processed", data: result });
        } catch (error) {
            next(error);
        }
    };

    editProduct = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const body = { ...req.body };
            console.log(body)
            if (body.productImageUrl !== undefined) {
                body.amazonStaticProductUrl = body.productImageUrl;
            }
            if (body.categoryImageUrl !== undefined) {
                body.amazonStaticCategoryUrl = body.categoryImageUrl;
            }
            if (body.subCategoryImageUrl !== undefined) {
                body.amazonStaticSubCategoryUrl = body.subCategoryImageUrl;
            }

            const payload = customValidators.editMarketProductValidator(body);

            const files = req.files as any;
            // console.log(files)
            if (files?.productImage?.[0]) {
                const fileName = await fileMiddleware.uploadFile(files.productImage[0], "amazon-market");
                payload.amazonProductUrl = fileName;
            }
            if (files?.categoryImage?.[0]) {
                const fileName = await fileMiddleware.uploadFile(files.categoryImage[0], "amazon-market");
                payload.amazonCategoryUrl = fileName;
            }
            if (files?.subCategoryImage?.[0]) {
                const fileName = await fileMiddleware.uploadFile(files.subCategoryImage[0], "amazon-market");
                payload.amazonSubCategoryUrl = fileName;
            }

            const result = await amazonMarketRepository.editProduct(req.userDetails?.userId, payload);
            return res.json({ code: 200, message: "Product updated", data: result });
        } catch (error) {
            next(error);
        }
    };

    getDeliveryStatuses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const result = await amazonMarketRepository.getDeliveryStatuses();
            return res.json({ code: 200, message: "Delivery statuses fetched", data: result });
        } catch (error) {
            next(error);
        }
    };

    updateDeliveryStatus = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.updateDeliveryStatusValidator(req.body);
            const result = await amazonMarketRepository.updateDeliveryStatus(req.userDetails?.userId, payload);
            return res.json({ code: 200, message: "Delivery status updated", data: result });
        } catch (error) {
            next(error);
        }
    };

    addToCart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.addToCartValidator(req.body || {});
            const result = await amazonMarketRepository.addToCart(req.userDetails?.userId, payload?.productId, payload?.quantity);
            return res.json({ code: 200, message: "Added to cart", data: result });
        } catch (error) {
            next(error);
        }
    };

    createOrder = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.addOrderValidator(req.body || {}, req.userDetails);
            const result = await amazonMarketRepository.createOrder(req.userDetails?.userId, payload, req?.userDetails);
            return res.json({ code: 200, message: "Order placed", data: result });
        } catch (error) {
            next(error);
        }
    };

    orderHistory = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatorPayload = customValidators.orderHistoryValidator(req.body);
            const isAdmin = await checkIfUserIsAdmin(req.userDetails?.userId);
            const userIdForQuery = isAdmin ? undefined : req.userDetails?.userId;
            const result = await amazonMarketRepository.orderHistory(userIdForQuery, validatorPayload, isAdmin);
            return res.json({ code: 200, message: "Order history fetched", data: result });
        } catch (error) {
            next(error);
        }
    };


    addToWishlist = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.addToWishlistValidator(req.body || {});
            const result = await amazonMarketRepository.addToWishlist(req.userDetails?.userId, payload.productId);
            return res.json({ code: 200, message: "Added to wishlist", data: result });
        } catch (error) {
            next(error);
        }
    };

    viewWishlist = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.wishlistViewValidator(req.body || {});
            const result = await amazonMarketRepository.viewWishlist(req.userDetails?.userId, payload);
            return res.json({ code: 200, message: "Wishlist fetched", data: result });
        } catch (error) {
            next(error);
        }
    };

    removeFromWishlist = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.deleteWishlistValidator(req.body || {});
            const result = await amazonMarketRepository.removeFromWishlist(payload.productId, req.userDetails?.userId);
            return res.json({ code: 200, message: "Removed from wishlist", data: result });
        } catch (error) {
            next(error);
        }
    };

    viewCart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.cartViewValidator(req.body || {});
            const result = await amazonMarketRepository.viewCart(req.userDetails?.userId, payload);
            return res.json({ code: 200, message: "Cart fetched", data: result });
        } catch (error) {
            next(error);
        }
    };

    updateCart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.updateCartValidator(req.body || {});
            const result = await amazonMarketRepository.updateQuantity(payload.cartId, req.userDetails?.userId, payload.quantity);
            return res.json({ code: 200, message: "Cart updated", data: result });
        } catch (error) {
            next(error);
        }
    };

    removeFromCart = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.deleteCartValidator(req.body || {});
            const result = await amazonMarketRepository.removeFromCart(payload.productId, req.userDetails?.userId);
            return res.json({ code: 200, message: "Removed from cart", data: result });
        } catch (error) {
            next(error);
        }
    };

    addAddress = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const payload = customValidators.addAddressValidator(req.body || {});
            const result = await amazonMarketRepository.addAddress(req.userDetails?.userId, payload);
            return res.json({ code: 200, message: "Address added", data: result });
        } catch (error) {
            next(error);
        }
    };

    listAddresses = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const validatorPayload = customValidators.viewAddressValidator(req.body);
            const result = await amazonMarketRepository.viewAddresses(req.userDetails?.userId, validatorPayload);
            return res.json({ code: 200, message: "Addresses fetched", data: result });
        } catch (error) {
            next(error);
        }
    };
}

export const amazonMarketController = new AmazonMarketController();
