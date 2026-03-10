import api from "../api/axios";
import type { CreateReviewErrorDto } from "../interface/review-error/dtos/create-review-error.dto";
import type { FilterReviewErrorQueryDto } from "../interface/review-error/dtos/filter-review-error-query.dto";
import type { UpdateReviewErrorDto } from "../interface/review-error/dtos/update-review-error.dto";

export const createReviewError = async (dto: CreateReviewErrorDto) => {
  try {
    const resp = await api.post("/review-errors", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateReviewError = async (
  id: string,
  dto: UpdateReviewErrorDto,
) => {
  try {
    const resp = await api.patch(`/review-errors/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteReviewError = async (id: string) => {
  try {
    const resp = await api.delete(`/review-errors/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreReviewError = async (id: string) => {
  try {
    const resp = await api.patch(`/review-errors/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getReviewErrorsPaginated = async (
  filter: FilterReviewErrorQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.reviewId) queryParams.append("reviewId", filter.reviewId);
    if (filter.reviewErrorTypeId)
      queryParams.append("reviewErrorTypeId", filter.reviewErrorTypeId);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/review-errors?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllReviewErrors = async (
  filter: FilterReviewErrorQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.reviewId) queryParams.append("reviewId", filter.reviewId);
    if (filter.reviewErrorTypeId)
      queryParams.append("reviewErrorTypeId", filter.reviewErrorTypeId);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/review-errors/all?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getReviewErrorById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/review-errors/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
