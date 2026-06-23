export class generateQrRequest {
    quantity: number;
    skuCode: string
    constructor(quantity: number, skuCode: string) {
        this.quantity = quantity,
            this.skuCode = skuCode
    }
}

export class RandomKeyInput {
    randomKey: string;
    status: boolean;

    constructor(data: Partial<RandomKeyInput>) {
        this.randomKey = data?.randomKey || "";
        this.status = data?.status ?? false;
    }
}

export class FetchQrCodeFromOpenSourceApiRequest {
    constructor(
        public data: string,
        public ecc: string,
        public margin: string,
        public format: string,
        public size: number,
        public qzone: string,
    ) { }
}
