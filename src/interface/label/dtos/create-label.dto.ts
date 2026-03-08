export interface CreateLabelDto {
  name: string;
  description?: string;
  categoryIds: string[];
  color?: string;
  createdById?: string;
}
