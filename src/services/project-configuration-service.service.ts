import api from "../api/axios";
import type { UpdateProjectConfigurationDto } from "../interface/project-configuration/dtos/update-project-configuration.dto";

export const getProjectConfigurationByProjectId = async (projectId: string) => {
  try {
    const resp = await api.get(`/project-configuration/${projectId}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateProjectConfiguration = async (
  projectId: string,
  dto: UpdateProjectConfigurationDto,
) => {
  try {
    const resp = await api.patch(`/project-configuration/${projectId}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
