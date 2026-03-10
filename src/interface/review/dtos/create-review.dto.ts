import type { Decision } from "../../enums/domain.enums";

export interface CreateReviewDto {
  reviewerId?: string;
  decision: Decision;
  feedbacks?: string;
  checklistAnswerId: string;
}
