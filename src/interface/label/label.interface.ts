import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface Label extends BaseEntityModel {
  name: string;
  description?: string;
  categories?: EntityReference[];
  presets?: EntityReference[];
  createdById: string;
  createdBy?: EntityReference;
  color?: string;
}
