import api from "../api/axios";
import type { CreateLabelDto } from "../interface/label/dtos/create-label.dto";
import type { FilterLabelQueryDto } from "../interface/label/dtos/filter-label-query.dto";
import type { UpdateLabelDto } from "../interface/label/dtos/update-label.dto";

export const createLabel = async (dto: CreateLabelDto) => {
  try {
    const resp = await api.post("/labels", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelPaginated = async (
  filter: FilterLabelQueryDto,
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
    if (filter.categoryIds)
      filter.categoryIds.forEach((id) => queryParams.append("categoryIds", id));
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/labels?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateLabel = async (id: string, dto: UpdateLabelDto) => {
  try {
    const resp = await api.patch(`/labels/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/labels/${id}?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteLabel = async (id: string) => {
  try {
    const resp = await api.delete(`/labels/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllLabels = async (
  filter: FilterLabelQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.categoryIds)
      filter.categoryIds.forEach((id) => queryParams.append("categoryIds", id));
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/labels/all?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreLabel = async (id: string) => {
  try {
    const resp = await api.patch(`/labels/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllowedLabelsInProject = async (
  projectId: string,
  filter: FilterLabelQueryDto,
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
    if (filter.categoryIds)
      filter.categoryIds.forEach((id) => queryParams.append("categoryIds", id));
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());

    const resp = await api.get(
      `/labels/projects/${projectId}?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
