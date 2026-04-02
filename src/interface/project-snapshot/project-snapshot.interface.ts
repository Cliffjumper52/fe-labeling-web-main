import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface ProjectSnapshot extends BaseEntityModel {
  projectId: string;
  project?: EntityReference;
  version: string;
  name: string;
  description: string | null;
  snapshotData: Record<string, unknown>;
  totalFiles: number;
  createdById: string;
  createdBy?: EntityReference;
}

export type ProjectSnapshotListItem = Omit<ProjectSnapshot, "snapshotData">;
