import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface LabelPreset extends BaseEntityModel {
  name: string;
  description: string | null;
  createdById: string;
  createdBy?: EntityReference;
  labels?: EntityReference[];
}
