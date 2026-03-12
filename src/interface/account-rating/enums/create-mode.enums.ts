export const CreateMode = {
  DEFAULT: 'DEFAULT',
  RECALCULATED: 'RECALCULATED',
} as const;
export type CreateMode = (typeof CreateMode)[keyof typeof CreateMode];
