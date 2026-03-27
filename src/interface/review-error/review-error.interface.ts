import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface ReviewError extends BaseEntityModel {
  reviewId: string;
  review?: EntityReference;
  reviewErrorTypeId: string;
  reviewErrorType?: EntityReference;
  errorLocation: Record<string, unknown> | null;
  description: string | null;
}
