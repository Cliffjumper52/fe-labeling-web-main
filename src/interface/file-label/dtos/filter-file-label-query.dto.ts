import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import type { FileLabelStatus } from "../../enums/domain.enums";

export interface FilterFileLabelQueryDto extends BasePaginationQueryDto {
  projectId?: string;
  fileId?: string;
  labelId?: string;
  annotatorId?: string;
  reviewerId?: string;
  status?: FileLabelStatus;
  search?: string;
  searchBy?: string;
  orderBy?: string;
}
