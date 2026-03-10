import type { AnswerDataDto } from "../../checklist-answer/dtos/answer-data/answer-data.dto";
import type { Decision } from "../../enums/domain.enums";
import type { SubmitReviewErrorDto } from "./submit-review-error.dto";

export interface SubmitReviewsDto {
  decision: Decision;
  feedbacks?: string;
  answerData: AnswerDataDto;
  reviewErrors: SubmitReviewErrorDto[];
  fileLabelId: string;
}
