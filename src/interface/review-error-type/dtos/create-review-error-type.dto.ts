import type { Severity } from "../../enums/domain.enums";

export interface CreateReviewErrorTypeDto {
  name: string;
  description?: string;
  severity: Severity;
  scoreImpact: number;
}
