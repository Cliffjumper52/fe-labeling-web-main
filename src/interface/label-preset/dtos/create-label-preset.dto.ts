export interface CreateLabelPresetDto {
  name: string;
  description?: string;
  labelIds: string[];
  createdById?: string;
}
