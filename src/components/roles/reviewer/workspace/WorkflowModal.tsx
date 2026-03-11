import type { ChecklistAnswer } from "../../../../interface/checklist-answer/checklist-answer.interface";
import type { Decision } from "../../../../interface/enums/domain.enums";
import type { FileLabel } from "../../../../interface/file-label/file-label.interface";
import type { LabelChecklistQuestion } from "../../../../interface/label-checklist-question/label-checklist-question.interface";
import type { ReviewErrorType } from "../../../../interface/review-error-type/review-error-type.interface";
import { Severity } from "../../../../interface/review-error-type/enums/severity.enums";
import type { SubmitReviewErrorDto } from "../../../../services/review-service.service";

export type WorkflowModalMode = "view" | "review";

export type ReviewErrorTypeCreateFormState = {
  name: string;
  description: string;
  severity: Severity;
  scoreImpact: string;
};

type Props = {
  mode: WorkflowModalMode;
  labelName: string;
  fileLabel: FileLabel | null;

  reviewChecklistQuestions: LabelChecklistQuestion[];
  loadingReviewChecklistQuestions: boolean;
  reviewChecklistQuestionsError: string | null;
  reviewAnswersByQuestionId: Record<string, { answer: boolean; notes: string }>;
  reviewChecklistNotes: string;
  reviewRequiredCount: number;
  reviewRequiredAnsweredCount: number;
  hasMissingRequiredChecklist: boolean;

  reviewDecision: Decision;
  reviewFeedback: string;

  reviewErrorTypes: ReviewErrorType[];
  loadingReviewErrorTypes: boolean;
  reviewErrorTypesError: string | null;
  reviewErrorTypeSearch: string;
  filteredReviewErrorTypes: ReviewErrorType[];
  selectedReviewErrors: SubmitReviewErrorDto[];
  selectedReviewErrorTypeIds: Set<string>;

  createReviewErrorTypeForm: ReviewErrorTypeCreateFormState;
  creatingReviewErrorType: boolean;
  createReviewErrorTypeError: string | null;

  checklistHistory: ChecklistAnswer[];

  submittingReview: boolean;
  submitReviewError: string | null;

  onClose: () => void;
  onToggleChecklistQuestion: (questionId: string) => void;
  onReviewQuestionNoteChange: (questionId: string, notes: string) => void;
  onReviewChecklistNotesChange: (value: string) => void;
  onReviewFeedbackChange: (value: string) => void;
  onReviewDecisionChange: (value: Decision) => void;
  onToggleReviewErrorType: (reviewErrorTypeId: string) => void;
  onSelectedReviewErrorDescriptionChange: (
    reviewErrorTypeId: string,
    description: string,
  ) => void;
  onReviewErrorTypeSearchChange: (value: string) => void;
  onCreateReviewErrorTypeFormChange: (
    patch: Partial<ReviewErrorTypeCreateFormState>,
  ) => void;
  onCreateReviewErrorTypeSubmit: () => void;
  onSubmitReview: () => void;
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

export default function WorkflowModal({
  mode,
  labelName,
  fileLabel,
  reviewChecklistQuestions,
  loadingReviewChecklistQuestions,
  reviewChecklistQuestionsError,
  reviewAnswersByQuestionId,
  reviewChecklistNotes,
  reviewRequiredCount,
  reviewRequiredAnsweredCount,
  hasMissingRequiredChecklist,
  reviewDecision,
  reviewFeedback,
  reviewErrorTypes,
  loadingReviewErrorTypes,
  reviewErrorTypesError,
  reviewErrorTypeSearch,
  filteredReviewErrorTypes,
  selectedReviewErrors,
  selectedReviewErrorTypeIds,
  createReviewErrorTypeForm,
  creatingReviewErrorType,
  createReviewErrorTypeError,
  checklistHistory,
  submittingReview,
  submitReviewError,
  onClose,
  onToggleChecklistQuestion,
  onReviewQuestionNoteChange,
  onReviewChecklistNotesChange,
  onReviewFeedbackChange,
  onReviewDecisionChange,
  onToggleReviewErrorType,
  onSelectedReviewErrorDescriptionChange,
  onReviewErrorTypeSearchChange,
  onCreateReviewErrorTypeFormChange,
  onCreateReviewErrorTypeSubmit,
  onSubmitReview,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
      <div className="w-full max-w-3xl rounded-lg border border-gray-300 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">
            {mode === "review"
              ? `Submit Review - ${labelName}`
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
          {mode === "review" ? (
            <div className="mb-3 space-y-3 rounded-md border border-gray-200 bg-white px-3 py-3">
              <p className="text-sm text-gray-600">
                Complete the reviewer checklist and submit your decision for
                this label.
              </p>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600">
                    Decision
                  </p>
                  <select
                    value={reviewDecision}
                    onChange={(e) =>
                      onReviewDecisionChange(e.target.value as Decision)
                    }
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  >
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-semibold text-gray-600">
                    Checklist summary
                  </p>
                  <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                    Required checked: {reviewRequiredAnsweredCount}/
                    {reviewRequiredCount}
                  </div>
                </div>
              </div>

              {hasMissingRequiredChecklist && reviewRequiredCount > 0 ? (
                <p className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-xs text-amber-700">
                  Required reviewer checklist questions are still incomplete.
                </p>
              ) : null}

              {loadingReviewChecklistQuestions ? (
                <p className="text-xs text-gray-500">
                  Loading reviewer checklist questions...
                </p>
              ) : null}

              {reviewChecklistQuestionsError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                  {reviewChecklistQuestionsError}
                </p>
              ) : null}

              {!loadingReviewChecklistQuestions &&
              !reviewChecklistQuestionsError &&
              reviewChecklistQuestions.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No checklist questions configured for this reviewer label.
                </p>
              ) : null}

              {reviewChecklistQuestions.map((question) => (
                <div
                  key={question.id}
                  className="space-y-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700"
                >
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={Boolean(
                        reviewAnswersByQuestionId[question.id]?.answer,
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
                    value={reviewAnswersByQuestionId[question.id]?.notes ?? ""}
                    onChange={(e) =>
                      onReviewQuestionNoteChange(question.id, e.target.value)
                    }
                    className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                    placeholder="Optional note for this review checklist item"
                  />
                </div>
              ))}

              <div className="space-y-1 rounded-md border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold text-gray-600">
                  Checklist note
                </p>
                <textarea
                  value={reviewChecklistNotes}
                  onChange={(e) => onReviewChecklistNotesChange(e.target.value)}
                  className="min-h-20 w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                  placeholder="Optional note saved inside answerData.notes"
                />
              </div>

              <div className="space-y-1 rounded-md border border-gray-200 bg-white px-3 py-2">
                <p className="text-xs font-semibold text-gray-600">
                  Reviewer feedback
                </p>
                <textarea
                  value={reviewFeedback}
                  onChange={(e) => onReviewFeedbackChange(e.target.value)}
                  className="min-h-20 w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                  placeholder="Feedbacks field for SubmitReviewsDto"
                />
              </div>

              <div className="space-y-2 rounded-md border border-gray-200 bg-white px-3 py-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-gray-600">
                    Review errors
                  </p>
                  <span className="rounded bg-gray-100 px-2 py-[2px] text-[11px] font-semibold text-gray-600">
                    Selected: {selectedReviewErrors.length}
                  </span>
                </div>

                <input
                  value={reviewErrorTypeSearch}
                  onChange={(e) =>
                    onReviewErrorTypeSearchChange(e.target.value)
                  }
                  className="w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                  placeholder="Search review error type by name, description, or severity"
                />

                {loadingReviewErrorTypes ? (
                  <p className="text-xs text-gray-500">
                    Loading review error types...
                  </p>
                ) : null}

                {reviewErrorTypesError ? (
                  <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                    {reviewErrorTypesError}
                  </p>
                ) : null}

                {!loadingReviewErrorTypes &&
                !reviewErrorTypesError &&
                filteredReviewErrorTypes.length === 0 ? (
                  <p className="text-xs text-gray-500">
                    No review error types match your search.
                  </p>
                ) : null}

                {filteredReviewErrorTypes.length > 0 ? (
                  <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border border-gray-200 bg-gray-50 p-2">
                    {filteredReviewErrorTypes.map((item) => {
                      const selected = selectedReviewErrorTypeIds.has(item.id);
                      return (
                        <div
                          key={item.id}
                          className="rounded border border-gray-200 bg-white px-2 py-2"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="text-xs font-semibold text-gray-700">
                                {item.name}
                              </p>
                              <p className="mt-1 text-[11px] text-gray-500">
                                Severity: {item.severity} | Impact:{" "}
                                {item.scoreImpact}
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => onToggleReviewErrorType(item.id)}
                              className={`rounded-md px-2 py-1 text-[11px] font-semibold ${
                                selected
                                  ? "bg-rose-100 text-rose-700"
                                  : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {selected ? "Remove" : "Add"}
                            </button>
                          </div>

                          {item.description ? (
                            <p className="mt-1 text-[11px] text-gray-600">
                              {item.description}
                            </p>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                ) : null}

                {selectedReviewErrors.length > 0 ? (
                  <div className="space-y-2 rounded-md border border-gray-200 bg-gray-50 p-2">
                    {selectedReviewErrors.map((item) => {
                      const matchedType = reviewErrorTypes.find(
                        (type) => type.id === item.reviewErrorTypeId,
                      );
                      return (
                        <div
                          key={item.reviewErrorTypeId}
                          className="rounded border border-gray-200 bg-white px-2 py-2"
                        >
                          <p className="text-xs font-semibold text-gray-700">
                            {matchedType?.name ?? item.reviewErrorTypeId}
                          </p>
                          <input
                            value={item.description ?? ""}
                            onChange={(e) =>
                              onSelectedReviewErrorDescriptionChange(
                                item.reviewErrorTypeId,
                                e.target.value,
                              )
                            }
                            className="mt-2 w-full rounded-md border border-gray-300 px-2 py-1 text-xs"
                            placeholder="Optional description for this review error"
                          />
                        </div>
                      );
                    })}
                  </div>
                ) : null}
              </div>

              {!loadingReviewErrorTypes &&
              !reviewErrorTypesError &&
              reviewErrorTypes.length === 0 ? (
                <div className="space-y-2 rounded-md border border-gray-200 bg-white px-3 py-3">
                  <p className="text-xs font-semibold text-gray-600">
                    Create review error type
                  </p>

                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      value={createReviewErrorTypeForm.name}
                      onChange={(e) =>
                        onCreateReviewErrorTypeFormChange({
                          name: e.target.value,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      placeholder="Name"
                    />

                    <input
                      value={createReviewErrorTypeForm.scoreImpact}
                      onChange={(e) =>
                        onCreateReviewErrorTypeFormChange({
                          scoreImpact: e.target.value,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      placeholder="Score impact"
                    />

                    <select
                      value={createReviewErrorTypeForm.severity}
                      onChange={(e) =>
                        onCreateReviewErrorTypeFormChange({
                          severity: e.target.value as Severity,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                    >
                      {Object.values(Severity).map((severity) => (
                        <option key={severity} value={severity}>
                          {severity}
                        </option>
                      ))}
                    </select>

                    <input
                      value={createReviewErrorTypeForm.description}
                      onChange={(e) =>
                        onCreateReviewErrorTypeFormChange({
                          description: e.target.value,
                        })
                      }
                      className="rounded-md border border-gray-300 px-2 py-1 text-xs"
                      placeholder="Description"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={onCreateReviewErrorTypeSubmit}
                      disabled={creatingReviewErrorType}
                      className="rounded-md border border-blue-300 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                    >
                      {creatingReviewErrorType
                        ? "Creating..."
                        : "Create error type"}
                    </button>
                  </div>

                  {createReviewErrorTypeError ? (
                    <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                      {createReviewErrorTypeError}
                    </p>
                  ) : null}
                </div>
              ) : null}

              {submitReviewError ? (
                <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
                  {submitReviewError}
                </p>
              ) : null}
            </div>
          ) : null}

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
          </div>

          <div className="mt-3 rounded-md border border-gray-200 bg-white px-3 py-3">
            <p className="text-xs font-semibold text-gray-700">
              Checklist submissions
            </p>

            {checklistHistory.length === 0 ? (
              <p className="mt-2 text-xs text-gray-500">
                No checklist snapshots were returned for this file label.
              </p>
            ) : (
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
                                  <span className="ml-1 text-rose-600">*</span>
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

                            {answer.notes ? (
                              <p className="mt-1 text-[11px] text-gray-600">
                                Note: {answer.notes}
                              </p>
                            ) : null}
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {snapshot.roleType === "reviewer" ? (
                      <div className="mt-2">
                        <button
                          type="button"
                          onClick={() => {}}
                          className="rounded-md border border-blue-300 bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-700"
                        >
                          Review details
                        </button>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t px-4 py-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700"
          >
            Close
          </button>

          {mode === "review" ? (
            <button
              type="button"
              onClick={onSubmitReview}
              disabled={
                submittingReview ||
                loadingReviewChecklistQuestions ||
                Boolean(reviewChecklistQuestionsError) ||
                reviewChecklistQuestions.length === 0 ||
                hasMissingRequiredChecklist
              }
              className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-gray-300"
            >
              {submittingReview ? "Submitting..." : "Submit Review"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
