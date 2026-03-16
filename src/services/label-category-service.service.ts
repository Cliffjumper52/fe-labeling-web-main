import api from "../api/axios";
import type { CreateLabelCategoryDto } from "../interface/label-category/dtos/create-label-category.dto";
import type { FilterLabelCategoryDto } from "../interface/label-category/dtos/filter-label-category.dto";
import type { UpdateLabelCategoryDto } from "../interface/label-category/dtos/update-label-category.dto";

export const createLabelCategory = async (dto: CreateLabelCategoryDto) => {
  try {
    const resp = await api.post("/label-categories", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelCategoriesPaginated = async (
  filter: FilterLabelCategoryDto,
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
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/label-categories?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateLabelCategory = async (
  id: string,
  dto: UpdateLabelCategoryDto,
) => {
  try {
    const resp = await api.patch(`/label-categories/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelCategoryById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/label-categories/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteCategory = async (id: string) => {
  try {
    const resp = await api.delete(`/label-categories/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllCategories = async (
  filter: FilterLabelCategoryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.order) queryParams.append("order", filter.order);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(
      `/label-categories/all?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreCategory = async (id: string) => {
  try {
    const resp = await api.patch(`/label-categories/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelCategoryStatistics = async (createdById?: string) => {
  try {
    const queryParams = new URLSearchParams();
    if (createdById) queryParams.append("createdById", createdById);

    const query = queryParams.toString();
    const resp = await api.get(
      `/label-categories/statistics${query ? `?${query}` : ""}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
