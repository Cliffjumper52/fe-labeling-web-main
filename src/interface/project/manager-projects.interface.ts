import type { LabelPreset } from "../label-preset/label-preset.interface";
import type { Project } from "./project.interface";

export type ManagerProjectItem = Pick<
  Project,
  | "id"
  | "name"
  | "description"
  | "projectStatus"
  | "dataType"
  | "createdAt"
  | "imageUrl"
>;

export type ManagerProjectStatusFilter = "all" | Project["projectStatus"];

export type ManagerProjectOrderBy = "name" | "createdAt" | "updatedAt";

export type ManagerProjectOrder = "ASC" | "DESC";

export interface ManagerLabelPresetOption extends Pick<
  LabelPreset,
  "id" | "name" | "description" | "createdAt"
> {
  labelIds: string[];
}

export interface PaginationResult<T> {
  data: T[];
  totalPages?: number;
  pageCount?: number;
}
