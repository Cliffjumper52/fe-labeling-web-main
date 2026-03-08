import type { Decision } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface Review extends BaseEntityModel {
  fileLabelId: string;
  fileLabel?: EntityReference;
  reviewerId: string;
  reviewer?: EntityReference;
  decision: Decision;
  feedbacks: string | null;
  reviewedAt: string | null;
  checklistAnswerId: string | null;
  checklistAnswer?: EntityReference | null;
  reviewErrors?: EntityReference[];
}
