import type { ChecklistAnswer } from "../../../interface/checklist-answer/checklist-answer.interface";
import type { FileLabel } from "../../../interface/file-label/file-label.interface";
import type { LabelChecklistQuestion } from "../../../interface/label-checklist-question/label-checklist-question.interface";
import { ConfirmButton } from "../../common/confirm-modal";

export type WorkflowModalMode = "assign" | "resubmit" | "view";

type Props = {
  mode: WorkflowModalMode;
  labelName: string;
  fileLabel: FileLabel | null;
  canSubmitForSelectedFile: boolean;
  selectedFileStatus: string | null;
  checklistQuestions: LabelChecklistQuestion[];
  loadingChecklistQuestions: boolean;
  checklistQuestionsError: string | null;
  answersByQuestionId: Record<string, { answer: boolean; notes: string }>;
  submissionNotes: string;
  requiredCount: number;
  answeredCount: number;
  requiredAnsweredCount: number;
  hasMissingRequiredChecklist: boolean;
  checklistHistory: ChecklistAnswer[];
  submittingChecklist: boolean;
  submitChecklistError: string | null;
  submitChecklistSuccess: string | null;
  mapFileLabelStatusToBadge: (status: FileLabel["status"]) => string;
  mapFileLabelStatusToText: (status: FileLabel["status"]) => string;
  onClose: () => void;
  onToggleChecklistQuestion: (questionId: string) => void;
  onQuestionNoteChange: (questionId: string, notes: string) => void;
  onSubmissionNotesChange: (value: string) => void;
  onSubmitChecklist: () => void;
};

