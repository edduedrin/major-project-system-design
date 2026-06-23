import { AmazonDeliveryStatusEnum } from "../schemas";
import { redemptionStatusEnum } from "../schemas/redemption-model";
import { ReportPagination } from "./pagination";

export class MarketProductSearchPayload extends ReportPagination {
    productName: string;
    categoryId?: number;
    subCategoryId?: number;
    minPrice?: number;
    maxPrice?: number;

    constructor(data: Partial<MarketProductSearchPayload>) {
        super(data);
        this.productName = data?.productName || "";
        this.categoryId = data?.categoryId;
        this.subCategoryId = data?.subCategoryId;
        this.minPrice = data?.minPrice;
        this.maxPrice = data?.maxPrice;
    }
}

export class MarketProduct {
    skuId!: number;
    skuName!: string;
    skuCode!: string;
    skuDescription?: string;
    productValue?: string;
    points?: string;
    categoryId?: number;
    subCategoryId?: number;
    categoryName?: string;
    subCategoryName?: string;
}

export class MarketProductSearchResult {
    totalCount: number;
    reportList: MarketProduct[];
    page: number;
    limit: number;

    constructor(data: Partial<MarketProductSearchResult>) {
        this.totalCount = data?.totalCount || 0;
        this.reportList = data?.reportList || [];
        this.page = data?.page || 1;
        this.limit = data?.limit || 10;
    }
}

export class MarketProductFilter extends ReportPagination {
    productName?: string;
    categoryId?: number | null;
    subCategoryId?: number | null;
    minPrice?: number | null;
    maxPrice?: number | null;
    category?: string | null;
    subCategory?: string | null;
    constructor(data: Partial<MarketProductFilter>) {
        super(data);
        this.productName = data?.productName || ""
        this.categoryId = data?.categoryId || null
        this.subCategoryId = data?.subCategoryId || null
        this.minPrice = data?.minPrice || null
        this.maxPrice = data?.maxPrice || null
        this.category = data?.category || null
        this.subCategory = data?.subCategory || null
    }
};

export class CartItem {
    cartId!: number;
    userId!: number;
    productId!: number;
    quantity!: number;
    isActive!: boolean;
    createdAt!: Date;
    updatedAt!: Date;
    // product details
    productName?: string;
    amazonProductUrl?: string;
    amazonCategoryUrl?: string;
    amazonSubCategoryUrl?: string;
    amazonDiscountedPrice?: string;
}

export class AddToCartPayload {
    productId: number;
    quantity: number;
    constructor(data: Partial<AddToCartPayload>) {
        this.productId = Number(data?.productId || 0);
        this.quantity = data?.quantity ? Number(data.quantity) : 1;
    }
}

export class UpdateCartPayload {
    cartId: number;
    quantity: number;
    constructor(data: Partial<UpdateCartPayload>) {
        this.cartId = Number(data?.cartId || 0);
        this.quantity = Number(data?.quantity || 0);
    }
}

export class DeleteCartPayload {
    productId: number[];
    constructor(data: Partial<DeleteCartPayload>) {
        this.productId = data?.productId || []
    }
}

export class ViewCartFilter extends ReportPagination {
    constructor(data: Partial<ViewCartFilter>) {
        super(data);
    }
}

export class AddToWishlistPayload {
    productId: number;
    constructor(data: Partial<AddToWishlistPayload>) {
        this.productId = Number(data?.productId || 0);
    }
}

export class DeleteWishlistPayload {
    productId: number;
    constructor(data: Partial<DeleteWishlistPayload>) {
        this.productId = Number(data?.productId || 0);
    }
}

export class ViewWishlistFilter extends ReportPagination {
    constructor(data: Partial<ViewWishlistFilter>) {
        super(data);
    }
}

export class OrderProductPayload {
    productId: number | null;
    quantity: number | null;
    constructor(data: Partial<OrderProductPayload>) {
        this.productId = data?.productId || null;
        this.quantity = data?.quantity || null;
    }
}

export class AddOrderPayload {
    products: OrderProductPayload[];
    addressId: number | null;
    constructor(data: Partial<AddOrderPayload>) {
        this.addressId = data?.addressId || null;
        this.products = data?.products || []
    }
}

export class OrderRecord {
    orderId: number | null
    userId: number | null
    productId: number | null
    quantity: number | null
    orderStatus: string;
    amount: string;
    createdAt: string;
    updatedAt: string;
    productName: string;
    amazonProductUrl: string;
    amazonCategoryUrl: string;
    amazonSubCategoryUrl: string;
    constructor(data: Partial<OrderRecord>) {
        this.orderId = data?.orderId || null
        this.userId = data?.userId || null
        this.productId = data?.productId || null
        this.quantity = data?.quantity || null
        this.orderStatus = data?.orderStatus || ""
        this.amount = data?.amount || ""
        this.createdAt = data?.createdAt || ""
        this.updatedAt = data?.updatedAt || ""
        this.productName = data?.productName || ""
        this.amazonProductUrl = data?.amazonProductUrl || ""
        this.amazonCategoryUrl = data?.amazonCategoryUrl || ""
        this.amazonSubCategoryUrl = data?.amazonSubCategoryUrl || ""
    }
}

