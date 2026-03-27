export const AnswerTypeEnum = {
  SUBMIT: "submit",
  REJECTED: "rejected",
  APPROVED: "approved",
  RESUBMITED: "resubmitted",
} as const;
export type AnswerTypeEnum =
  (typeof AnswerTypeEnum)[keyof typeof AnswerTypeEnum];
