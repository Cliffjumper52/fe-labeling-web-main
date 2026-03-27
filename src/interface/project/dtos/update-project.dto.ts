import type { DataType } from "../../enums/domain.enums";

export interface UpdateProjectDto {
  name: string;
  description?: string;
  dataType: DataType;
}
