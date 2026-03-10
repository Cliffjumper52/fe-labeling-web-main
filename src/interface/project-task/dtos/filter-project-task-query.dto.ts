import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import type { ProjectTaskStatus } from "../../enums/domain.enums";

export interface FilterProjectTaskQueryDto extends BasePaginationQueryDto {
  projectId?: string;
  status?: ProjectTaskStatus;
  assignedByUserId?: string;
  assignedToUserId?: string;
  orderBy?: string;
}
