import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export type ProjectSearchBy = "name" | "description";

export type ProjectOrderBy = "name" | "description" | "createdAt" | "updatedAt";

export interface FilterProjectQueryDto extends BasePaginationQueryDto {
  name?: string;
  search?: string;
  searchBy?: ProjectSearchBy;
  orderBy?: ProjectOrderBy;
  includeDeleted?: boolean;
}
