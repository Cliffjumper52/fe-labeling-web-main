import type { Role } from "../../enums/domain.enums";

export interface CreateLabelChecklistQuestionDto {
  name: string;
  description?: string;
  labelId?: string;
  roleEnum: Role;
  isRequired?: boolean;
  createdById?: string;
}
