import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  loadImagesFromStore,
  type StoredImageRef,
} from "../../utils/image-store";

type Severity = "Low" | "Medium" | "High";

type UploadedImage = {
  name: string;
  dataUrl: string;
};

type SubmittedChecklistItem = {
  item: string;
  checked: boolean;
};

type ReviewedChecklistItem = {
  item: string;
  passed: boolean;
  note?: string;
};

type ReviewErrorItem = {
  reviewErrorTypeName: string;
  type: string;
  severity: Severity;
  location: string;
  description: string;
};

type SubmittedVersion = {
  id: string;
  title: string;
  answerBy: string;
  submittedAt: string;
  checklist: SubmittedChecklistItem[];
};

type ReviewVersion = {
  id: string;
  title: string;
  reviewer: string;
  reviewedAt: string;
  decision: "Approved" | "Returned" | "Rejected";
  feedbacks: string;
  checklist: ReviewedChecklistItem[];
  reviewErrors: ReviewErrorItem[];
};

type LabelRound = {
  id: string;
  title: string;
  submittedVersion: SubmittedVersion | null;
  reviewVersion: ReviewVersion | null;
};

type ReviewErrorWithRound = ReviewErrorItem & {
  roundId: string;
  roundTitle: string;
};

type ReviewTask = {
  id: string;
  projectName: string;
  dataset: string;
  status?: "In Progress" | "Pending Review" | "Returned" | "Completed";
  itemName?: string;
  preset: string;
  aiPrelabel: "Ready" | "Running" | "Off";
  instructions: string[];
  checklist: string[];
  labels?: string[];
  submittedLabels?: string[];
  uploadedImages?: UploadedImage[];
  submittedImages?: UploadedImage[];
  uploadedImageRefs?: StoredImageRef[];
  submittedImageRefs?: StoredImageRef[];
};

const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";

const REVIEW_ERROR_TYPE_OPTIONS = [
  "Wrong label",
  "Missing label",
  "Boundary issue",
  "Guideline mismatch",
] as const;

const REVIEW_ERROR_SEVERITY: Record<
  (typeof REVIEW_ERROR_TYPE_OPTIONS)[number],
  Severity
> = {
  "Wrong label": "Medium",
  "Missing label": "High",
  "Boundary issue": "Low",
  "Guideline mismatch": "Medium",
};

