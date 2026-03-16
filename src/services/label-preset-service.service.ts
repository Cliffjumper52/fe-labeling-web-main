import api from "../api/axios";
import type { CreateLabelPresetDto } from "../interface/label-preset/dtos/create-label-preset.dto";
import type { FilterLabelPresetQueryDto } from "../interface/label-preset/dtos/filter-label-preset-query.dto";
import type { UpdateLabelPresetDto } from "../interface/label-preset/dtos/update-label-preset.dto";

export const createLabelPreset = async (dto: CreateLabelPresetDto) => {
  try {
    const resp = await api.post("/label-presets", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelPresetsPaginated = async (
  filter: FilterLabelPresetQueryDto,
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
    if (filter.labelIds)
      filter.labelIds.forEach((id) => queryParams.append("labelIds", id));
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/label-presets?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllLabelPresets = async (
  filter: FilterLabelPresetQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.labelIds)
      filter.labelIds.forEach((id) => queryParams.append("labelIds", id));
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/label-presets/all?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelPresetById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/label-presets/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateLabelPreset = async (
  id: string,
  dto: UpdateLabelPresetDto,
) => {
  try {
    const resp = await api.patch(`/label-presets/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreLabelPreset = async (id: string) => {
  try {
    const resp = await api.patch(`/label-presets/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteLabelPreset = async (id: string) => {
  try {
    const resp = await api.delete(`/label-presets/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelPresetStatistics = async (createdById?: string) => {
  try {
    const queryParams = new URLSearchParams();
    if (createdById) queryParams.append("createdById", createdById);

    const query = queryParams.toString();
    const resp = await api.get(
      `/label-presets/statistics${query ? `?${query}` : ""}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
