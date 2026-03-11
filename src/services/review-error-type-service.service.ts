import api from "../api/axios";
import type { CreateReviewErrorTypeDto } from "../interface/review-error-type/dtos/create-review-error-type.dto";
import type { FilterReviewErrorTypeQueryDto } from "../interface/review-error-type/dtos/filter-review-error-type-query.dto";
import type { UpdateReviewErrorTypeDto } from "../interface/review-error-type/dtos/update-review-error-type.dto";

const buildReviewErrorTypeQuery = (
  filter: FilterReviewErrorTypeQueryDto,
  includeDeleted: boolean,
) => {
  const queryParams = new URLSearchParams();

  if (filter.search) queryParams.append("search", filter.search);
  if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
  if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
  if (filter.page) queryParams.append("page", filter.page.toString());
  if (filter.limit) queryParams.append("limit", filter.limit.toString());
  if (filter.order) queryParams.append("order", filter.order);
  if (filter.severity) queryParams.append("severity", filter.severity);
  if (includeDeleted)
    queryParams.append("includeDeleted", includeDeleted.toString());

  return queryParams.toString();
};

export const createReviewErrorType = async (dto: CreateReviewErrorTypeDto) => {
  try {
    const resp = await api.post("/review-error-types", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateReviewErrorType = async (
  id: string,
  dto: UpdateReviewErrorTypeDto,
) => {
  try {
    const resp = await api.patch(`/review-error-types/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreReviewErrorType = async (id: string) => {
  try {
    const resp = await api.patch(`/review-error-types/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteReviewErrorType = async (
  id: string,
  type: "soft" | "hard" = "soft",
) => {
  try {
    const resp = await api.delete(`/review-error-types/${id}?type=${type}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getReviewErrorTypesPaginated = async (
  filter: FilterReviewErrorTypeQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const query = buildReviewErrorTypeQuery(filter, includeDeleted);
    const resp = await api.get(`/review-error-types?${query}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllReviewErrorTypes = async (
  filter: FilterReviewErrorTypeQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const query = buildReviewErrorTypeQuery(filter, includeDeleted);
    const resp = await api.get(`/review-error-types/all?${query}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getReviewErrorTypeById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/review-error-types/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
