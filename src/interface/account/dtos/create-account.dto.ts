import type { AccountStatus, Role } from "../../enums/domain.enums";

export interface CreateAccountDto {
  email: string;
  username: string;
  role: Role;
  status?: AccountStatus;
}
