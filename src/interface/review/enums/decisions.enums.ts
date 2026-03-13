export const Decision = {
  APPROVED: "approved",
  REJECTED: "rejected",
  PENDING: "pending",
} as const;
export type Decision = (typeof Decision)[keyof typeof Decision];
