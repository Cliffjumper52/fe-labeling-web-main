import { ProjectTaskStatus } from "../enums/task-status.enums";

export interface PatchProjectTaskDto {
  assignedUserId?: string;
  fileIdsToAdd?: string[];
  fileIdsToRemove?: string[];
  status?: ProjectTaskStatus;
}
