import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import type { Role } from "../../enums/domain.enums";

export type LabelChecklistQuestionSearchBy = "name" | "description";

export type LabelChecklistQuestionOrderBy =
  | "name"
  | "description"
  | "createdAt"
  | "updatedAt";

export interface FilterLabelChecklistQuestionQueryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: LabelChecklistQuestionSearchBy;
  orderBy?: LabelChecklistQuestionOrderBy;
  labelId?: string;
  isRequired?: boolean;
  role?: Role;
}
