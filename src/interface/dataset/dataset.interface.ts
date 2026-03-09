import type { ExportFormat } from "../enums/domain.enums";
import type {
  BaseEntityModel,
  EntityReference,
} from "../common/base-entity.interface";

export interface Dataset extends BaseEntityModel {
  snapshotId: string;
  version: string;
  exportFormatEnum: ExportFormat;
  exportConfig: Record<string, unknown> | null;
  datasetData: Record<string, unknown> | null;
  downloadUrl: string | null;
  fileSize: number | string | null;
  createdById: string;
  createdBy?: EntityReference;
}
