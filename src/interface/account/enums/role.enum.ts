export const Role = {
  ADMIN: "admin",
  MANAGER: "manager",
  ANNOTATOR: "annotator",
  REVIEWER: "reviewer",
} as const;
export type Role = (typeof Role)[keyof typeof Role];
