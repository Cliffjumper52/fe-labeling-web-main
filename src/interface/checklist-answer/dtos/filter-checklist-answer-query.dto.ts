import type { AnswerType } from "../../enums/domain.enums";
import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import type { ChecklistAnswerRoleType } from "./create-checklist-answer.dto";

export type ChecklistAnswerOrderBy =
  | "createdAt"
  | "updatedAt"
  | "label_attempt_number";

export interface FilterChecklistAnswerQueryDto extends BasePaginationQueryDto {
  fileLabelId?: string;
  labelAttemptNumber?: number;
  answerType?: AnswerType;
  roleType?: ChecklistAnswerRoleType;
  orderBy?: ChecklistAnswerOrderBy;
  answerById?: string;
}