export class ViewOrderFilter extends ReportPagination {
    status?: string[];
    fromDate?: string;
    toDate?: string;
    userId?: number;
    constructor(data: Partial<ViewOrderFilter>) {
        super(data);
        this.status = data?.status || [];
        this.fromDate = data?.fromDate || "";
        this.toDate = data?.toDate || "";
        this.userId = data?.userId;
    }
}

export class AddAddressPayload {
    addressLabel?: string;
    pincode: string;
    addressLine1: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: number | null;
    longitude?: number | null;
    isDefault?: boolean;

    constructor(data: Partial<AddAddressPayload>) {
        this.addressLabel = data?.addressLabel || ""
        this.pincode = String(data?.pincode || "");
        this.addressLine1 = String(data?.addressLine1 || "");
        this.addressLine2 = data?.addressLine2;
        this.city = data?.city;
        this.state = data?.state;
        this.country = data?.country || "India";
        this.latitude = data?.latitude ?? null;
        this.longitude = data?.longitude ?? null;
        this.isDefault = Boolean(data?.isDefault || false);
    }
}

export class AddressItem {
    addressId!: number;
    userId!: number;
    pincode!: string;
    addressLine1!: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    country?: string;
    latitude?: string | null;
    longitude?: string | null;
    isDefault!: boolean;
    isActive!: boolean;
    createdAt!: Date;
    updatedAt!: Date;
    constructor(data: Partial<AddressItem>) {
        this.addressId = data?.addressId || 0;
        this.userId = data?.userId || 0;
        this.pincode = data?.pincode || "";
        this.addressLine1 = data?.addressLine1 || "";
        this.addressLine2 = data?.addressLine2;
        this.city = data?.city;
        this.state = data?.state;
        this.country = data?.country || "India";
        this.latitude = data?.latitude || null;
        this.longitude = data?.longitude || null;
        this.isDefault = Boolean(data?.isDefault || false);
        this.isActive = Boolean(typeof data?.isActive === 'undefined' ? true : data?.isActive);
        this.createdAt = (data?.createdAt as any) || new Date();
        this.updatedAt = (data?.updatedAt as any) || new Date();
    }
}

export class ViewAddressFilter extends ReportPagination {
    constructor(data: Partial<ViewAddressFilter>) {
        super(data as any);
    }
}


export class RedemptionOrderAddressType {
    addressLine1: string = "";
    addressLine2: string = "";
    pincode: string = "";
    city: string = "";
    state: string = "";
    country: string = "";
}

export class RedemptionAddress {
    city: string;
    state: string;
    country: string;
    pincode: string;
    addressLine1: string;
    addressLine2: string;

    constructor(data: Partial<RedemptionAddress>) {
        this.city = data.city ?? "";
        this.state = data.state ?? "";
        this.country = data.country ?? "";
        this.pincode = data.pincode ?? "";
        this.addressLine1 = data.addressLine1 ?? "";
        this.addressLine2 = data.addressLine2 ?? "";
    }
}

export class RedemptionProductDetail {
    productId: number | null;
    productName: string | null;
    quantity: number | null;
    points: string | null;
    productValue: string | null;
    orderStatus: string | null;
    totalPoints: string | null;
    redemptionId: number | null;
    constructor(data: Partial<RedemptionProductDetail>) {
        this.redemptionId = data?.redemptionId ?? null
        this.productId = data.productId ?? 0;
        this.productName = data.productName ?? "";
        this.quantity = data.quantity ?? 0;
        this.points = data.points ?? "0.00";
        this.productValue = data.productValue ?? "0.00";
        this.orderStatus = data.orderStatus ?? "";
        this.totalPoints = data.totalPoints ?? "0.00";
    }
}



export class RedemptionOrder {
    redemptionId: number;
    redemptionRef: string;
    slno: string;
    createdAt: string;
    status: typeof redemptionStatusEnum.enumValues[number] | null;
    totalUnit: number;
    totalPoint: string | null;
    address: RedemptionAddress | null;
    productDetails: RedemptionProductDetail[];
    productNames: string[];
    userDetails?: {
        userName: string;
        userId: number;
    } | null;

