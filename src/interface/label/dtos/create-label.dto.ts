import type { HexColor } from "../../common/color.type";

export interface CreateLabelDto {
  name: string;
  description?: string;
  categoryIds: string[];
  color?: HexColor;
  createdById?: string;
}
