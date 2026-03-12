import api from "../api/axios";
import type { CreateFileDto } from "../interface/file/dtos/create-file.dto";
import type { FilterFileQueryDto } from "../interface/file/dtos/filter-file-query.dto";
import type { UpdateFileDto } from "../interface/file/dtos/update-file.dto";

const buildCreateFileFormData = (dto: CreateFileDto, file?: File): FormData => {
  const formData = new FormData();
  formData.append("projectId", dto.projectId);
  if (dto.annotatorId) formData.append("annotatorId", dto.annotatorId);
  if (dto.reviewerId) formData.append("reviewerId", dto.reviewerId);
  if (dto.status) formData.append("status", dto.status);
  if (file) formData.append("file", file);
  return formData;
};

const buildUpdateFileFormData = (dto: UpdateFileDto, file?: File): FormData => {
  const formData = new FormData();
  if (dto.projectId) formData.append("projectId", dto.projectId);
  if (dto.annotatorId) formData.append("annotatorId", dto.annotatorId);
  if (dto.reviewerId) formData.append("reviewerId", dto.reviewerId);
  if (dto.status) formData.append("status", dto.status);
  if (file) formData.append("file", file);
  return formData;
};

export const createFile = async (dto: CreateFileDto, file?: File) => {
  try {
    const formData = buildCreateFileFormData(dto, file);
    const resp = await api.post("/files", formData);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateFile = async (
  id: string,
  dto: UpdateFileDto,
  file?: File,
) => {
  try {
    const formData = buildUpdateFileFormData(dto, file);
    const resp = await api.patch(`/files/${id}`, formData);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getFilesPaginated = async (
  filter: FilterFileQueryDto,
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
    if (filter.projectId) queryParams.append("projectId", filter.projectId);
    if (filter.uploadedById)
      queryParams.append("uploadedById", filter.uploadedById);
    if (filter.annotatorId)
      queryParams.append("annotatorId", filter.annotatorId);
    if (filter.reviewerId) queryParams.append("reviewerId", filter.reviewerId);
    if (filter.contentType)
      queryParams.append("contentType", filter.contentType);
    if (filter.status) queryParams.append("status", filter.status);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/files?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllFiles = async (
  filter: FilterFileQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.projectId) queryParams.append("projectId", filter.projectId);
    if (filter.uploadedById)
      queryParams.append("uploadedById", filter.uploadedById);
    if (filter.annotatorId)
      queryParams.append("annotatorId", filter.annotatorId);
    if (filter.reviewerId) queryParams.append("reviewerId", filter.reviewerId);
    if (filter.contentType)
      queryParams.append("contentType", filter.contentType);
    if (filter.status) queryParams.append("status", filter.status);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(`/files/all?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getFileById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(`/files/${id}?includeDeleted=${includeDeleted}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreFile = async (id: string) => {
  try {
    const resp = await api.post(`/files/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteFile = async (id: string) => {
  try {
    const resp = await api.delete(`/files/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getUnassignedFiles = async (
  projectId: string,
  role: string,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (role) queryParams.append("role", role);
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(
      `/files/unassigned/${projectId}?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};
