import api from "../api/axios";
import type { CreateLabelChecklistQuestionDto } from "../interface/label-checklist-question/dtos/create-label-checklist-question.dto";
import type { FilterLabelChecklistQuestionQueryDto } from "../interface/label-checklist-question/dtos/filter-label-checklist-question-query.dto";
import type { UpdateLabelChecklistQuestionDto } from "../interface/label-checklist-question/dtos/update-label-checklist-question.dto";

export const createLabelChecklistQuestion = async (
  dto: CreateLabelChecklistQuestionDto,
) => {
  try {
    const resp = await api.post("/label-checklist-questions", dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelChecklistQuestionsPaginated = async (
  filter: FilterLabelChecklistQuestionQueryDto,
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
    if (filter.labelId) queryParams.append("labelId", filter.labelId);
    if (filter.role) queryParams.append("role", filter.role);
    if (filter.isRequired !== undefined)
      queryParams.append("isRequired", filter.isRequired.toString());
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(
      `/label-checklist-questions?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getAllLabelChecklistQuestions = async (
  filter: FilterLabelChecklistQuestionQueryDto,
  includeDeleted: boolean = false,
) => {
  try {
    const queryParams = new URLSearchParams();
    if (filter.search) queryParams.append("search", filter.search);
    if (filter.searchBy) queryParams.append("searchBy", filter.searchBy);
    if (filter.orderBy) queryParams.append("orderBy", filter.orderBy);
    if (filter.order) queryParams.append("order", filter.order);
    if (filter.labelId) queryParams.append("labelId", filter.labelId);
    if (filter.role) queryParams.append("role", filter.role);
    if (filter.isRequired !== undefined)
      queryParams.append("isRequired", filter.isRequired.toString());
    if (includeDeleted)
      queryParams.append("includeDeleted", includeDeleted.toString());
    const resp = await api.get(
      `/label-checklist-questions/all?${queryParams.toString()}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getLabelChecklistQuestionById = async (
  id: string,
  includeDeleted: boolean = false,
) => {
  try {
    const resp = await api.get(
      `/label-checklist-questions/${id}?includeDeleted=${includeDeleted}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const updateLabelChecklistQuestion = async (
  id: string,
  dto: UpdateLabelChecklistQuestionDto,
) => {
  try {
    const resp = await api.patch(`/label-checklist-questions/${id}`, dto);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const restoreLabelChecklistQuestion = async (id: string) => {
  try {
    const resp = await api.patch(`/label-checklist-questions/restore/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const deleteLabelChecklistQuestion = async (id: string) => {
  try {
    const resp = await api.delete(`/label-checklist-questions/${id}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};
