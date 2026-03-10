import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  loadImagesFromStore,
  type StoredImageRef,
} from "../../utils/image-store";

const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";

type UploadedImage = {
  name: string;
  dataUrl: string;
};

type ReviewedChecklistItem = {
  item: string;
  passed: boolean;
  note?: string;
};

type SubmittedChecklistItem = {
  item: string;
  checked: boolean;
};

type ReviewErrorItem = {
  reviewErrorTypeName: string;
  type: string;
  severity: "Low" | "Medium" | "High";
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

type WorkspaceTask = {
  id: string;
  projectName: string;
  dataset: string;
  itemName: string;
  preset: string;
  aiPrelabel: "Ready" | "Running" | "Off";
  instructions: string[];
  checklist: string[];
  labels: string[];
  status?: "In Progress" | "Pending Review" | "Returned" | "Completed";
  uploadedImages?: UploadedImage[];
  uploadedImageRefs?: StoredImageRef[];
};

const readAssignedWorkspaceTask = (taskId?: string): WorkspaceTask | null => {
  if (!taskId || typeof window === "undefined") {
    return null;
  }

  const raw = localStorage.getItem(ANNOTATOR_TASKS_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const tasks = JSON.parse(raw) as Array<Record<string, unknown>>;
    const matched = tasks.find((task) => task.id === taskId);
    if (!matched) {
      return null;
    }

    const uploadedImages = Array.isArray(matched.uploadedImages)
      ? (matched.uploadedImages as UploadedImage[]).filter(
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

    const labels = Array.isArray(matched.labels)
      ? (matched.labels as string[]).filter((item) => typeof item === "string")
      : ["Label A", "Label B"];

    const instructions = Array.isArray(matched.instructions)
      ? (matched.instructions as string[]).filter(
          (item) => typeof item === "string",
        )
      : ["Follow manager instructions before labeling."];

    const checklist = Array.isArray(matched.checklist)
      ? (matched.checklist as string[]).filter(
          (item) => typeof item === "string",
        )
      : ["Checklist completed"];

    return {
      id: String(matched.id ?? taskId),
      projectName: String(matched.projectName ?? "Assigned Project"),
      dataset: String(matched.dataset ?? "Manager uploaded dataset"),
      status:
        matched.status === "In Progress" ||
        matched.status === "Pending Review" ||
        matched.status === "Returned" ||
        matched.status === "Completed"
          ? (matched.status as WorkspaceTask["status"])
          : "In Progress",
      itemName: uploadedImages[0]?.name || "item_001.png",
      preset: String(matched.preset ?? "Custom preset"),
      aiPrelabel:
        matched.aiPrelabel === "Ready" ||
        matched.aiPrelabel === "Running" ||
        matched.aiPrelabel === "Off"
          ? (matched.aiPrelabel as WorkspaceTask["aiPrelabel"])
          : "Off",
      instructions,
      checklist,
      labels,
      uploadedImages,
      uploadedImageRefs,
    };
  } catch {
    return null;
  }
};

const taskMap: Record<string, WorkspaceTask> = {
  "task-100": {
    id: "task-100",
    projectName: "Retail Shelf Audit",
    dataset: "Shelf-Images-Set-3",
    status: "In Progress",
    itemName: "shelf_043.png",
    preset: "Retail SKU V2",
    aiPrelabel: "Ready",
    instructions: [
      "Draw bounding boxes around every SKU facing.",
      "Include partially occluded items if the brand is readable.",
      "Use label `Other` for unreadable brands.",
    ],
    checklist: [
      "All visible SKUs are labeled",
      "No overlapping boxes for same SKU",
      "Brand label is assigned",
    ],
    labels: ["Cereal", "Snack", "Soda", "Other"],
  },
  "task-101": {
    id: "task-101",
    projectName: "Street Scene Vehicles",
    dataset: "Urban-Cam-12",
    status: "Pending Review",
    itemName: "frame_0192.jpg",
    preset: "Vehicle Boxes",
    aiPrelabel: "Ready",
    instructions: [
      "Label cars, buses, bikes, and trucks.",
      "Tight box around vehicle body.",
    ],
    checklist: ["All vehicles labeled", "Boxes are tight"],
    labels: ["Car", "Bus", "Bike", "Truck"],
  },
  "task-102": {
    id: "task-102",
    projectName: "Medical Scan Classification",
    dataset: "CT-Slice-22",
    status: "Returned",
    itemName: "slice_018.png",
    preset: "CT Findings",
    aiPrelabel: "Off",
    instructions: [
      "Assign one primary finding per slice.",
      "Use `Uncertain` when ambiguous.",
    ],
    checklist: ["Single class per slice", "No missing slices"],
    labels: ["Hemorrhage", "Mass", "Edema", "Uncertain"],
  },
};

const fallbackTask: WorkspaceTask = {
  id: "task-new",
  projectName: "New Assignment",
  dataset: "Unassigned",
  status: "In Progress",
  itemName: "item_001.png",
  preset: "Default",
  aiPrelabel: "Running",
  instructions: ["Follow project guidelines before labeling."],
  checklist: ["Labels reviewed", "Checklist completed"],
  labels: ["Label A", "Label B"],
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

  const submittedV1: SubmittedVersion = {
    id: "submitted-v1",
    title: "Submitted v1",
    answerBy: "Annotator",
    submittedAt: "2026-03-05 09:12",
    checklist: labelChecklist.map((item, index) => ({
      item,
      checked: index !== labelChecklist.length - 1,
    })),
  };

  const submittedV2: SubmittedVersion = {
    id: "submitted-v2",
    title: "Submitted v2",
    answerBy: "Annotator",
    submittedAt: "2026-03-05 16:48",
    checklist: labelChecklist.map((item) => ({
      item,
      checked: true,
    })),
  };

  const reviewV1: ReviewVersion = {
    id: "review-v1",
    title: "Review v1",
    reviewer: "Reviewer",
    reviewedAt: "2026-03-05 11:02",
    decision: "Returned",
    feedbacks: `Please re-check ${label} consistency before final approval.`,
    checklist: labelChecklist.map((item, index) => ({
      item,
      passed: index % 2 === 0,
      note: index % 2 === 0 ? "Accepted" : "Need correction",
    })),
    reviewErrors: [
      {
        reviewErrorTypeName: "Label mismatch",
        type: "Classification",
        severity: "Medium",
        location: `Label ${label}`,
        description: `Submitted class differs from reviewer expectation for ${label}.`,
      },
      {
        reviewErrorTypeName: "Missing evidence",
        type: "Checklist",
        severity: "Low",
        location: "Checklist item 2",
        description: "Supporting rationale is incomplete for one checked item.",
      },
    ],
  };

  const reviewV2: ReviewVersion = {
    id: "review-v2",
    title: "Review v2",
    reviewer: "Reviewer",
    reviewedAt: "2026-03-05 18:10",
    decision: "Approved",
    feedbacks: `Updated submission for ${label} is acceptable.`,
    checklist: labelChecklist.map((item) => ({
      item,
      passed: true,
      note: "Accepted",
    })),
    reviewErrors: [
      {
        reviewErrorTypeName: "Boundary issue",
        type: "Localization",
        severity: "Low",
        location: `Label ${label}`,
        description: `Small boundary adjustment was suggested and then resolved for ${label}.`,
      },
    ],
  };

  return [
    {
      id: "round-1",
      title: "Round 1",
      submittedVersion: submittedV1,
      reviewVersion: reviewV1,
    },
    {
      id: "round-2",
      title: "Round 2",
      submittedVersion: {
        ...submittedV2,
        id: "submitted-v3",
        title: "Submitted v3",
        submittedAt: "2026-03-06 08:15",
      },
      reviewVersion: {
        ...reviewV2,
        id: "review-v3",
        title: "Review v3",
        reviewedAt: "2026-03-06 10:01",
        decision: "Approved",
        feedbacks: `Final review completed for ${label}.`,
      },
    },
    {
      id: "round-3",
      title: "Round 3",
      submittedVersion: null,
      reviewVersion: null,
    },
  ];
};

export default function AnnotatorWorkspacePage() {
  const { id } = useParams();
  const storageTask = useMemo(() => readAssignedWorkspaceTask(id), [id]);
  const task = useMemo(
    () => storageTask ?? taskMap[id ?? ""] ?? fallbackTask,
    [id, storageTask],
  );
  const [customLabels, setCustomLabels] = useState<string[]>(task.labels);
  const [aiApplied, setAiApplied] = useState(task.aiPrelabel === "Ready");
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [labelSearch, setLabelSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(
    task.labels[0] ?? null,
  );
  const [activeRoundId, setActiveRoundId] = useState("round-1");
  const [showReviewErrors, setShowReviewErrors] = useState(false);
  const [round3SubmittedByLabel, setRound3SubmittedByLabel] = useState<
    Record<string, SubmittedVersion>
  >({});
  const [round3DraftChecklistByLabel, setRound3DraftChecklistByLabel] =
    useState<Record<string, SubmittedChecklistItem[]>>({});
  const [resolvedUploadedImages, setResolvedUploadedImages] = useState<
    UploadedImage[]
  >(task.uploadedImages ?? []);
  const [isSubmitted, setIsSubmitted] = useState(
    task.status === "Pending Review" || task.status === "Completed",
  );

  const filteredLabels = useMemo(() => {
    const keyword = labelSearch.trim().toLowerCase();
    if (!keyword) {
      return customLabels;
    }

    return customLabels.filter((label) =>
      label.toLowerCase().includes(keyword),
    );
  }, [customLabels, labelSearch]);

  const labelRounds = useMemo(() => {
    const entries = customLabels.map((label) => [
      label,
      buildLabelRounds(label, task.checklist),
    ]);
    return Object.fromEntries(entries) as Record<string, LabelRound[]>;
  }, [customLabels, task.checklist]);

  const selectedLabelRounds =
    selectedLabel && labelRounds[selectedLabel]
      ? labelRounds[selectedLabel]
      : [];

  const activeRound =
    selectedLabelRounds.find((round) => round.id === activeRoundId) ??
    selectedLabelRounds[0] ??
    null;

  const activeSubmittedVersion =
    activeRound?.id === "round-3" && selectedLabel
      ? (round3SubmittedByLabel[selectedLabel] ?? null)
      : (activeRound?.submittedVersion ?? null);

  const round3DraftChecklist = selectedLabel
    ? (round3DraftChecklistByLabel[selectedLabel] ?? [])
    : [];

  const activeReviewVersion = activeRound?.reviewVersion ?? null;

  useEffect(() => {
    setCustomLabels(task.labels);
    setAiApplied(task.aiPrelabel === "Ready");
    setActiveImageIndex(0);
    setLabelSearch("");
    setSelectedLabel(task.labels[0] ?? null);
    setActiveRoundId("round-1");
    setShowReviewErrors(false);
    setRound3SubmittedByLabel({});
    setRound3DraftChecklistByLabel({});
    setResolvedUploadedImages(task.uploadedImages ?? []);
    setIsSubmitted(
      task.status === "Pending Review" || task.status === "Completed",
    );
  }, [task]);

  useEffect(() => {
    if (!selectedLabel || !customLabels.includes(selectedLabel)) {
      setSelectedLabel(customLabels[0] ?? null);
      setActiveRoundId("round-1");
      setShowReviewErrors(false);
    }
  }, [customLabels, selectedLabel]);

  useEffect(() => {
    let canceled = false;

    const resolveImages = async () => {
      if (!task.uploadedImageRefs || task.uploadedImageRefs.length === 0) {
        return;
      }

      try {
        const loaded = await loadImagesFromStore(task.uploadedImageRefs);
        if (!canceled && loaded.length > 0) {
          setResolvedUploadedImages(loaded);
        }
      } catch {
        // Keep lightweight images from task payload.
      }
    };

    void resolveImages();

    return () => {
      canceled = true;
    };
  }, [task]);

  useEffect(() => {
    if (activeRound?.id !== "round-3" || !selectedLabel) {
      return;
    }
    setRound3DraftChecklistByLabel((prev) => {
      if (prev[selectedLabel]) {
        return prev;
      }

      const nextChecklist = buildChecklistForLabel(
        selectedLabel,
        task.checklist,
      ).map((item) => ({ item, checked: false }));

      return { ...prev, [selectedLabel]: nextChecklist };
    });
  }, [activeRound?.id, selectedLabel, task.checklist]);

  const handleToggleRound3DraftChecklist = (index: number) => {
    if (!selectedLabel) {
      return;
    }

    setRound3DraftChecklistByLabel((prev) => {
      const current = prev[selectedLabel];
      if (!current) {
        return prev;
      }

      const next = current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, checked: !item.checked } : item,
      );

      return { ...prev, [selectedLabel]: next };
    });
  };

  const handleRound3Submit = () => {
    if (!selectedLabel) {
      return;
    }

    const draft = round3DraftChecklistByLabel[selectedLabel] ?? [];
    if (draft.length === 0) {
      return;
    }

    const submittedAt = new Date().toISOString().slice(0, 16).replace("T", " ");

    setRound3SubmittedByLabel((prev) => ({
      ...prev,
      [selectedLabel]: {
        id: `submitted-round3-${selectedLabel}`,
        title: "Submitted v3",
        answerBy: "Annotator",
        submittedAt,
        checklist: draft,
      },
    }));
    setIsSubmitted(true);
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Workspace: {task.projectName}
          </h2>
          <p className="text-sm text-gray-500">
            {task.dataset} • Item {task.itemName}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              isSubmitted
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {isSubmitted ? "Pending Review" : "In Progress"}
          </span>
          <Link
            to="/annotator/tasks"
            className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
          >
            Back to tasks
          </Link>
        </div>
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
              <button
                type="button"
                onClick={() => setAiApplied(true)}
                className="w-full rounded-md bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
              >
                {aiApplied ? "AI labels reviewed" : "Apply AI pre-labels"}
              </button>
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
            <p className="text-xs font-semibold text-gray-500">Label set</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {customLabels.map((label) => (
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
              Canvas Preview
            </p>
            <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
              Read-only
            </span>
          </div>
          {resolvedUploadedImages.length > 0 ? (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="h-[360px] overflow-hidden rounded-md border border-gray-200 bg-white">
                <div className="flex h-full items-center justify-center p-3">
                  <img
                    src={resolvedUploadedImages[activeImageIndex].dataUrl}
                    alt={resolvedUploadedImages[activeImageIndex].name}
                    draggable={false}
                    className="h-auto max-h-full w-auto max-w-full object-contain"
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {resolvedUploadedImages.map((image, index) => (
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
              Canvas preview for {task.itemName}
            </div>
          )}
          <div className="mt-4 grid grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
              <p className="font-semibold text-gray-700">Detected labels</p>
              <p className="mt-1">12 boxes • 4 classes</p>
            </div>
            <div className="rounded-md border border-gray-200 bg-white px-3 py-2">
              <p className="font-semibold text-gray-700">Auto-save</p>
              <p className="mt-1">Last saved 2 mins ago</p>
            </div>
          </div>
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
                      const nextLabelRounds = labelRounds[label] ?? [];
                      const keepCurrentRound = nextLabelRounds.some(
                        (round) => round.id === activeRoundId,
                      );
                      setSelectedLabel(label);
                      if (!keepCurrentRound) {
                        setActiveRoundId(nextLabelRounds[0]?.id ?? "round-1");
                      }
                      setShowReviewErrors(false);
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
            <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                Selected label
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-800">
                {selectedLabel ?? "No label selected"}
              </p>
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
                        Submitted version
                      </p>
                      {activeSubmittedVersion && (
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
                      )}
                      {!activeSubmittedVersion && (
                        <div className="mt-2 space-y-2">
                          <p className="text-sm text-gray-500">
                            No submitted version in this round.
                          </p>
                          {activeRound?.id === "round-3" && (
                            <div className="space-y-2">
                              {round3DraftChecklist.length > 0 ? (
                                round3DraftChecklist.map((item, index) => (
                                  <label
                                    key={item.item}
                                    className="flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={item.checked}
                                      onChange={() =>
                                        handleToggleRound3DraftChecklist(index)
                                      }
                                    />
                                    <span>{item.item}</span>
                                  </label>
                                ))
                              ) : (
                                <p className="text-sm text-gray-500">
                                  Checklist is not available.
                                </p>
                              )}
                              <button
                                type="button"
                                onClick={handleRound3Submit}
                                className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                              >
                                Submit round 3
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="rounded-md border border-gray-200 bg-white px-3 py-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-gray-700">
                          Review version
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowReviewErrors(true)}
                          className="rounded-md border border-amber-200 bg-amber-50 px-2 py-1 text-[11px] font-semibold text-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
                          disabled={!activeReviewVersion}
                        >
                          Open review
                        </button>
                      </div>
                      {activeReviewVersion && (
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
                          <p className="mt-2 text-xs text-gray-600">
                            {activeReviewVersion.feedbacks}
                          </p>
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
                      )}
                      {!activeReviewVersion && (
                        <p className="mt-2 text-sm text-gray-500">
                          No review version in this round.
                        </p>
                      )}
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
        </div>
      </div>

      {showReviewErrors && activeRound && activeReviewVersion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Review errors • {selectedLabel} • {activeRound.title} •{" "}
                {activeReviewVersion.title}
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
              <div className="mb-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600">
                <p>
                  Decision:{" "}
                  <span className="font-semibold">
                    {activeReviewVersion.decision}
                  </span>
                </p>
                <p className="mt-1">{activeReviewVersion.feedbacks}</p>
              </div>
              {activeReviewVersion.reviewErrors.length > 0 ? (
                <div className="space-y-3">
                  {activeReviewVersion.reviewErrors.map((error, index) => (
                    <div
                      key={`${error.reviewErrorTypeName}-${index}`}
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
