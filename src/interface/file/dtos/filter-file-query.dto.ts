import type { BasePaginationQueryDto } from "../../common/base-pagination-query.dto";
import type { ContentType } from "../../enums/domain.enums";

export type FileSearchBy = "fileName" | "fileUrl";

export type FileOrderBy = "fileName" | "fileSize" | "createdAt" | "updatedAt";

export interface FilterFileQueryDto extends BasePaginationQueryDto {
  search?: string;
  searchBy?: FileSearchBy;
  orderBy?: FileOrderBy;
  projectId?: string;
  uploadedById?: string;
  annotatorId?: string;
  reviewerId?: string;
  contentType?: ContentType;
}
