import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface LabelCategory extends BaseEntityModel {
  name: string;
  description: string;
  createdById: string;
  createdBy?: EntityReference;
  labels?: EntityReference[];
}
