import type { AccountStatus, Role } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface Account extends BaseEntityModel {
  username: string;
  email: string;
  passwordHash?: string;
  passwordSalt?: string;
  role: Role;
  status: AccountStatus;
  files?: EntityReference[];
  fileLabels?: EntityReference[];
  assignedTasks?: EntityReference[];
  reviews?: EntityReference[];
  notifications?: EntityReference[];
}
