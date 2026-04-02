import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export interface FilterAccountRatingHistoryQueryDto extends BasePaginationQueryDto {
  search?: string;
  accountRatingId?: string;
}