    constructor(data: Partial<RedemptionOrder>) {
        this.redemptionId = data.redemptionId ?? 0;
        this.redemptionRef = data.redemptionRef ?? "";
        this.slno = data.slno ?? "";
        this.createdAt = data.createdAt ?? "";
        this.status = data.status ?? "Pending";
        this.totalUnit = data.totalUnit ?? 0;
        this.totalPoint = data.totalPoint ?? "0.00";

        this.address = new RedemptionAddress(data.address ?? {});

        this.productDetails =
            data.productDetails?.map(
                (p) => new RedemptionProductDetail(p)
            ) ?? [];

        this.productNames = data.productNames ?? [];
        this.userDetails = data.userDetails || null;
    }
}

export class AddMarketProduct {
    amazonAsinSku: string;
    amazonProductName: string;
    amazonMrp: string;
    amazonDiscountedPrice: string;
    amazonPoints: string;
    amazonInventoryCount: number;
    amazonCategory: string;
    amazonSubCategory: string;
    amazonProductDescription: string;
    amazonCspPrice: string;
    amazonModelNo: string;
    amazonCommentsVendor: string;
    amazonStaticCategoryUrl: string;
    amazonStaticSubCategoryUrl: string;
    amazonStaticProductUrl: string;
    constructor(data: Partial<AddMarketProduct>) {
        this.amazonAsinSku = data.amazonAsinSku || "";
        this.amazonProductName = data.amazonProductName || "";
        this.amazonMrp = String(data.amazonMrp || "0");
        this.amazonDiscountedPrice = String(data.amazonDiscountedPrice || "0");
        this.amazonPoints = String(data.amazonPoints || "0");
        this.amazonInventoryCount = Number(data.amazonInventoryCount || 0);
        this.amazonCategory = data.amazonCategory || "";
        this.amazonSubCategory = data.amazonSubCategory || "";
        this.amazonProductDescription = data.amazonProductDescription || "";
        this.amazonCspPrice = String(data.amazonCspPrice || "0");
        this.amazonModelNo = data.amazonModelNo || "";
        this.amazonCommentsVendor = data.amazonCommentsVendor || "";
        this.amazonStaticCategoryUrl = data.amazonStaticCategoryUrl || "";
        this.amazonStaticSubCategoryUrl = data.amazonStaticSubCategoryUrl || "";
        this.amazonStaticProductUrl = data.amazonStaticProductUrl || "";
    }
}

export class AddMarketProductResponse {
    success: any[];
    failed: { product: AddMarketProduct, message: string }[];

    constructor() {
        this.success = [];
        this.failed = [];
    }
}

export class EditMarketProduct {
    productId: number;
    amazonProductName?: string;
    amazonMrp?: string;
    amazonDiscountedPrice?: string;
    amazonPoints?: string;
    amazonInventoryCount?: number;
    amazonCategory?: string;
    amazonSubCategory?: string;
    amazonProductDescription?: string;
    amazonCspPrice?: string;
    amazonModelNo?: string;
    amazonCommentsVendor?: string;
    isActive?: boolean;
    amazonStaticProductUrl?: string; // from imageUrl in body
    amazonProductUrl?: string; // from file upload
    amazonStaticCategoryUrl?: string;
    amazonCategoryUrl?: string;
    amazonStaticSubCategoryUrl?: string;
    amazonSubCategoryUrl?: string;

    constructor(data: Partial<EditMarketProduct>) {
        this.productId = Number(data.productId);
        this.amazonProductName = data?.amazonProductName;
        this.amazonMrp = data?.amazonMrp || "";
        this.amazonDiscountedPrice = data?.amazonDiscountedPrice || "";
        this.amazonPoints = data?.amazonPoints || "";
        this.amazonCategory = data?.amazonCategory || "";
        this.amazonSubCategory = data?.amazonSubCategory || "";
        this.amazonProductDescription = data?.amazonProductDescription || "";
        this.amazonCspPrice = data?.amazonCspPrice || "";
        this.amazonModelNo = data?.amazonModelNo || "";
        this.amazonCommentsVendor = data?.amazonCommentsVendor || "";
        this.isActive = data?.isActive || false;
        this.amazonStaticProductUrl = data?.amazonStaticProductUrl || "";
        this.amazonProductUrl = data?.amazonProductUrl || "";
        this.amazonStaticCategoryUrl = data?.amazonStaticCategoryUrl || "";
        this.amazonCategoryUrl = data?.amazonCategoryUrl || "";
        this.amazonStaticSubCategoryUrl = data?.amazonStaticSubCategoryUrl || "";
        this.amazonSubCategoryUrl = data?.amazonSubCategoryUrl || "";
    }
}

export class UpdateDeliveryStatusPayload {
    redemptionId: number;
    status: typeof AmazonDeliveryStatusEnum.enumValues[number];
    constructor(data: Partial<UpdateDeliveryStatusPayload>) {
        this.redemptionId = Number(data.redemptionId);
        this.status = data.status || "Pending";
    }
}
