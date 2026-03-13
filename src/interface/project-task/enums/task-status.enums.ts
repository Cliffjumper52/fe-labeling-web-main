export const ProjectTaskStatus = {
  ASSIGNED: "assigned",
  IN_PROGRESS: "in_progress",
  PENDING_REVIEW: "pending_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  DONE: "done",
} as const;
export type ProjectTaskStatus =
  (typeof ProjectTaskStatus)[keyof typeof ProjectTaskStatus];
