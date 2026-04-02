import type { AnswerType } from "../../enums/domain.enums";
import type { AnswerDataDto } from "./answer-data/answer-data.dto";

export type ChecklistAnswerRoleType = "annotator" | "reviewer";

export interface CreateChecklistAnswerDto {
  fileLabelId: string;
  answerData: AnswerDataDto;
  answerType: AnswerType;
  answerById?: string;
  roleType?: ChecklistAnswerRoleType;
}
