import type { FileLabelStatus } from "../../enums/domain.enums";

export interface CreateFileLabelDto {
  fileId: string;
  labelId?: string | null;
  annotatorId?: string;
  reviewerId?: string;
  status?: FileLabelStatus;
}
