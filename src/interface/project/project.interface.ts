import type { DataType, ProjectStatus } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface Project extends BaseEntityModel {
  name: string;
  description: string | null;
  projectStatus: ProjectStatus;
  dataType: DataType;
  imageUrl: string | null;
  createdById: string;
  createdBy?: EntityReference;
  projectConfiguration?: EntityReference;
}
