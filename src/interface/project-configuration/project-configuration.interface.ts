import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface ProjectConfiguration extends BaseEntityModel {
  projectId: string;
  project?: EntityReference;
  availableLabelIds: string[];
  availableLabels: EntityReference[];
}
