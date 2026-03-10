import type { ProjectTaskStatus } from "../../enums/domain.enums";

export interface PatchProjectTaskDto {
  assignedUserId?: string;
  fileIdsToAdd?: string[];
  fileIdsToRemove?: string[];
  status?: ProjectTaskStatus;
}
