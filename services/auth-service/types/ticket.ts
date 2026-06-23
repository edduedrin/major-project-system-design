import { ReportPagination } from "./pagination";

// export class TicketPayload {
//     ticketId: number | null;
//     description: string;
//     file: Express.Multer.File | null;
//     fileUrl: string = "";
//     constructor(data: Partial<TicketPayload>) {
//         this.ticketId = data?.ticketId || null;
//         this.description = data?.description || "";
//         this.file = data?.file || null;
//     }
// }

export class TicketPayload {
    ticketId: number | null;
    description: string;
    file: Express.Multer.File | null;
    fileUrl: string;
    userId?: number;   // ✅ properly optional

    constructor(data: Partial<TicketPayload> = {}) {
        this.ticketId = data.ticketId ?? null;
        this.description = data.description ?? "";
        this.file = data.file ?? null;
        this.fileUrl = data.fileUrl ?? "";
        this.userId = data.userId;  // optional
    }
}


export class TicketFilter extends ReportPagination {
    ticketId: number | null
    constructor(data: Partial<TicketFilter>) {
        super(data);
        this.ticketId = data?.ticketId || null
    }
}