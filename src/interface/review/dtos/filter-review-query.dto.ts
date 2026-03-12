import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import type { Decision } from "../enums/decisions.enums";

export interface FilterReviewQueryDto extends BasePaginationQueryDto {
  fileLabelId?: string;
  reviewerId?: string;
  search?: string;
  searchBy?: string;
  decision?: Decision;
  checklistAnswerId?: string;
  orderBy?: "createdAt" | "updatedAt" | "reviewedAt";
}
