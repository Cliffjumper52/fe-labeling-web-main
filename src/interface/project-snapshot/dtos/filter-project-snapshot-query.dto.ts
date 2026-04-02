import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";

export interface FilterProjectSnapshotQueryDto extends BasePaginationQueryDto {
  search?: string;
}
