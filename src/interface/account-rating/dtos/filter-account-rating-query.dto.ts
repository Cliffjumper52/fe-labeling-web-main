import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export type AccountRatingSortBy =
  | "accountId"
  | "projectId"
  | "createdAt"
  | "updatedAt";

export type AccountRatingSearchField = "feedbacks";

export interface FilterAccountRatingQueryDto extends BasePaginationQueryDto {
  sortBy?: AccountRatingSortBy;
  accountId?: string;
  projectId?: string;
  search?: string;
  searchField?: AccountRatingSearchField;
}
