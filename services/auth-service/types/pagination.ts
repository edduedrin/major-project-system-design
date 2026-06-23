import { PAGINATION_CONFIG } from "../utils/constant";

export class ReportPagination {
  skip: number = PAGINATION_CONFIG.skip;
  limit: number = PAGINATION_CONFIG.limit;
  searchStr: string = "";
  export:boolean;
  constructor(data: any) {
    this.limit = data?.limit || PAGINATION_CONFIG?.limit;
    this.skip = data?.skip || PAGINATION_CONFIG?.skip;
    this.searchStr = data?.searchStr || "";
    this.export = data?.export || false;
  }
}
