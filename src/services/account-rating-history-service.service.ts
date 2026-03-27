import api from "../api/axios";
import type { FilterAccountRatingHistoryQueryDto } from "../interface/account-rating-history/dtos/filter-account-rating-history-query.dto";

export const getAccountRatingHistoriesPaginated = async (
  filter: FilterAccountRatingHistoryQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.accountRatingId)
      queryParams.append("accountRatingId", filter.accountRatingId);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());

    const resp = await api.get(
      `/account-rating-histories?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllAccountRatingHistories = async (
  filter: FilterAccountRatingHistoryQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.accountRatingId)
      queryParams.append("accountRatingId", filter.accountRatingId);
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());

    const resp = await api.get(
      `/account-rating-histories/all?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAccountRatingHistoryById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/account-rating-histories/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
