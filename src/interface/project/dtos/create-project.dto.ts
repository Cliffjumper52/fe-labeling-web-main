import type { DataType } from "../../enums/domain.enums";

export interface CreateProjectDto {
  name: string;
  description?: string;
  dataType: DataType;
  availableLabelIds: string[];
}
