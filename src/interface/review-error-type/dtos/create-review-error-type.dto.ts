import { Severity } from "../enums/severity.enums";

export interface CreateReviewErrorTypeDto {
  name: string;
  description?: string;
  severity: Severity;
  scoreImpact: number;
}
