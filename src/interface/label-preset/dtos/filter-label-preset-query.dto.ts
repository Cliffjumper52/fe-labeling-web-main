import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export type LabelPresetSearchBy = "name" | "description";

export type LabelPresetOrderBy =
  | "name"
  | "description"
  | "createdAt"
  | "updatedAt";

export interface FilterLabelPresetQueryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: LabelPresetSearchBy;
  orderBy?: LabelPresetOrderBy;
  labelIds?: string[];
}
