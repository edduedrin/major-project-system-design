export class KYCFilesUpdate{
    aadhaarFrontUrl?:string;
    aadhaarBackUrl?:string;
    panFrontUrl?:string;
    panNumber?: string;
    preferredRetailer?:string
}

export class UpdateKycStatus {
    userId?: number
    kycStatus?: boolean
    comment?:string

    constructor(data?: Partial<UpdateKycStatus>) {
        Object.assign(this, data);
    }
}

export class PreferredRetailerList {
    retailerId?: number;
    mobile?: string;
    name?: string;
    pincode?: number;
}

export class PurchasingRetailerCreatePayload {
    shopName: string;
    address: string;
    mobile: string;
    constructor(data: Partial<PurchasingRetailerCreatePayload>) {
        this.shopName = data?.shopName || "";
        this.address = data?.address || "";
        this.mobile = data?.mobile || "";
    }
}

export class PurchasingRetailerEditPayload {
    mappingId: number;
    isActive: boolean;
    constructor(data: Partial<PurchasingRetailerEditPayload>) {
        this.mappingId = data?.mappingId || 0;
        this.isActive = data?.isActive ?? false;
    }
}

export class RetailerWorkshopMapPayload {
    workshopId: number;
    purchasingRetailerId: number;
    constructor(data: Partial<RetailerWorkshopMapPayload>) {
        this.workshopId = data?.workshopId || 0;
        this.purchasingRetailerId = data?.purchasingRetailerId || 0;
    }
}

export class RetailerWorkshopMapActionPayload {
    workshopId: number;
    purchasingRetailerId: number;
    isActive: boolean;
    constructor(data: Partial<RetailerWorkshopMapActionPayload>) {
        this.workshopId = data?.workshopId || 0;
        this.purchasingRetailerId = data?.purchasingRetailerId || 0;
        this.isActive = data?.isActive ?? true;
    }
}

export class RetailerWorkshopMappingsQueryPayload {
    workshopId?: number;
    includeInactive: boolean;
    page: number;
    limit: number;
    constructor(data: Partial<RetailerWorkshopMappingsQueryPayload>) {
        this.workshopId = data?.workshopId;
        this.includeInactive = data?.includeInactive ?? false;
        this.page = data?.page || 1;
        this.limit = data?.limit || 10;
    }
}
