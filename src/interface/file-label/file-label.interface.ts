import type { FileLabelStatus } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface FileLabel extends BaseEntityModel {
  fileId: string;
  file?: EntityReference;
  labelId: string | null;
  label?: EntityReference | null;
  annotatorId: string;
  annotator?: EntityReference;
  annotationData: Record<string, unknown> | null;
  reviewerId: string | null;
  reviewer?: EntityReference | null;
  status: FileLabelStatus;
  checklistAnswers?: EntityReference[];
}
