import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";

const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";

type UploadedImage = {
  name: string;
  dataUrl: string;
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
  uploadedImages?: UploadedImage[];
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
          (item) => typeof item?.name === "string" && typeof item?.dataUrl === "string",
        )
      : [];

    const labels = Array.isArray(matched.labels)
      ? (matched.labels as string[]).filter((item) => typeof item === "string")
      : ["Label A", "Label B"];

    const instructions = Array.isArray(matched.instructions)
      ? (matched.instructions as string[]).filter((item) => typeof item === "string")
      : ["Follow manager instructions before labeling."];

    const checklist = Array.isArray(matched.checklist)
      ? (matched.checklist as string[]).filter((item) => typeof item === "string")
      : ["Checklist completed"];

    return {
      id: String(matched.id ?? taskId),
      projectName: String(matched.projectName ?? "Assigned Project"),
      dataset: String(matched.dataset ?? "Manager uploaded dataset"),
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
  itemName: "item_001.png",
  preset: "Default",
  aiPrelabel: "Running",
  instructions: ["Follow project guidelines before labeling."],
  checklist: ["Labels reviewed", "Checklist completed"],
  labels: ["Label A", "Label B"],
};

export default function AnnotatorWorkspacePage() {
  const { id } = useParams();
  const storageTask = useMemo(() => readAssignedWorkspaceTask(id), [id]);
  const task = useMemo(
    () => storageTask ?? taskMap[id ?? ""] ?? fallbackTask,
    [id, storageTask],
  );
  const [checkedItems, setCheckedItems] = useState<boolean[]>([]);
  const [customLabels, setCustomLabels] = useState<string[]>(task.labels);
  const [newLabel, setNewLabel] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [aiApplied, setAiApplied] = useState(task.aiPrelabel === "Ready");
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    setCheckedItems(task.checklist.map(() => false));
    setCustomLabels(task.labels);
    setNewLabel("");
    setIsSubmitted(false);
    setShowSubmitConfirm(false);
    setAiApplied(task.aiPrelabel === "Ready");
    setActiveImageIndex(0);
  }, [task]);

  const allChecked = checkedItems.every(Boolean);

  const handleToggleChecklist = (index: number) => {
    setCheckedItems((prev) =>
      prev.map((checked, idx) => (idx === index ? !checked : checked)),
    );
  };

  const handleAddLabel = () => {
    const trimmed = newLabel.trim();
    if (!trimmed || customLabels.includes(trimmed)) {
      return;
    }
    setCustomLabels((prev) => [...prev, trimmed]);
    setNewLabel("");
  };

  const handleSubmit = () => {
    setShowSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitted(true);
    setShowSubmitConfirm(false);
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
            <p className="text-sm font-semibold text-gray-700">Canvas</p>
            <div className="flex items-center gap-2 text-xs font-semibold text-gray-500">
              <button className="rounded-md border border-gray-200 px-2 py-1">
                Zoom -
              </button>
              <button className="rounded-md border border-gray-200 px-2 py-1">
                Zoom +
              </button>
              <button className="rounded-md border border-gray-200 px-2 py-1">
                Pan
              </button>
              <button className="rounded-md border border-blue-200 bg-blue-50 px-2 py-1 text-blue-700">
                Draw box
              </button>
            </div>
          </div>
          {task.uploadedImages && task.uploadedImages.length > 0 ? (
            <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
              <div className="flex h-[320px] items-center justify-center overflow-hidden rounded-md border border-gray-200 bg-white">
                <img
                  src={task.uploadedImages[activeImageIndex].dataUrl}
                  alt={task.uploadedImages[activeImageIndex].name}
                  className="max-h-full w-auto object-contain"
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {task.uploadedImages.map((image, index) => (
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

        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Checklist</p>
            <div className="mt-3 space-y-2 text-sm text-gray-700">
              {task.checklist.map((item, index) => (
                <label
                  key={item}
                  className="flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2"
                >
                  <input
                    type="checkbox"
                    checked={checkedItems[index] ?? false}
                    onChange={() => handleToggleChecklist(index)}
                  />
                  <span>{item}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-semibold text-gray-500">Labels</p>
            <div className="mt-3 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  value={newLabel}
                  onChange={(event) => setNewLabel(event.target.value)}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Add new label..."
                />
                <button
                  type="button"
                  onClick={handleAddLabel}
                  className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Add
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
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
            <p className="text-xs font-semibold text-gray-500">Submit</p>
            <p className="mt-2 text-sm text-gray-600">
              Complete the checklist before submitting for review.
            </p>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!allChecked || isSubmitted}
              className={`mt-3 w-full rounded-md px-3 py-2 text-sm font-semibold text-white ${
                !allChecked || isSubmitted
                  ? "bg-gray-300"
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isSubmitted ? "Submitted" : "Submit for review"}
            </button>
            {!allChecked && (
              <p className="mt-2 text-xs text-amber-600">
                Please confirm all checklist items.
              </p>
            )}
          </div>
        </div>
      </div>

      {showSubmitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-md rounded-lg border border-gray-300 bg-white shadow-xl modal-pop">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Submit task
              </h3>
              <button
                type="button"
                onClick={() => setShowSubmitConfirm(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4 text-sm text-gray-700">
              <p>
                You are about to submit this task for review. Status will change
                to Pending Review.
              </p>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSubmitConfirm(false)}
                  className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSubmit}
                  className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                >
                  Confirm submit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
