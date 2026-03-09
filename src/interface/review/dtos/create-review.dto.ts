import { Decision } from "../enums/decisions.enums";

export interface CreateReviewDto {
  reviewerId?: string;
  decision: Decision;
  feedbacks?: string;
  checklistAnswerId: string;
}
