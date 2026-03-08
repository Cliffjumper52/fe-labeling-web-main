import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export type LabelCategorySearchBy = "name" | "description";

export type LabelCategoryOrderBy =
  | "name"
  | "description"
  | "createdAt"
  | "updatedAt";

export interface FilterLabelCategoryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: LabelCategorySearchBy;
  orderBy?: LabelCategoryOrderBy;
}
