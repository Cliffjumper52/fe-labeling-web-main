import type { File as ProjectFile } from "../../../../interface/file/file.interface";
import type { FileLabel } from "../../../../interface/file-label/file-label.interface";

type Props = {
  selectedFile: ProjectFile | null;
  reviewerFileLabels: FileLabel[];
  loadingReviewerFileLabels: boolean;
  reviewerFileLabelsError: string | null;
  selectedAssignedFileLabelId: string | null;
  labelNameById: Map<string, string>;
  selectedAssignedLabelName: string;
  selectedAssignedFileLabel: FileLabel | null;
  canOpenSelectedLabelReview: boolean;
  onSelectFileLabelId: (id: string) => void;
  onOpenSelectedLabelDetails: () => void;
  onOpenSelectedLabelReview: () => void;
};

const mapFileLabelStatusToBadge = (status: FileLabel["status"]): string => {
  if (status === "approved" || status === "done") {
    return "bg-emerald-100 text-emerald-700";
  }
  if (status === "rejected" || status === "reassigned") {
    return "bg-red-100 text-red-700";
  }
  if (
    status === "pending_review" ||
    status === "reviewed" ||
    status === "in_progress"
  ) {
    return "bg-amber-100 text-amber-700";
  }
  return "bg-gray-100 text-gray-600";
};

const mapFileLabelStatusToText = (status: FileLabel["status"]): string =>
  status.replaceAll("_", " ");

export default function AssignedLabelsPanel({
  selectedFile,
  reviewerFileLabels,
  loadingReviewerFileLabels,
  reviewerFileLabelsError,
  selectedAssignedFileLabelId,
  labelNameById,
  selectedAssignedLabelName,
  selectedAssignedFileLabel,
  canOpenSelectedLabelReview,
  onSelectFileLabelId,
  onOpenSelectedLabelDetails,
  onOpenSelectedLabelReview,
}: Props) {
  return (
    <div className="space-y-4 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto lg:pr-1">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Assigned labels</p>
        <p className="mt-1 text-[11px] text-gray-500">
          {selectedFile?.fileName || selectedFile?.id || "No file selected"}
        </p>

        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {loadingReviewerFileLabels
            ? "Loading assigned labels..."
            : `${reviewerFileLabels.length} assigned labels`}
        </div>

        {reviewerFileLabelsError ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {reviewerFileLabelsError}
          </p>
        ) : null}

        <div className="mt-3 space-y-2">
          {!loadingReviewerFileLabels && reviewerFileLabels.length === 0 ? (
            <p className="text-xs text-gray-500">
              No labels assigned for this file.
            </p>
          ) : null}

          {reviewerFileLabels.map((item) => {
            const labelName = item.labelId
              ? (labelNameById.get(item.labelId) ?? item.labelId)
              : "Unassigned";
            const isSelected = selectedAssignedFileLabelId === item.id;

            return (
              <div
                key={item.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectFileLabelId(item.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    onSelectFileLabelId(item.id);
                  }
                }}
                className={`rounded-md border px-3 py-2 ${
                  isSelected
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-800">
                    {labelName}
                  </p>
                  <span
                    className={`rounded px-2 py-[2px] text-[11px] font-semibold ${mapFileLabelStatusToBadge(item.status)}`}
                  >
                    {mapFileLabelStatusToText(item.status)}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-gray-500">
                  File label ID: {item.id}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Selected label</p>
        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Current selection
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {selectedAssignedLabelName}
          </p>
          <p className="mt-1 text-xs text-gray-500">
            Status:{" "}
            {selectedAssignedFileLabel
              ? mapFileLabelStatusToText(selectedAssignedFileLabel.status)
              : "--"}
          </p>
        </div>

        <div className="mt-3">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onOpenSelectedLabelDetails}
              disabled={!selectedAssignedFileLabel}
              className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
            >
              View details
            </button>

            <button
              type="button"
              onClick={onOpenSelectedLabelReview}
              disabled={!canOpenSelectedLabelReview}
              className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              Submit review
            </button>
          </div>

          {!selectedAssignedFileLabel ? (
            <p className="mt-1 text-xs text-gray-500">
              Select a label from Assigned labels.
            </p>
          ) : null}

          {selectedAssignedFileLabel && !canOpenSelectedLabelReview ? (
            <p className="mt-1 text-xs text-amber-700">
              Review is only available when label status is pending review.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs text-gray-500">
          Checklist submissions are available in label details.
        </p>
      </div>
    </div>
  );
}