const readReviewerTask = (taskId?: string): ReviewTask | null => {
  if (!taskId || typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(ANNOTATOR_TASKS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const tasks = JSON.parse(raw) as Array<Record<string, unknown>>;
    const matched = tasks.find((task) => String(task.id) === String(taskId));
    if (!matched) {
      return null;
    }

    const uploadedImages = Array.isArray(matched.uploadedImages)
      ? (matched.uploadedImages as UploadedImage[]).filter(
          (item) =>
            typeof item?.name === "string" && typeof item?.dataUrl === "string",
        )
      : [];

    const submittedImages = Array.isArray(matched.submittedImages)
      ? (matched.submittedImages as UploadedImage[]).filter(
          (item) =>
            typeof item?.name === "string" && typeof item?.dataUrl === "string",
        )
      : [];

    const uploadedImageRefs = Array.isArray(matched.uploadedImageRefs)
      ? (matched.uploadedImageRefs as StoredImageRef[]).filter(
          (item) =>
            typeof item?.id === "string" && typeof item?.name === "string",
        )
      : [];

    const submittedImageRefs = Array.isArray(matched.submittedImageRefs)
      ? (matched.submittedImageRefs as StoredImageRef[]).filter(
          (item) =>
            typeof item?.id === "string" && typeof item?.name === "string",
        )
      : [];

    const labels = Array.isArray(matched.labels)
      ? (matched.labels as string[]).filter((item) => typeof item === "string")
      : [];

    const submittedLabels = Array.isArray(matched.submittedLabels)
      ? (matched.submittedLabels as string[]).filter(
          (item) => typeof item === "string",
        )
      : [];

    const checklist = Array.isArray(matched.checklist)
      ? (matched.checklist as string[]).filter(
          (item) => typeof item === "string",
        )
      : ["Checklist completed"];

    const instructions = Array.isArray(matched.instructions)
      ? (matched.instructions as string[]).filter(
          (item) => typeof item === "string",
        )
      : ["Follow project review guideline."];

    return {
      id: String(matched.id ?? taskId),
      projectName: String(matched.projectName ?? "Assigned Project"),
      dataset: String(matched.dataset ?? "Unknown dataset"),
      status:
        matched.status === "In Progress" ||
        matched.status === "Pending Review" ||
        matched.status === "Returned" ||
        matched.status === "Completed"
          ? (matched.status as ReviewTask["status"])
          : "Pending Review",
      itemName: String(
        matched.itemName ?? uploadedImages[0]?.name ?? "item_001.png",
      ),
      preset: String(matched.preset ?? "Default preset"),
      aiPrelabel:
        matched.aiPrelabel === "Ready" ||
        matched.aiPrelabel === "Running" ||
        matched.aiPrelabel === "Off"
          ? (matched.aiPrelabel as ReviewTask["aiPrelabel"])
          : "Off",
      instructions,
      checklist,
      labels,
      submittedLabels,
      uploadedImages,
      submittedImages,
      uploadedImageRefs,
      submittedImageRefs,
    };
  } catch {
    return null;
  }
};

const fallbackTask: ReviewTask = {
  id: "task-review-fallback",
  projectName: "Reviewer Workspace",
  dataset: "No dataset",
  status: "Pending Review",
  itemName: "item_001.png",
  preset: "Default",
  aiPrelabel: "Off",
  instructions: ["Select a task from review queue."],
  checklist: ["Checklist completed"],
  labels: ["Label A", "Label B"],
  submittedLabels: ["Label A", "Label B"],
};

const buildChecklistForLabel = (
  label: string,
  checklist: string[],
): string[] => {
  const normalizedChecklist =
    checklist.length > 0 ? checklist : ["Checklist completed"];
  return normalizedChecklist.map((item) => `${item} (${label})`);
};

const buildLabelRounds = (label: string, checklist: string[]): LabelRound[] => {
  const labelChecklist = buildChecklistForLabel(label, checklist);

  const submittedRound1: SubmittedVersion = {
    id: "submitted-r1",
    title: "Submitted v1",
    answerBy: "Annotator",
    submittedAt: "2026-03-06 09:10",
    checklist: labelChecklist.map((item, index) => ({
      item,
      checked: index !== labelChecklist.length - 1,
    })),
  };

  const reviewedRound1: ReviewVersion = {
    id: "review-r1",
    title: "Review v1",
    reviewer: "Reviewer",
    reviewedAt: "2026-03-06 10:02",
    decision: "Returned",
    feedbacks: `Review notes for ${label}.`,
    checklist: labelChecklist.map((item, index) => ({
      item,
      passed: index % 2 === 0,
      note: index % 2 === 0 ? "Accepted" : "Need fix",
    })),
    reviewErrors: [
      {
        reviewErrorTypeName: "Wrong label",
        type: "Classification",
        severity: "Medium",
        location: label,
        description: `Reviewer found class mismatch for ${label}.`,
      },
    ],
  };

  const submittedRound2: SubmittedVersion = {
    id: "submitted-r2",
    title: "Submitted v2",
    answerBy: "Annotator",
    submittedAt: "2026-03-06 14:30",
    checklist: labelChecklist.map((item) => ({
      item,
      checked: true,
    })),
  };

  const reviewedRound2: ReviewVersion = {
    id: "review-r2",
    title: "Review v2",
    reviewer: "Reviewer",
    reviewedAt: "2026-03-06 15:00",
    decision: "Approved",
    feedbacks: `${label} passed after corrections.`,
    checklist: labelChecklist.map((item) => ({
      item,
      passed: true,
      note: "Accepted",
    })),
    reviewErrors: [],
  };

  return [
    {
      id: "round-1",
      title: "Round 1",
      submittedVersion: submittedRound1,
      reviewVersion: reviewedRound1,
    },
    {
      id: "round-2",
      title: "Round 2",
      submittedVersion: submittedRound2,
      reviewVersion: reviewedRound2,
    },
    {
      id: "round-3",
      title: "Round 3",
      submittedVersion: null,
      reviewVersion: null,
    },
  ];
};

export default function ReviewerWorkspacePage() {
  const { id } = useParams();
  const storageTask = useMemo(() => readReviewerTask(id), [id]);
  const task = useMemo(() => storageTask ?? fallbackTask, [storageTask]);

  const initialLabels = useMemo(() => {
    if (task.submittedLabels && task.submittedLabels.length > 0) {
      return task.submittedLabels;
    }
    if (task.labels && task.labels.length > 0) {
      return task.labels;
    }
    return ["Label A"];
  }, [task.labels, task.submittedLabels]);

  const [labelSearch, setLabelSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    initialLabels[0] ?? null,
  );
  const [activeRoundId, setActiveRoundId] = useState("round-1");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedReviewErrorType, setSelectedReviewErrorType] = useState<
    (typeof REVIEW_ERROR_TYPE_OPTIONS)[number]
  >(REVIEW_ERROR_TYPE_OPTIONS[0]);
  const [reviewFeedbackByKey, setReviewFeedbackByKey] = useState<
    Record<string, string>
  >({});
  const [addedReviewErrorsByKey, setAddedReviewErrorsByKey] = useState<
    Record<string, ReviewErrorItem[]>
  >({});
  const [showReviewErrors, setShowReviewErrors] = useState(false);
  const [reviewImages, setReviewImages] = useState<UploadedImage[]>(
    task.submittedImages ?? task.uploadedImages ?? [],
  );

  const filteredLabels = useMemo(() => {
    const keyword = labelSearch.trim().toLowerCase();
    if (!keyword) {
      return initialLabels;
    }
    return initialLabels.filter((label) =>
      label.toLowerCase().includes(keyword),
    );
  }, [initialLabels, labelSearch]);

  const labelRounds = useMemo(() => {
    const entries = initialLabels.map((label) => [
      label,
      buildLabelRounds(label, task.checklist),
    ]);
    return Object.fromEntries(entries) as Record<string, LabelRound[]>;
  }, [initialLabels, task.checklist]);

  const selectedLabelRounds =
    selectedLabel && labelRounds[selectedLabel]
      ? labelRounds[selectedLabel]
      : [];

  const activeRound =
    selectedLabelRounds.find((round) => round.id === activeRoundId) ??
    selectedLabelRounds[0] ??
    null;

  const activeSubmittedVersion = activeRound?.submittedVersion ?? null;
  const activeReviewVersion = activeRound?.reviewVersion ?? null;
  const roundKey = `${selectedLabel ?? "none"}::${activeRound?.id ?? "none"}`;
  const isRoundEditable = activeRound?.id === "round-2";
  const activeRoundIndex = activeRound
    ? selectedLabelRounds.findIndex((round) => round.id === activeRound.id)
    : -1;

  const recordedReviewErrors = useMemo<ReviewErrorWithRound[]>(() => {
    if (!selectedLabel || activeRoundIndex < 0) {
      return [];
    }

    const next: ReviewErrorWithRound[] = [];

    selectedLabelRounds.slice(0, activeRoundIndex + 1).forEach((round) => {
      const baseErrors = round.reviewVersion?.reviewErrors ?? [];
      const customErrors =
        addedReviewErrorsByKey[`${selectedLabel}::${round.id}`] ?? [];

      [...baseErrors, ...customErrors].forEach((error) => {
        next.push({
          ...error,
          roundId: round.id,
          roundTitle: round.title,
        });
      });
    });

    return next;
  }, [
    activeRoundIndex,
    addedReviewErrorsByKey,
    selectedLabel,
    selectedLabelRounds,
  ]);

  const reviewerFeedback =
    reviewFeedbackByKey[roundKey] ?? activeReviewVersion?.feedbacks ?? "";

  useEffect(() => {
    setLabelSearch("");
    setSelectedLabel(initialLabels[0] ?? null);
    setActiveRoundId("round-1");
    setActiveImageIndex(0);
    setReviewFeedbackByKey({});
    setAddedReviewErrorsByKey({});
    setShowReviewErrors(false);
    setReviewImages(task.submittedImages ?? task.uploadedImages ?? []);
  }, [initialLabels, task.submittedImages, task.uploadedImages]);

  useEffect(() => {
    if (!selectedLabel || !initialLabels.includes(selectedLabel)) {
      setSelectedLabel(initialLabels[0] ?? null);
      setActiveRoundId("round-1");
      setShowReviewErrors(false);
    }
  }, [initialLabels, selectedLabel]);

  useEffect(() => {
    let canceled = false;

    const resolveImages = async () => {
      try {
        if (task.submittedImageRefs && task.submittedImageRefs.length > 0) {
          const loaded = await loadImagesFromStore(task.submittedImageRefs);
          if (!canceled && loaded.length > 0) {
            setReviewImages(loaded);
            return;
          }
        }

        if (task.uploadedImageRefs && task.uploadedImageRefs.length > 0) {
          const loaded = await loadImagesFromStore(task.uploadedImageRefs);
          if (!canceled && loaded.length > 0) {
            setReviewImages(loaded);
          }
        }
      } catch {
        // Keep lightweight payload images.
      }
    };

    void resolveImages();

    return () => {
      canceled = true;
    };
  }, [task.submittedImageRefs, task.uploadedImageRefs]);

  const handleAddReviewError = () => {
    if (!selectedLabel || !activeRound || !isRoundEditable) {
      return;
    }

    const nextError: ReviewErrorItem = {
      reviewErrorTypeName: selectedReviewErrorType,
      type: "Reviewer note",
      severity: REVIEW_ERROR_SEVERITY[selectedReviewErrorType],
      location: `${selectedLabel} / ${activeRound.title}`,
      description: `Added by reviewer for ${selectedLabel} in ${activeRound.title}.`,
    };

    setAddedReviewErrorsByKey((prev) => ({
      ...prev,
      [roundKey]: [...(prev[roundKey] ?? []), nextError],
    }));
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Reviewer Workspace: {task.projectName}
          </h2>
          <p className="text-sm text-gray-500">
            {task.dataset} • Item {task.itemName ?? "item_001.png"}
          </p>
        </div>
        <Link
          to="/reviewer"
          className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
        >
          Back to queue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr_1fr]">
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Task details</p>
            <div className="mt-2 space-y-2 text-sm text-gray-700">
              <div className="flex items-center justify-between">
                <span>Preset</span>
                <span className="font-semibold text-gray-800">
                  {task.preset}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>AI pre-label</span>
                <span
                  className={`rounded-md px-2 py-1 text-xs font-semibold ${
                    task.aiPrelabel === "Ready"
                      ? "bg-emerald-100 text-emerald-700"
                      : task.aiPrelabel === "Running"
                        ? "bg-amber-100 text-amber-700"
                        : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {task.aiPrelabel}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Instructions</p>
            <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-gray-700">
              {task.instructions.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              Submitted labels
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {initialLabels.map((label) => (
                <span
                  key={label}
                  className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-700">
              Submission Preview
            </p>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
              Read-only
            </span>
          </div>
          {reviewImages.length > 0 ? (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="h-[360px] overflow-hidden rounded-md border border-gray-200 bg-white">
                <div className="flex h-full items-center justify-center p-3">
                  <img
                    src={reviewImages[activeImageIndex].dataUrl}
                    alt={reviewImages[activeImageIndex].name}
                    draggable={false}
                    className="h-auto max-h-full w-auto max-w-full object-contain"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {reviewImages.map((image, index) => (
                  <button
                    key={image.name + index}
                    type="button"
                    onClick={() => setActiveImageIndex(index)}
                    className={`rounded-md border px-2 py-1 text-xs ${
                      index === activeImageIndex
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-600"
                    }`}
                  >
                    {image.name}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="mt-4 flex h-[360px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
              No submitted preview available.
            </div>
          )}
        </div>

        <div className="space-y-4 lg:max-h-[calc(100vh-150px)] lg:overflow-y-auto lg:pr-1">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Search label</p>
            <input
              value={labelSearch}
              onChange={(event) => setLabelSearch(event.target.value)}
              className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Search labels..."
            />
            <div className="mt-3 flex flex-wrap gap-2">
              {filteredLabels.length > 0 ? (
                filteredLabels.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => {
                      const nextRounds = labelRounds[label] ?? [];
                      const keepCurrentRound = nextRounds.some(
                        (round) => round.id === activeRoundId,
                      );
                      setSelectedLabel(label);
                      if (!keepCurrentRound) {
                        setActiveRoundId(nextRounds[0]?.id ?? "round-1");
                      }
                    }}
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
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Rounds</p>
            {selectedLabel && selectedLabelRounds.length > 0 ? (
              <div className="mt-3 space-y-3">
                <div className="flex gap-2">
                  {selectedLabelRounds.map((round) => (
                    <button
                      key={round.id}
                      type="button"
                      onClick={() => {
                        setActiveRoundId(round.id);
                        setShowReviewErrors(false);
                      }}
                      className={`rounded-md border px-3 py-1 text-xs font-semibold ${
                        activeRound?.id === round.id
                          ? "border-blue-500 bg-blue-50 text-blue-700"
                          : "border-gray-200 text-gray-600"
                      }`}
                    >
                      {round.title}
                    </button>
                  ))}
                </div>

                {activeRound && (
                  <div className="space-y-3">
                    <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-3">
                      <p className="text-xs font-semibold text-gray-700">
                        Submitted version checklist
                      </p>
                      {activeSubmittedVersion ? (
                        <>
                          <p className="mt-2 text-[11px] text-gray-500">
                            {activeSubmittedVersion.answerBy} •{" "}
                            {activeSubmittedVersion.submittedAt}
                          </p>
                          <div className="mt-2 space-y-2 text-sm text-gray-700">
                            {activeSubmittedVersion.checklist.map((item) => (
                              <label
                                key={item.item}
                                className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.checked}
                                  readOnly
                                />
                                <span>{item.item}</span>
                              </label>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          No submitted version in this round.
                        </p>
                      )}
                    </div>

                    <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Review checklist
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowReviewErrors(true)}
                          className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={recordedReviewErrors.length === 0}
                        >
                          Open review errors
                        </button>
                      </div>
                      {activeReviewVersion ? (
                        <>
                          <div className="mt-2 flex items-center justify-between gap-2 text-[11px] text-gray-500">
                            <p>
                              {activeReviewVersion.reviewer} •{" "}
                              {activeReviewVersion.reviewedAt}
                            </p>
                            <span
                              className={`rounded px-2 py-[2px] font-semibold ${
                                activeReviewVersion.decision === "Approved"
                                  ? "bg-emerald-100 text-emerald-700"
                                  : activeReviewVersion.decision === "Returned"
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                              }`}
                            >
                              {activeReviewVersion.decision}
                            </span>
                          </div>
                          <div className="mt-2 space-y-2 text-sm text-gray-700">
                            {activeReviewVersion.checklist.map((item) => (
                              <label
                                key={item.item}
                                className="flex items-center gap-2 rounded-md border border-gray-100 bg-gray-50 px-3 py-2"
                              >
                                <input
                                  type="checkbox"
                                  checked={item.passed}
                                  readOnly
                                />
                                <span className="flex-1">{item.item}</span>
                                <span
                                  className={`rounded px-2 py-[2px] text-[11px] font-semibold ${
                                    item.passed
                                      ? "bg-emerald-100 text-emerald-700"
                                      : "bg-amber-100 text-amber-700"
                                  }`}
                                >
                                  {item.passed ? "Passed" : "Rework"}
                                </span>
                              </label>
                            ))}
                          </div>
                        </>
                      ) : (
                        <p className="mt-2 text-sm text-gray-500">
                          No review version in this round.
                        </p>
                      )}

                      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Recorded review errors
                        </p>
                        {recordedReviewErrors.length === 0 ? (
                          <p className="mt-1 text-xs text-gray-500">
                            No recorded review errors up to this round.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {recordedReviewErrors.map((error, index) => (
                              <div
                                key={`${error.roundId}-${error.reviewErrorTypeName}-${index}`}
                                className="rounded border border-gray-200 bg-white px-2 py-2"
                              >
                                <div className="flex items-center justify-between gap-2">
                                  <p className="text-xs font-semibold text-gray-700">
                                    {error.reviewErrorTypeName}
                                  </p>
                                  <span
                                    className={`rounded px-2 py-[2px] text-[11px] font-semibold ${
                                      error.severity === "High"
                                        ? "bg-red-100 text-red-700"
                                        : error.severity === "Medium"
                                          ? "bg-amber-100 text-amber-700"
                                          : "bg-blue-100 text-blue-700"
                                    }`}
                                  >
                                    {error.severity}
                                  </span>
                                </div>
                                <p className="mt-1 text-[11px] text-gray-500">
                                  {error.roundTitle} • {error.location}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="mt-3 text-sm text-gray-500">
                Select a label to view rounds and review history.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">
              Reviewer feedback
            </p>
            {!isRoundEditable && (
              <p className="mt-2 text-xs text-amber-700">
                {activeRound?.id === "round-1"
                  ? "This round cycle has been completed."
                  : "No submission to review yet."}{" "}
              </p>
            )}
            <textarea
              value={reviewerFeedback}
              onChange={(event) =>
                setReviewFeedbackByKey((prev) => ({
                  ...prev,
                  [roundKey]: event.target.value,
                }))
              }
              disabled={!isRoundEditable}
              className="mt-2 min-h-[90px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Write feedback for annotator..."
            />

            <div className="mt-3 grid grid-cols-1 gap-2">
              <select
                value={selectedReviewErrorType}
                onChange={(event) =>
                  setSelectedReviewErrorType(
                    event.target
                      .value as (typeof REVIEW_ERROR_TYPE_OPTIONS)[number],
                  )
                }
                disabled={!isRoundEditable}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                {REVIEW_ERROR_TYPE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={handleAddReviewError}
                disabled={!isRoundEditable}
                className="rounded-md bg-rose-600 px-3 py-2 text-xs font-semibold text-white hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Add review error
              </button>
            </div>

            <div className="mt-3 space-y-2">
              {recordedReviewErrors.length === 0 ? (
                <p className="text-xs text-gray-500">
                  No review errors for this round.
                </p>
              ) : (
                recordedReviewErrors.map((error, index) => (
                  <div
                    key={`${error.roundId}-${error.reviewErrorTypeName}-${index}`}
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-gray-700">
                        {error.reviewErrorTypeName}
                      </p>
                      <span
                        className={`rounded px-2 py-[2px] text-[11px] font-semibold ${
                          error.severity === "High"
                            ? "bg-red-100 text-red-700"
                            : error.severity === "Medium"
                              ? "bg-amber-100 text-amber-700"
                              : "bg-blue-100 text-blue-700"
                        }`}
                      >
                        {error.severity}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      {error.roundTitle} • {error.location}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {showReviewErrors && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Review errors • {selectedLabel} • {activeRound?.title}
              </h3>
              <button
                type="button"
                onClick={() => setShowReviewErrors(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                x
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto p-4">
              {recordedReviewErrors.length > 0 ? (
                <div className="space-y-3">
                  {recordedReviewErrors.map((error, index) => (
                    <div
                      key={`${error.roundId}-${error.reviewErrorTypeName}-${index}`}
                      className="rounded-md border border-gray-200 bg-gray-50 p-3"
                    >
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-semibold text-gray-800">
                          {error.reviewErrorTypeName}
                        </p>
                        <span
                          className={`rounded px-2 py-[2px] text-[11px] font-semibold ${
                            error.severity === "High"
                              ? "bg-red-100 text-red-700"
                              : error.severity === "Medium"
                                ? "bg-amber-100 text-amber-700"
                                : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {error.severity}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        Type: {error.type}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Round: {error.roundTitle}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        Location: {error.location}
                      </p>
                      <p className="mt-2 text-sm text-gray-700">
                        {error.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No review errors found.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
