export const Status = {
  NEED_CHANGE_PASSWORD: 'need_change_password',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;
export type Status = (typeof Status)[keyof typeof Status];
