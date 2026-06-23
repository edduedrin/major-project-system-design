export class InventoryBatch {
    batchId!: number;
    skuCode!: string;
    quantity!: number;
    fileUrl!: string | null;
    createdBy!: number;
    updatedBy!: number | null; // ✅ nullable in DB
    createdAt!: Date;
    updatedAt!: Date;
    isActive!: boolean;
}


interface InsertQrIntoDbRequestProps {
    qrData: string[];
    skuCode: string;
    quantity: number;
    createdBy: number;
}

export class InsertQrIntoDbRequest {
    qrData: string[];
    skuCode: string;
    quantity: number;
    createdBy: number;
    constructor(data: InsertQrIntoDbRequestProps) {
        this.qrData = data?.qrData;
        this.skuCode = data?.skuCode;
        this.quantity = data?.quantity;
        this.createdBy = data?.createdBy;
    }
}

export class InventoryRaw {
    inventoryId!: number;
    serialNumber!: string;
    batchId!: number;
    isActive!: boolean;
    isQrScanned!: boolean;
}


export class InventoryDetails {
    serialNumber?: string;
    qrActive?: boolean;
    isQrScanned?: boolean;
    skuCode?: string;
    skuActive?: boolean;
    points?: string;
    productValue?: string;
}