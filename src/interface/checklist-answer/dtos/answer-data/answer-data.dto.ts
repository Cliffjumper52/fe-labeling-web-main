import type { SingleChecklistAnswerDto } from "./single-checklist-answer.dto";

export interface AnswerDataDto {
  answers: SingleChecklistAnswerDto[];
  notes?: string;
}
