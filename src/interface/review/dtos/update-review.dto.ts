import { CreateReviewDto } from "./create-review.dto";

/**
 * Update Review DTO - All fields from CreateReviewDto are optional
 */
export type UpdateReviewDto = Partial<CreateReviewDto>;
