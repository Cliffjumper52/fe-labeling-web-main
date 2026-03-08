export type CreateMode = "DEFAULT" | "RECALCULATED";

export interface CreateAccountRatingDto {
  accountId: string;
  projectId: string;
  ratingScore?: number;
  errorCount?: number;
  totalFileLabeled?: number;
  feedbacks?: string;
  mode?: CreateMode;
}
