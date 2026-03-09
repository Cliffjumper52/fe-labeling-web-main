import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface ProjectInstruction extends BaseEntityModel {
  projectId: string;
  project?: EntityReference;
  title: string;
  content?: string;
  attachmentUrl: string | null;
}
