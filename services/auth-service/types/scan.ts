export class ProductScan {
    qr: string;
    constructor(data: Partial<ProductScan>) {
        this.qr = data?.qr || ""
    }
}