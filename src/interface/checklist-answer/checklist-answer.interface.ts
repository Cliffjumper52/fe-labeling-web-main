import type { AnswerType, Role } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";
import type { AnswerData } from "./answer-data.interface";

export interface ChecklistAnswer extends BaseEntityModel {
  fileLabelId: string;
  fileLabel?: EntityReference;
  answerData: AnswerData | null;
  labelAttemptNumber: number;
  answerType: AnswerType;
  roleType: Role;
  answerById: string;
  answerBy?: EntityReference;
}
