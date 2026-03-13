export const RelatedEntityType = {
  TASK: "task",
  FILE_LABEL: "file_label",
  PROJECT: "project",
  DATASET: "dataset",
} as const;
export type RelatedEntityType =
  (typeof RelatedEntityType)[keyof typeof RelatedEntityType];
