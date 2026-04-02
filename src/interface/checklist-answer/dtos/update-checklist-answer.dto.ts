import type { AnswerType } from "../../enums/domain.enums";
import type { AnswerDataDto } from "./answer-data/answer-data.dto";

export interface UpdateChecklistAnswerDto {
  answerData?: AnswerDataDto;
  answerType?: AnswerType;
}
