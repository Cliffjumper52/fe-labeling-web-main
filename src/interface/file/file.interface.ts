import type { ContentType } from "../enums/domain.enums";
import type { FileStatus } from "./enums/file-status.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface File extends BaseEntityModel {
  projectId: string;
  project?: EntityReference;
  fileName: string;
  fileSize: number;
  contentType: ContentType;
  fileUrl: string;
  status: FileStatus;
  uploadedById: string;
  uploadedBy?: EntityReference;
  annotatorId: string | null;
  annotator?: EntityReference | null;
  reviewerId: string | null;
  reviewer?: EntityReference | null;
  fileLabels?: EntityReference[];
}
