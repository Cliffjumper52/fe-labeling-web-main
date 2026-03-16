import api from "../api/axios";
import type { AnnotatorSubmitDto } from "../interface/file-label/dtos/annotator-submit.dto";
import type { FilterFileLabelQueryDto } from "../interface/file-label/dtos/filter-file-label-query.dto";
import type { UpdateFileLabelDto } from "../interface/file-label/dtos/update-file-label.dto";

export const updateFileLabel = async (id: string, dto: UpdateFileLabelDto) => {
  try {
    const resp = await api.patch(`/file-labels/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreFileLabel = async (id: string) => {
  try {
    const resp = await api.patch(`/file-labels/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFileLabel = async (id: string) => {
  try {
    const resp = await api.delete(`/file-labels/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllFileLabels = async (
  filter: FilterFileLabelQueryDto,
  includeDeleted: boolean = false,
  excludeReassigned?: boolean,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.projectId) queryParams.append("projectId", filter.projectId);
    if (filter.fileId) queryParams.append("fileId", filter.fileId);
    if (filter.labelId) queryParams.append("labelId", filter.labelId);
    if (filter.annotatorId)
      queryParams.append("annotatorId", filter.annotatorId);
    if (filter.reviewerId) queryParams.append("reviewerId", filter.reviewerId);
    if (filter.status) queryParams.append("status", filter.status);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    if (excludeReassigned !== undefined)
      queryParams.append("excludeReassigned", excludeReassigned.toString());
    const resp = await api.get(`/file-labels/all?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getFileLabelsPaginated = async (
  filter: FilterFileLabelQueryDto,
  includeDeleted: boolean = false,
  excludeReassigned?: boolean,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.projectId) queryParams.append("projectId", filter.projectId);
    if (filter.fileId) queryParams.append("fileId", filter.fileId);
    if (filter.labelId) queryParams.append("labelId", filter.labelId);
    if (filter.annotatorId)
      queryParams.append("annotatorId", filter.annotatorId);
    if (filter.reviewerId) queryParams.append("reviewerId", filter.reviewerId);
    if (filter.status) queryParams.append("status", filter.status);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    if (excludeReassigned !== undefined)
      queryParams.append("excludeReassigned", excludeReassigned.toString());
    const resp = await api.get(`/file-labels?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getFileLabelById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/file-labels/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const annotatorSubmitFileLabels = async (dto: AnnotatorSubmitDto) => {
  try {
    const resp = await api.post("/file-labels/annotator/submit", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
