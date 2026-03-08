import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export type LabelSearchBy = "name" | "description" | "color";

export type LabelOrderBy =
  | "name"
  | "description"
  | "color"
  | "createdAt"
  | "updatedAt";

export interface FilterLabelQueryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: LabelSearchBy;
  orderBy?: LabelOrderBy;
  categoryIds?: string[];
}
