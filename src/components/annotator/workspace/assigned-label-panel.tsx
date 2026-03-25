import { useState } from "react";
import type { File as ProjectFile } from "../../../interface/file/file.interface";
import type { FileLabel } from "../../../interface/file-label/file-label.interface";
import {
  getAiLabelSuggestion,
  type AiLabelSuggestionResult,
} from "../../../services/file-label-service.service";
import { ConfirmButton } from "../../common/confirm-modal";

export type AssignedLabelsWorkflowMode = "assign" | "resubmit" | "view";

type Props = {
  selectedFile: ProjectFile | null;
  loadingAssignedFileLabels: boolean;
  assignedFileLabels: FileLabel[];
  loadingReassignedFileLabels: boolean;
  reassignedFileLabels: FileLabel[];
  assignedFileLabelsError: string | null;
  reassignedFileLabelsError: string | null;
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
  loadingReassignedFileLabels,
  reassignedFileLabels,
  assignedFileLabelsError,
  reassignedFileLabelsError,
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
  const [showAiMenu, setShowAiMenu] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AiLabelSuggestionResult | null>(
    null,
  );
  const [aiError, setAiError] = useState<string | null>(null);

  const handleGetAiSuggestion = async () => {
    if (!selectedFile?.id) {
      return;
    }

    setAiLoading(true);
    setAiError(null);
    setAiResult(null);

    try {
      const resp = await getAiLabelSuggestion(
        selectedFile.id,
        aiPrompt.trim() || undefined,
      );
      const suggestion = resp?.data ?? null;
      setAiResult(suggestion);

      if (suggestion?.labelName) {
        onSelectLabel(suggestion.labelName);
      }

      setShowAiMenu(false);
    } catch (error) {
      setAiError(
        error instanceof Error ? error.message : "AI suggestion failed.",
      );
    } finally {
      setAiLoading(false);
    }
  };

  const handleCloseAiMenu = () => {
    setShowAiMenu(false);
    setAiError(null);
  };

  const handleDismissAiResult = () => {
    setAiResult(null);
    setAiError(null);
  };

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
        <p className="text-xs font-semibold text-gray-500">
          Previous reassigned labels (read-only)
        </p>
        <p className="mt-1 text-[11px] text-gray-500">
          Historical labels from earlier annotator attempts for this file.
        </p>

        <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
          {loadingReassignedFileLabels
            ? "Loading reassigned labels..."
            : `${reassignedFileLabels.length} reassigned labels`}
        </div>

        {reassignedFileLabelsError ? (
          <p className="mt-3 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {reassignedFileLabelsError}
          </p>
        ) : null}

        <div className="mt-3 space-y-2">
          {!loadingReassignedFileLabels && reassignedFileLabels.length === 0 ? (
            <p className="text-xs text-gray-500">
              No reassigned label history for this file.
            </p>
          ) : null}

          {reassignedFileLabels.map((item) => {
            const labelName = item.labelId
              ? (labelNameById.get(item.labelId) ?? item.labelId)
              : "Unassigned";
            const annotatorName =
              typeof (item.annotator as { username?: unknown } | undefined)
                ?.username === "string"
                ? ((item.annotator as { username?: string }).username ??
                  item.annotatorId)
                : item.annotatorId;

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
                    <p className="text-[11px] text-gray-500">
                      Annotator: {annotatorName}
                    </p>
                  </div>
                  <span
                    className={`rounded px-2 py-[2px] text-[11px] font-semibold ${mapFileLabelStatusToBadge(item.status)}`}
                  >
                    {mapFileLabelStatusToText(item.status)}
                  </span>
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
                    View details
                  </button>
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

        <div className="mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={onAddLabel}
            disabled={!canAddSelectedLabel}
            className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            Add
          </button>

          <button
            type="button"
            disabled={!selectedFile?.id || aiLoading}
            onClick={() => {
              setShowAiMenu((prev) => !prev);
              setAiError(null);
            }}
            className="flex items-center gap-1 rounded-md border border-violet-300 bg-violet-50 px-3 py-2 text-xs font-semibold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {aiLoading ? (
              <>
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
                Thinking...
              </>
            ) : (
              <>✨ AI Suggest</>
            )}
          </button>
        </div>

        {showAiMenu ? (
          <div className="mt-2 rounded-lg border border-violet-200 bg-violet-50 p-3">
            <p className="text-[11px] font-semibold text-gray-600">
              AI Label Suggestion
            </p>
            <p className="mt-0.5 text-[11px] text-gray-500">
              Optionally describe what you'd like the AI to focus on.
            </p>
            <textarea
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              rows={3}
              placeholder="Additional prompt (optional)..."
              className="mt-2 w-full rounded-md border border-gray-300 bg-white px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-violet-400"
            />
            {aiError ? (
              <p className="mt-1 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-[11px] text-rose-700">
                {aiError}
              </p>
            ) : null}
            <div className="mt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseAiMenu}
                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-[11px] font-semibold text-gray-600"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={aiLoading}
                onClick={() => {
                  void handleGetAiSuggestion();
                }}
                className="rounded-md bg-violet-600 px-2 py-1 text-[11px] font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {aiLoading ? "Thinking..." : "Submit"}
              </button>
            </div>
          </div>
        ) : null}

        {aiResult ? (
          <div
            className={`mt-2 rounded-md border px-3 py-2.5 text-xs ${
              aiResult.labelId
                ? "border-violet-200 bg-violet-50"
                : "border-amber-200 bg-amber-50"
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <p
                className={`font-semibold ${aiResult.labelId ? "text-violet-800" : "text-amber-800"}`}
              >
                {aiResult.labelId
                  ? `✨ AI suggests: ${aiResult.labelName ?? aiResult.labelId}`
                  : "✨ AI made no selection"}
              </p>
              <button
                type="button"
                onClick={handleDismissAiResult}
                className="shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Dismiss AI result"
              >
                ×
              </button>
            </div>
            {aiResult.labelId ? (
              <p className="mt-0.5 text-[11px] text-violet-600">
                Confidence: {Math.round(aiResult.confidence * 100)}%
              </p>
            ) : null}
            <p
              className={`mt-1.5 text-[11px] ${aiResult.labelId ? "text-violet-700" : "text-amber-700"}`}
            >
              {aiResult.reasoning}
            </p>
          </div>
        ) : null}

        {selectedLabel && isSelectedLabelAssigned ? (
          <p className="mt-1 text-xs text-amber-700">Label already assigned.</p>
        ) : null}

        {!selectedLabel ? (
          <p className="mt-1 text-xs text-gray-500">
            Select a label to enable Add.
          </p>
        ) : null}
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
            Add at least 1 label to this file before submitting for review.
          </p>
        ) : null}
      </div>
    </div>
  );
}
