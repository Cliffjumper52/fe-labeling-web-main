import api from "../api/axios";
import type { CompleteProjectDto } from "../interface/project/dtos/complete-project.dto";
import type { CreateProjectDto } from "../interface/project/dtos/create-project.dto";
import type { FilterProjectQueryDto } from "../interface/project/dtos/filter-project-query.dto";
import type { UpdateProjectDto } from "../interface/project/dtos/update-project.dto";

const buildCreateProjectFormData = (
  dto: CreateProjectDto,
  image?: File,
): FormData => {
  const formData = new FormData();
  formData.append("name", dto.name);
  if (dto.description) formData.append("description", dto.description);
  formData.append("dataType", dto.dataType);
  dto.availableLabelIds.forEach((labelId) =>
    formData.append("availableLabelIds", labelId),
  );
  if (image) formData.append("image", image);
  return formData;
};

const buildUpdateProjectFormData = (
  dto: UpdateProjectDto,
  image?: File,
): FormData => {
  const formData = new FormData();
  formData.append("name", dto.name);
  if (dto.description) formData.append("description", dto.description);
  formData.append("dataType", dto.dataType);
  if (image) formData.append("image", image);
  return formData;
};

export const createProject = async (dto: CreateProjectDto, image?: File) => {
  try {
    const formData = buildCreateProjectFormData(dto, image);
    const resp = await api.post("/projects", formData);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateProject = async (
  id: string,
  dto: UpdateProjectDto,
  image?: File,
) => {
  try {
    const formData = buildUpdateProjectFormData(dto, image);
    const resp = await api.patch(`/projects/${id}`, formData);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProject = async (id: string) => {
  try {
    const resp = await api.delete(`/projects/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectsPaginated = async (filter: FilterProjectQueryDto) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.name) queryParams.append("name", filter.name);
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.page) queryParams.append("page", filter.page.toString());
    if (filter.limit) queryParams.append("limit", filter.limit.toString());
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.includeDeleted !== undefined)
      queryParams.append("includeDeleted", filter.includeDeleted.toString());
    const resp = await api.get(`/projects?${queryParams.toString()}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/projects/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const completeProject = async (dto: CompleteProjectDto) => {
  try {
    const resp = await api.post("/projects/manager/complete", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
