import api from "../api/axios";
import type { AnswerDataDto } from "../interface/checklist-answer/dtos/answer-data/answer-data.dto";
import type { Decision } from "../interface/enums/domain.enums";

export interface ReviewFilterQueryDto {
  page?: number;
  limit?: number;
  order?: "ASC" | "DESC";
  fileLabelId?: string;
  reviewerId?: string;
  search?: string;
  searchBy?: string;
  decision?: Decision;
  checklistAnswerId?: string;
  orderBy?: string;
}

export interface UpdateReviewDto {
  reviewerId?: string;
  decision?: Decision;
  feedbacks?: string;
  checklistAnswerId?: string;
}

export interface SubmitReviewErrorDto {
  reviewErrorTypeId: string;
  errorLocation?: object;
  description?: string;
}

export interface SubmitReviewsDto {
  decision: Decision;
  feedbacks?: string;
  answerData: AnswerDataDto;
  reviewErrors: SubmitReviewErrorDto[];
  fileLabelId: string;
}

export const updateReview = async (id: string, dto: UpdateReviewDto) => {
  try {
    const resp = await api.patch(`/reviews/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreReview = async (id: string) => {
  try {
    const resp = await api.patch(`/reviews/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteReview = async (id: string) => {
  try {
    const resp = await api.delete(`/reviews/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getReviewsPaginated = async (
  filter: ReviewFilterQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.fileLabelId)
      queryParams.append("fileLabelId", filter.fileLabelId);
    if (filter.reviewerId) queryParams.append("reviewerId", filter.reviewerId);
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.decision) queryParams.append("decision", filter.decision);
    if (filter.checklistAnswerId)
      queryParams.append("checklistAnswerId", filter.checklistAnswerId);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/reviews?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllReviews = async (
  filter: ReviewFilterQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.fileLabelId)
      queryParams.append("fileLabelId", filter.fileLabelId);
    if (filter.reviewerId) queryParams.append("reviewerId", filter.reviewerId);
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.decision) queryParams.append("decision", filter.decision);
    if (filter.checklistAnswerId)
      queryParams.append("checklistAnswerId", filter.checklistAnswerId);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/reviews/all?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getReviewById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/reviews/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const submitReviews = async (dto: SubmitReviewsDto) => {
  try {
    const resp = await api.post("/reviews/reviewer/submit", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
