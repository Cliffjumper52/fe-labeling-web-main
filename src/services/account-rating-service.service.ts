import api from "../api/axios";
import type { CreateAccountRatingDto } from "../interface/account-rating/dtos/create-account-rating.dto";
import type { FilterAccountRatingQueryDto } from "../interface/account-rating/dtos/filter-account-rating-query.dto";

export const createAccountRating = async (dto: CreateAccountRatingDto) => {
  try {
    const resp = await api.post("/account-ratings", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAccountRatingsPaginated = async (
  filter: FilterAccountRatingQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.sortBy) queryParams.append("sortBy", filter.sortBy);
    if (filter.accountId) queryParams.append("accountId", filter.accountId);
    if (filter.projectId) queryParams.append("projectId", filter.projectId);
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchField)
      queryParams.append("searchField", filter.searchField);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());

    const resp = await api.get(`/account-ratings?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAccountRatings = async (
  filter: FilterAccountRatingQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.sortBy) queryParams.append("sortBy", filter.sortBy);
    if (filter.accountId) queryParams.append("accountId", filter.accountId);
    if (filter.projectId) queryParams.append("projectId", filter.projectId);
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchField)
      queryParams.append("searchField", filter.searchField);
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());

    const resp = await api.get(
      `/account-ratings/all?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAccountRatingById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/account-ratings/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
