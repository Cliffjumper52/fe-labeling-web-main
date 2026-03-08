import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface AccountRatingHistory extends BaseEntityModel {
  accountRatingId: string;
  accountRating?: EntityReference;
  previousRatingScore: number;
  newRatingScore: number;
  changeReason: string | null;
  changedAt: string;
  reviewError: Record<string, unknown> | null;
}
