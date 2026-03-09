import { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export interface FilterReviewErrorQueryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: string;
  reviewId?: string;
  reviewErrorTypeId?: string;
  orderBy?: string;
}
