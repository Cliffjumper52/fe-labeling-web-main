export const FileLabelStatusEnums = {
  IN_PROGRESS: 'in_progress',
  PENDING_REVIEW: 'pending_review',
  REVIEWED: 'reviewed',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DONE: 'done',
  REASSIGNED: 'reassigned',
} as const;
export type FileLabelStatusEnums = (typeof FileLabelStatusEnums)[keyof typeof FileLabelStatusEnums];
