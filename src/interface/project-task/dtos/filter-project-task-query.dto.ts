import { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import { ProjectTaskStatus } from "../enums/task-status.enums";

export interface FilterProjectTaskQueryDto extends BasePaginationQueryDto {
  projectId?: string;
  status?: ProjectTaskStatus;
  assignedByUserId?: string;
  assignedToUserId?: string;
  orderBy?: string;
}
