import type { ContentType } from "../enums/domain.enums";
import type { FileStatus } from "./enums/file-status.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface AccountReference extends EntityReference {
  username: string;
  email?: string;
}

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
  annotator?: AccountReference | null;
  reviewerId: string | null;
  reviewer?: AccountReference | null;
  fileLabels?: EntityReference[];
}
