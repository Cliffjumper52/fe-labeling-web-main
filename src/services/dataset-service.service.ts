import api from "../api/axios";
import type { ExportRequestDto } from "../interface/dataset/dtos/export-request.dto";

export type DatasetExportJobStatus = "PENDING" | "DONE" | "FAILED";

export interface DatasetExportInitiateResponse {
  exportId: string;
  status: DatasetExportJobStatus;
}

export interface DatasetExportStatusResponse {
  exportId: string;
  status: DatasetExportJobStatus;
  fileSize: number | null;
  error: string | null;
}

const appendExportRequestQuery = (
  queryParams: URLSearchParams,
  config: ExportRequestDto,
) => {
  if (config.includeFileUrl !== undefined) {
    queryParams.append("includeFileUrl", String(config.includeFileUrl));
  }
  if (config.includeAnnotatorInfo !== undefined) {
    queryParams.append("includeAnnotatorInfo", String(config.includeAnnotatorInfo));
  }
  if (config.includeReviewerInfo !== undefined) {
    queryParams.append("includeReviewerInfo", String(config.includeReviewerInfo));
  }
  if (config.includeLabelColor !== undefined) {
    queryParams.append("includeLabelColor", String(config.includeLabelColor));
  }
};

const parseDownloadFileName = (contentDisposition?: string) => {
  if (!contentDisposition) {
    return "dataset.zip";
  }

  const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
  const raw = match?.[1] ?? match?.[2];
  if (!raw) {
    return "dataset.zip";
  }

  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
};

export const initiateDatasetExport = async (
  snapshotId: string,
  config: ExportRequestDto,
) => {
  try {
    const queryParams = new URLSearchParams();
    appendExportRequestQuery(queryParams, config);
    const queryString = queryParams.toString();
    const resp = await api.post(
      `/datasets/export/${snapshotId}${queryString ? `?${queryString}` : ""}`,
    );
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const getDatasetExportStatus = async (exportId: string) => {
  try {
    const resp = await api.get(`/datasets/export/${exportId}`);
    return resp.data;
  } catch (error) {
    throw error;
  }
};

export const downloadDatasetExport = async (exportId: string) => {
  try {
    const resp = await api.get(`/datasets/export/${exportId}/download`, {
      responseType: "blob",
    });

    const fileName = parseDownloadFileName(
      resp.headers?.["content-disposition"] as string | undefined,
    );

    return {
      blob: resp.data as Blob,
      fileName,
    };
  } catch (error) {
    throw error;
  }
};
