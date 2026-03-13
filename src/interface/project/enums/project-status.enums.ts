export const ProjectStatus = {
  DRAFT: "draft",
  ACTIVE: "active",
  COMPLETED: "completed",
  ARCHIVED: "archived",
} as const;
export type ProjectStatus = (typeof ProjectStatus)[keyof typeof ProjectStatus];
