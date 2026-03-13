import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { ExportRequestDto } from "../../../interface/dataset/dtos/export-request.dto";

type SnapshotExportUiStatus = "IDLE" | "PENDING" | "DONE" | "FAILED";

type Props = {
  open: boolean;
  closing: boolean;
  snapshotName: string | null;
  options: Required<ExportRequestDto>;
  status: SnapshotExportUiStatus;
  statusError: string | null;
  exporting: boolean;
  downloading: boolean;
  canDownload: boolean;
  onOptionChange: (
    key: keyof Required<ExportRequestDto>,
    value: boolean,
  ) => void;
  onStartExport: () => void;
  onDownload: () => void;
  onClose: () => void;
};

const statusStyles: Record<SnapshotExportUiStatus, string> = {
  IDLE: "bg-gray-100 text-gray-700",
  PENDING: "bg-amber-100 text-amber-700",
  DONE: "bg-emerald-100 text-emerald-700",
  FAILED: "bg-rose-100 text-rose-700",
};

export default function ProjectEditSnapshotExportModal({
  open,
  closing,
  snapshotName,
  options,
  status,
  statusError,
  exporting,
  downloading,
  canDownload,
  onOptionChange,
  onStartExport,
  onDownload,
  onClose,
}: Props) {
  if (!open) {
    return null;
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4"
      onClick={handleOverlayClick}
    >
      <div
        className={`max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
          closing ? "modal-pop-out" : "modal-pop"
        }`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Export snapshot
            </h3>
            <p className="text-xs text-gray-500">
              {snapshotName
                ? `Snapshot: ${snapshotName}`
                : "Select export options"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4 p-4">
          <div className="space-y-2 rounded-md border border-gray-200 p-3">
            <p className="text-sm font-semibold text-gray-800">
              Export options
            </p>

            <label className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Include file URL
              <input
                type="checkbox"
                checked={options.includeFileUrl}
                onChange={(event) =>
                  onOptionChange("includeFileUrl", event.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Include annotator info
              <input
                type="checkbox"
                checked={options.includeAnnotatorInfo}
                onChange={(event) =>
                  onOptionChange("includeAnnotatorInfo", event.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Include reviewer info
              <input
                type="checkbox"
                checked={options.includeReviewerInfo}
                onChange={(event) =>
                  onOptionChange("includeReviewerInfo", event.target.checked)
                }
              />
            </label>

            <label className="flex items-center justify-between gap-3 rounded border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              Include label color
              <input
                type="checkbox"
                checked={options.includeLabelColor}
                onChange={(event) =>
                  onOptionChange("includeLabelColor", event.target.checked)
                }
              />
            </label>
          </div>

          <div className="rounded-md border border-gray-200 p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-gray-800">
                Export status
              </p>
              <span
                className={`rounded px-2 py-0.5 text-xs font-semibold ${statusStyles[status]}`}
              >
                {status}
              </span>
            </div>

            <p className="mt-2 text-xs text-gray-500">
              Status updates automatically every 1-2 seconds after starting
              export.
            </p>

            {statusError && (
              <p className="mt-2 text-xs font-semibold text-rose-600">
                {statusError}
              </p>
            )}

            {canDownload && (
              <div className="mt-3 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2">
                <p className="text-xs text-emerald-700">
                  Export is ready. Click file to download.
                </p>
                <button
                  type="button"
                  onClick={onDownload}
                  disabled={downloading}
                  className="mt-1 text-sm font-semibold text-blue-700 underline disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {downloading ? "Downloading..." : "dataset.zip"}
                </button>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Close
            </button>
            <button
              type="button"
              onClick={onStartExport}
              disabled={exporting}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {exporting ? "Starting..." : "Export"}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
