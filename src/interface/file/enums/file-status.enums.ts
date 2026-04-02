export const FileStatus = {
  IN_ANNOTATION: "in_annotation",
  PENDING_REVIEW: "pending_review",
  REQUIRES_FIX: "requires_fix",
  APPROVED: "approved",
} as const;

export type FileStatus = (typeof FileStatus)[keyof typeof FileStatus];
