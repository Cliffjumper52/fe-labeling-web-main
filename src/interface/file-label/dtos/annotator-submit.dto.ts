import type { FileLabelStatus } from "../../enums/domain.enums";
import type { AnswerDataDto } from "../../checklist-answer/dtos/answer-data/answer-data.dto";

export interface AnnotatorSubmitDto {
  fileId: string;
  labelId: string;
  status?: FileLabelStatus;
  answerData: AnswerDataDto;
}
