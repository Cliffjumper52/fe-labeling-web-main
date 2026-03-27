import type { FileStatus } from "../enums/file-status.enums";

export interface CreateFileDto {
  projectId: string;
  annotatorId?: string;
  reviewerId?: string;
  status?: FileStatus;
}
