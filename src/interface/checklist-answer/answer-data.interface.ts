export interface SingleAnswerData {
  questionId: string;
  answer: boolean;
  questionName?: string;
  questionDescription?: string;
  questionIsRequired?: boolean;
  questionUpdatedAt?: string;
  notes?: string;
}

export interface AnswerData {
  answers: SingleAnswerData[];
  notes?: string;
}
