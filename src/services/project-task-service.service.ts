import api from "../api/axios";
import type { CreateProjectTaskDto } from "../interface/project-task/dtos/create-project-task.dto";
import type { FilterProjectTaskQueryDto } from "../interface/project-task/dtos/filter-project-task-query.dto";
import type { PatchProjectTaskDto } from "../interface/project-task/dtos/patch-project-task.dto";

const appendProjectTaskFilter = (
  queryParams: URLSearchParams,
  filter: FilterProjectTaskQueryDto,
) => {
  if (filter.page) queryParams.append("page", filter.page.toString());
  if (filter.limit) queryParams.append("limit", filter.limit.toString());
  if (filter.order) queryParams.append("order", filter.order);
  if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
  if (filter.projectId) queryParams.append("projectId", filter.projectId);
  if (filter.status) queryParams.append("status", filter.status);
  if (filter.assignedByUserId)
    queryParams.append("assignedByUserId", filter.assignedByUserId);
  if (filter.assignedToUserId)
    queryParams.append("assignedToUserId", filter.assignedToUserId);
};

export const createProjectTask = async (dto: CreateProjectTaskDto) => {
  try {
    const resp = await api.post("/project-tasks", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getManagerProjectTasks = async (
  filter: FilterProjectTaskQueryDto,
) => {
  try {
    const queryParams = new URLSearchParams();
    appendProjectTaskFilter(queryParams, filter);
    const resp = await api.get(
      `/project-tasks/manager?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getCurrentUserProjectTasks = async (
  filter: FilterProjectTaskQueryDto,
) => {
  try {
    const queryParams = new URLSearchParams();
    appendProjectTaskFilter(queryParams, filter);
    const resp = await api.get(
      `/project-tasks/current-user?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectTaskById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/project-tasks/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const patchProjectTask = async (
  id: string,
  dto: PatchProjectTaskDto,
) => {
  try {
    const resp = await api.patch(`/project-tasks/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProjectTask = async (id: string) => {
  try {
    const resp = await api.delete(`/project-tasks/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
