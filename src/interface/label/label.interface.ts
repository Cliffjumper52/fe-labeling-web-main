import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";
import type { HexColor } from "../common/color.type";

export interface Label extends BaseEntityModel {
  name: string;
  description?: string;
  categories?: EntityReference[];
  presets?: EntityReference[];
  createdById: string;
  createdBy?: EntityReference;
  color?: HexColor;
}
