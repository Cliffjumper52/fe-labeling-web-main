import api from "../api/axios";
import type { CreateProjectInstructionDto } from "../interface/project-instruction/dtos/create-project-instruction.dto";
import type { UpdateProjectInstructionDto } from "../interface/project-instruction/dtos/update-project-instruction.dto";

const buildCreateProjectInstructionFormData = (
  dto: CreateProjectInstructionDto,
  file?: File,
): FormData => {
  const formData = new FormData();
  formData.append("projectId", dto.projectId);
  formData.append("title", dto.title);
  formData.append("content", dto.content);
  if (file) formData.append("file", file);
  return formData;
};

const buildUpdateProjectInstructionFormData = (
  dto: UpdateProjectInstructionDto,
  file?: File,
): FormData => {
  const formData = new FormData();
  formData.append("title", dto.title);
  formData.append("content", dto.content);
  if (file) formData.append("file", file);
  return formData;
};

export const createProjectInstruction = async (
  dto: CreateProjectInstructionDto,
  file?: File,
) => {
  try {
    const formData = buildCreateProjectInstructionFormData(dto, file);
    const resp = await api.post("/project-instruction", formData);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateProjectInstruction = async (
  projectId: string,
  dto: UpdateProjectInstructionDto,
  file?: File,
) => {
  try {
    const formData = buildUpdateProjectInstructionFormData(dto, file);
    const resp = await api.patch(`/project-instruction/${projectId}`, formData);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getProjectInstructionByProjectId = async (projectId: string) => {
  try {
    const resp = await api.get(`/project-instruction/${projectId}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
