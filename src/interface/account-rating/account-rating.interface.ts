import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface AccountRating extends BaseEntityModel {
  accountId: string;
  account?: EntityReference;
  projectId: string;
  project?: EntityReference;
  ratingScore: number;
  errorCount: number;
  totalFileLabeled: number;
  feedbacks: string | null;
  history?: EntityReference[];
}
