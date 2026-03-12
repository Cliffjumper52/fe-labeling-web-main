export const ProjectTaskPriorityEnums = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;
export type ProjectTaskPriorityEnums = (typeof ProjectTaskPriorityEnums)[keyof typeof ProjectTaskPriorityEnums];