export default function WorkflowModal({
  mode,
  labelName,
  fileLabel,
  canSubmitForSelectedFile,
  selectedFileStatus,
  checklistQuestions,
  loadingChecklistQuestions,
  checklistQuestionsError,
  answersByQuestionId,
  submissionNotes,
  requiredCount,
  answeredCount,
  requiredAnsweredCount,
  hasMissingRequiredChecklist,
  checklistHistory,
  submittingChecklist,
  submitChecklistError,
  submitChecklistSuccess,
  mapFileLabelStatusToBadge,
  mapFileLabelStatusToText,
  onClose,
  onToggleChecklistQuestion,
  onQuestionNoteChange,
  onSubmissionNotesChange,
  onSubmitChecklist,
}: Props) {
  const isChecklistMode = mode === "assign" || mode === "resubmit";
  const selectedFileStatusText = selectedFileStatus
    ? selectedFileStatus.replaceAll("_", " ")
    : "unknown";
  const disableChecklistSubmit =
    submittingChecklist ||
    loadingChecklistQuestions ||
    Boolean(checklistQuestionsError) ||
    checklistQuestions.length === 0 ||
    hasMissingRequiredChecklist ||
    !canSubmitForSelectedFile;
  const checklistSubmitLabel =
    mode === "resubmit" ? "Resubmit Checklist" : "Submit Checklist";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-2xl rounded-lg border border-gray-300 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">
            {mode === "assign"
              ? `Start Annotation - ${labelName}`
              : mode === "resubmit"
                ? `Resubmit Annotation - ${labelName}`
                : `Label Details - ${labelName}`}
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            x
          </button>
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-4">
          {isChecklistMode ? (
            <div className="space-y-3">
              <p className="text-sm text-gray-600">
                {mode === "resubmit"
                  ? "Complete checklist before re-submitting this label."
                  : "Complete checklist before creating first submission for this label."}
              </p>

              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <div className="flex flex-wrap items-center gap-3">
                  <span>Total: {checklistQuestions.length}</span>
                  <span>
                    Required: <strong>{requiredCount}</strong>
                  </span>
                  <span>Checked: {answeredCount}</span>
                  <span>
                    Required checked: {requiredAnsweredCount}/{requiredCount}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-500">
                  <span className="font-semibold text-rose-600">*</span> marks
                  required questions.
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  File status:{" "}
                  <span className="font-semibold">
                    {selectedFileStatusText}
                  </span>
                </p>
              </div>

              {!canSubmitForSelectedFile ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  Submission is available only when file status is in annotation
                  or requires fix.
                </p>
              ) : null}

              {hasMissingRequiredChecklist && requiredCount > 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  Required checklist questions are still incomplete.
                </p>
              ) : null}

              {loadingChecklistQuestions ? (
                <p className="text-xs text-gray-500">
                  Loading checklist questions...
                </p>
              ) : null}

              {checklistQuestionsError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                  {checklistQuestionsError}
                </p>
              ) : null}

              {!loadingChecklistQuestions &&
              !checklistQuestionsError &&
              checklistQuestions.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No checklist questions configured for this label and annotator
                  role.
                </p>
              ) : null}

              {checklistQuestions.map((question) => (
                <div
                  key={question.id}
                  className="space-y-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(
                        answersByQuestionId[question.id]?.answer,
                      )}
                      onChange={() => onToggleChecklistQuestion(question.id)}
                    />
                    <span>
                      {question.name}
                      {question.isRequired ? (
                        <span className="ml-1 font-semibold text-rose-600">
                          *
                        </span>
                      ) : null}
                    </span>
                  </label>

                  {question.description ? (
                    <p className="pl-6 text-xs text-gray-500">
                      {question.description}
                    </p>
                  ) : null}

                  <input
                    value={answersByQuestionId[question.id]?.notes ?? ""}
                    onChange={(event) =>
                      onQuestionNoteChange(question.id, event.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                    placeholder="Optional note for this question"
                  />
                </div>
              ))}

              <div className="space-y-1 rounded-md border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold text-gray-600">
                  Submission note
                </p>
                <textarea
                  value={submissionNotes}
                  onChange={(event) =>
                    onSubmissionNotesChange(event.target.value)
                  }
                  className="min-h-20 w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                  placeholder="Optional overall note for this submission"
                />
              </div>

              {submitChecklistError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                  {submitChecklistError}
                </p>
              ) : null}

              {submitChecklistSuccess ? (
                <p className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-1 text-xs text-emerald-700">
                  {submitChecklistSuccess}
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3 text-xs text-gray-700">
                <p>
                  FileLabel ID:{" "}
                  <span className="font-semibold">{fileLabel?.id ?? "--"}</span>
                </p>
                <p className="mt-1">
                  Status:{" "}
                  <span
                    className={`rounded px-2 py-[2px] font-semibold ${
                      fileLabel
                        ? mapFileLabelStatusToBadge(fileLabel.status)
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {fileLabel
                      ? mapFileLabelStatusToText(fileLabel.status)
                      : "unknown"}
                  </span>
                </p>
                <p className="mt-1">Created: {fileLabel?.createdAt ?? "--"}</p>
                <p className="mt-1">Updated: {fileLabel?.updatedAt ?? "--"}</p>
                <p className="mt-1">
                  Checklist answer refs:{" "}
                  {fileLabel?.checklistAnswers?.length ?? 0}
                </p>
              </div>

              {fileLabel?.checklistAnswers?.length ? (
                <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Checklist history snapshots
                  </p>

                  {checklistHistory.length === 0 ? (
                    <p className="mt-2 text-xs text-gray-500">
                      Checklist answers exist but detailed snapshot fields are
                      not included in this response.
                    </p>
                  ) : null}

                  <div className="mt-2 space-y-3">
                    {checklistHistory.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-gray-700">
                            Attempt {snapshot.labelAttemptNumber}
                          </p>
                          <span className="rounded bg-gray-200 px-2 py-[2px] text-[11px] font-semibold uppercase text-gray-700">
                            {snapshot.roleType}
                          </span>
                        </div>

                        <p className="mt-1 text-[11px] text-gray-500">
                          Type: {snapshot.answerType} | Created:{" "}
                          {snapshot.createdAt}
                        </p>

                        <p className="mt-1 text-[11px] text-gray-500">
                          Answered by: {snapshot.answerById}
                        </p>

                        {snapshot.answerData?.notes ? (
                          <p className="mt-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-600">
                            Note: {snapshot.answerData.notes}
                          </p>
                        ) : null}

                        {snapshot.answerData?.answers?.length ? (
                          <div className="mt-2 space-y-2">
                            {snapshot.answerData.answers.map((answer) => (
                              <div
                                key={`${snapshot.id}-${answer.questionId}`}
                                className="rounded border border-gray-200 bg-white px-2 py-2"
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <p className="text-xs font-semibold text-gray-700">
                                    {answer.questionName || answer.questionId}
                                    {answer.questionIsRequired ? (
                                      <span className="ml-1 text-rose-600">
                                        *
                                      </span>
                                    ) : null}
                                  </p>
                                  <span
                                    className={`rounded px-2 py-[2px] text-[11px] font-semibold ${
                                      answer.answer
                                        ? "bg-emerald-100 text-emerald-700"
                                        : "bg-rose-100 text-rose-700"
                                    }`}
                                  >
                                    {answer.answer ? "Yes" : "No"}
                                  </span>
                                </div>

                                {answer.questionDescription ? (
                                  <p className="mt-1 text-[11px] text-gray-500">
                                    {answer.questionDescription}
                                  </p>
                                ) : null}

                                {answer.notes ? (
                                  <p className="mt-1 text-[11px] text-gray-600">
                                    Note: {answer.notes}
                                  </p>
                                ) : null}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-gray-500">
                            No answer rows in this snapshot.
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
                  No checklist history entries returned for this file label.
                </p>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-white px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:-translate-y-[1px] hover:border-slate-400 hover:bg-slate-50"
          >
            Close
          </button>

          {isChecklistMode ? (
            <ConfirmButton
              label={
                submittingChecklist ? "Submitting..." : checklistSubmitLabel
              }
              variant="primary"
              size="sm"
              className="!rounded-md !bg-gradient-to-r !from-indigo-600 !to-blue-600 !text-white !shadow-md transition-all hover:!from-indigo-500 hover:!to-blue-500"
              disabled={disableChecklistSubmit}
              modalHeader={
                mode === "resubmit"
                  ? "Resubmit this checklist?"
                  : "Submit this checklist?"
              }
              modalBody={`Confirm ${
                mode === "resubmit" ? "resubmission" : "submission"
              } for label "${labelName}". This action moves the label workflow forward.`}
              confirmLabel={mode === "resubmit" ? "Resubmit" : "Submit"}
              onConfirm={onSubmitChecklist}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}
