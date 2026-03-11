import type {
  ProjectTaskPriority,
  ProjectTaskStatus,
  Role,
} from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";
import type { Project } from "../project/project.interface";

export interface ProjectTask extends BaseEntityModel {
  projectId: string;
  project?: EntityReference | Project;
  assignedTo: string;
  assignedToAccount?: EntityReference;
  assignedBy: string;
  assignedByAccount?: EntityReference;
  startedAt: string | null;
  submittedAt: string | null;
  completedAt: string | null;
  status: ProjectTaskStatus;
  priority: ProjectTaskPriority;
  fileIds: string[];
  assignedUserRole: Role | null;
}
