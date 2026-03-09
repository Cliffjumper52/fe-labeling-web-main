import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export type AccountSearchBy = "username" | "email" | "role" | "status";

export type AccountOrderBy = "username" | "email" | "createdAt" | "updatedAt";

export interface FilterAccountDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: AccountSearchBy;
  orderBy?: AccountOrderBy;
}
