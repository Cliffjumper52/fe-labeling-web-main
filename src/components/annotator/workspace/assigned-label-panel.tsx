import type { File as ProjectFile } from "../../../interface/file/file.interface";
import type { FileLabel } from "../../../interface/file-label/file-label.interface";
import { ConfirmButton } from "../../common/confirm-modal";

export type AssignedLabelsWorkflowMode = "assign" | "resubmit" | "view";

type Props = {
  selectedFile: ProjectFile | null;
  loadingAssignedFileLabels: boolean;
  assignedFileLabels: FileLabel[];
  assignedFileLabelsError: string | null;
  labelNameById: Map<string, string>;
  removingFileLabelId: string | null;
  labelSearch: string;
  filteredLabels: string[];
  selectedLabel: string | null;
  canAddSelectedLabel: boolean;
  canSubmitFileForReview: boolean;
  submittingFileForReview: boolean;
  submitFileForReviewError: string | null;
  isSelectedLabelAssigned: boolean;
  mapFileLabelStatusToBadge: (status: FileLabel["status"]) => string;
  mapFileLabelStatusToText: (status: FileLabel["status"]) => string;
  onRemoveFileLabel: (fileLabelId: string) => void;
  onOpenWorkflowModal: (
    mode: AssignedLabelsWorkflowMode,
    labelName: string,
    labelId?: string | null,
    fileLabelId?: string,
  ) => void;
  onLabelSearchChange: (value: string) => void;
  onSelectLabel: (label: string) => void;
  onAddLabel: () => void;
  onSubmitFileForReview: () => void;
};

export default function AssignedLabelsPanel({
  selectedFile,
  loadingAssignedFileLabels,
  assignedFileLabels,
  assignedFileLabelsError,
  labelNameById,
  removingFileLabelId,
  labelSearch,
  filteredLabels,
  selectedLabel,
  canAddSelectedLabel,
  canSubmitFileForReview,
  submittingFileForReview,
  submitFileForReviewError,
  isSelectedLabelAssigned,
  mapFileLabelStatusToBadge,
  mapFileLabelStatusToText,
  onRemoveFileLabel,
  onOpenWorkflowModal,
  onLabelSearchChange,
  onSelectLabel,
  onAddLabel,
  onSubmitFileForReview,
}: Props) {
  return (
    <div className="space-y-4 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto lg:pr-1">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Assigned labels</p>
        <p className="mt-1 text-[11px] text-gray-500">
          {selectedFile?.fileName || selectedFile?.id || "No file selected"}
        </p>

        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {loadingAssignedFileLabels
            ? "Loading assigned labels..."
            : `${assignedFileLabels.length} assigned labels`}
        </div>

        {assignedFileLabelsError ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {assignedFileLabelsError}
          </p>
        ) : null}

        <div className="mt-3 space-y-2">
          {!loadingAssignedFileLabels && assignedFileLabels.length === 0 ? (
            <p className="text-xs text-gray-500">
              No labels assigned for this file.
            </p>
          ) : null}

          {assignedFileLabels.map((item) => {
            const labelName = item.labelId
              ? (labelNameById.get(item.labelId) ?? item.labelId)
              : "Unassigned";
            const canResubmit = item.status === "rejected";
            const isRemoving = removingFileLabelId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-md border border-gray-200 bg-white px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-800">
                      {labelName}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded px-2 py-[2px] text-[11px] font-semibold ${mapFileLabelStatusToBadge(item.status)}`}
                    >
                      {mapFileLabelStatusToText(item.status)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onRemoveFileLabel(item.id)}
                      disabled={isRemoving}
                      aria-label={`Remove ${labelName}`}
                      className="text-xs font-semibold text-gray-400 hover:text-rose-600 disabled:cursor-not-allowed disabled:text-gray-300"
                    >
                      {isRemoving ? "..." : "x"}
                    </button>
                  </div>
                </div>

                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onOpenWorkflowModal(
                        "view",
                        labelName,
                        item.labelId,
                        item.id,
                      )
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-700"
                  >
                    View
                  </button>

                  {canResubmit ? (
                    <button
                      type="button"
                      onClick={() =>
                        onOpenWorkflowModal(
                          "resubmit",
                          labelName,
                          item.labelId,
                          item.id,
                        )
                      }
                      className="rounded-md border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700"
                    >
                      Resubmit
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Search label</p>
        <input
          value={labelSearch}
          onChange={(event) => onLabelSearchChange(event.target.value)}
          className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Search labels..."
        />

        <div className="mt-3 flex flex-wrap gap-2">
          {filteredLabels.length > 0 ? (
            filteredLabels.map((label) => (
              <button
                key={label}
                type="button"
                onClick={() => onSelectLabel(label)}
                className={`rounded-md border px-2 py-1 text-xs ${
                  selectedLabel === label
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 bg-white text-gray-700"
                }`}
              >
                {label}
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-500">No labels matched.</p>
          )}
        </div>

        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            Selected label
          </p>
          <p className="mt-1 text-sm font-semibold text-gray-800">
            {selectedLabel ?? "No label selected"}
          </p>
        </div>

        <div className="mt-3">
          <button
            type="button"
            onClick={onAddLabel}
            disabled={!canAddSelectedLabel}
            className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Add
          </button>

          {selectedLabel && isSelectedLabelAssigned ? (
            <p className="mt-1 text-xs text-amber-700">
              Label already assigned.
            </p>
          ) : null}

          {!selectedLabel ? (
            <p className="mt-1 text-xs text-gray-500">
              Select a label to enable Add.
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Submit for review</p>
        <p className="mt-1 text-[11px] text-gray-500">
          Once submitted, labels cannot be changed until the reviewer returns
          the file.
        </p>

        {selectedFile?.status ? (
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[11px] text-gray-500">File status:</span>
            <span className="rounded bg-gray-100 px-2 py-[2px] text-[11px] font-semibold capitalize text-gray-700">
              {selectedFile.status.replaceAll("_", " ")}
            </span>
          </div>
        ) : null}

        {submitFileForReviewError ? (
          <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {submitFileForReviewError}
          </p>
        ) : null}

        <ConfirmButton
          label={
            submittingFileForReview ? "Submitting..." : "Submit file for review"
          }
          variant="success"
          className="mt-3 !w-full !justify-center"
          disabled={!canSubmitFileForReview || submittingFileForReview}
          modalHeader="Submit file for review?"
          modalBody={`Submit "${selectedFile?.fileName || selectedFile?.id || "this file"}" for review? Once submitted, labels cannot be changed until the reviewer returns the file.`}
          confirmLabel="Submit"
          onConfirm={onSubmitFileForReview}
        />

        {!canSubmitFileForReview && selectedFile ? (
          <p className="mt-1 text-[11px] text-gray-500">
            Available when file status is in annotation or requires fix.
          </p>
        ) : null}
      </div>
    </div>
  );
}
