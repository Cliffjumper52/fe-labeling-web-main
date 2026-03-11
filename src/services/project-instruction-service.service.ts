import api from "../api/axios";

export const getProjectInstructionByProjectId = async (projectId: string) => {
  try {
    const resp = await api.get(`/project-instruction/${projectId}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
