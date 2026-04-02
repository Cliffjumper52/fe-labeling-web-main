import type { Role } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface LabelChecklistQuestion extends BaseEntityModel {
  labelId: string;
  label?: EntityReference;
  name: string;
  description: string | null;
  roleEnum: Role;
  createdById: string;
  isRequired: boolean;
  createdBy?: EntityReference;
}
