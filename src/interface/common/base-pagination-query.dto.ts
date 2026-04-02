export type SortOrder = "ASC" | "DESC";

export interface BasePaginationQueryDto {
  page?: number;
  limit?: number;
  order?: SortOrder;
}
