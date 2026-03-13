import api from "../api/axios";
import type { CreateProjectSnapshotDto } from "../interface/project-snapshot/dtos/create-project-snapshot.dto";
import type { FilterProjectSnapshotQueryDto } from "../interface/project-snapshot/dtos/filter-project-snapshot-query.dto";
import type { UpdateProjectSnapshotDto } from "../interface/project-snapshot/dtos/update-project-snapshot.dto";

const appendProjectSnapshotFilter = (
  queryParams: URLSearchParams,
  filter: FilterProjectSnapshotQueryDto,
) => {
  if (filter.search) queryParams.append("search", filter.search);
  if (filter.page) queryParams.append("page", filter.page.toString());
  if (filter.limit) queryParams.append("limit", filter.limit.toString());
};

export const getProjectSnapshots = async (
  projectId: string,
  filter: FilterProjectSnapshotQueryDto = {},
) => {
  try {
    const queryParams = new URLSearchParams();
    appendProjectSnapshotFilter(queryParams, filter);
    const resp = await api.get(
      `/project-snapshots/project/${projectId}?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectSnapshotById = async (
  id: string,
  includeData: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/project-snapshots/${id}?includeData=${includeData}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const createProjectSnapshot = async (
  projectId: string,
  dto: CreateProjectSnapshotDto,
) => {
  try {
    const resp = await api.post(`/project-snapshots/project/${projectId}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateProjectSnapshot = async (
  id: string,
  dto: UpdateProjectSnapshotDto,
) => {
  try {
    const resp = await api.patch(`/project-snapshots/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteProjectSnapshot = async (id: string) => {
  try {
    const resp = await api.delete(`/project-snapshots/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
