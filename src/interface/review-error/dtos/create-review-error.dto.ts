export interface CreateReviewErrorDto {
  reviewId: string;
  reviewErrorTypeId: string;
  errorLocation?: any;
  description?: string;
}
