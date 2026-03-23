import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { createPortal } from "react-dom";
<<<<<<< Updated upstream
import { Link } from "react-router-dom";
import { type StoredImageRef } from "../../utils/image-store";
=======
import { getReviewerCurrentTasks } from "../../services/reviewer-api";
>>>>>>> Stashed changes

type TaskStatus = "In Progress" | "Pending Review" | "Returned" | "Completed";
type Severity = "Low" | "Medium" | "High";

type ReviewTask = {
  id: string;
  projectName: string;
  dataset: string;
  priority: "Low" | "Normal" | "High";
  status: TaskStatus;
  assignedAt: string;
  dueAt: string;
  aiPrelabel: "Ready" | "Running" | "Off";
  preset: string;
  progress: number;
  instructions: string[];
  checklist: string[];
  labels?: string[];
  submittedLabels?: string[];
  reviewerNote?: string;
  errorTypes?: string[];
  assignedAnnotators?: string[];
  assignedReviewers?: string[];
  assignedReviewerIds?: string[];
  uploadedImages?: Array<{ name: string; dataUrl: string }>;
  submittedImages?: Array<{ name: string; dataUrl: string }>;
  uploadedImageRefs?: StoredImageRef[];
  submittedImageRefs?: StoredImageRef[];
  qaDecision?: "Approved" | "Rejected";
  qaReviewedAt?: string;
  annotatorScoreDelta?: number;
  severity?: Severity;
};

<<<<<<< Updated upstream
const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";
const ANNOTATOR_TASKS_UPDATED_EVENT = "annotator-tasks-updated";
const ADMIN_USERS_STORAGE_KEY = "admin-users";

type AdminStorageUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Reviewer" | "Annotator";
  status: "Active" | "Suspended";
  phone: string;
};
=======
const REVIEWER_TASKS_STORAGE_KEY = "reviewer-tasks-queue";
const REVIEWER_TASKS_UPDATED_EVENT = "reviewer-tasks-updated";
>>>>>>> Stashed changes

const seedTasks: ReviewTask[] = [
  {
    id: "task-101",
    projectName: "Street Scene Vehicles",
    dataset: "Urban-Cam-12",
    priority: "Normal",
    status: "Pending Review",
    assignedAt: "2026-02-24",
    dueAt: "2026-03-02",
    aiPrelabel: "Ready",
    preset: "Vehicle Boxes",
    progress: 100,
    instructions: [
      "Label cars, buses, bikes, and trucks.",
      "Tight box around vehicle body.",
    ],
    checklist: ["All vehicles labeled", "Boxes are tight"],
    assignedAnnotators: ["Annotator A"],
  },
  {
    id: "task-102",
    projectName: "Medical Scan Classification",
    dataset: "CT-Slice-22",
    priority: "Normal",
    status: "Returned",
    assignedAt: "2026-02-18",
    dueAt: "2026-03-01",
    aiPrelabel: "Off",
    preset: "CT Findings",
    progress: 80,
    instructions: [
      "Assign one primary finding per slice.",
      "Use `Uncertain` when ambiguous.",
    ],
    checklist: ["Single class per slice", "No missing slices"],
    reviewerNote: "Check slices 14-20 for missing hemorrhage labels.",
    errorTypes: ["Missed label", "Incorrect class"],
    assignedAnnotators: ["Annotator B"],
    qaDecision: "Rejected",
    qaReviewedAt: "2026-03-01",
    annotatorScoreDelta: -6,
    severity: "High",
  },
];

const loadTasks = (): ReviewTask[] => {
  if (typeof window === "undefined") {
    return seedTasks;
  }

  const raw = localStorage.getItem(REVIEWER_TASKS_STORAGE_KEY);
  if (!raw) {
    return seedTasks;
  }

  try {
    const stored = JSON.parse(raw) as ReviewTask[];
    const byId = new Map<string, ReviewTask>();
    stored.forEach((task) => byId.set(task.id, task));
    seedTasks.forEach((task) => {
      if (!byId.has(task.id)) {
        byId.set(task.id, task);
      }
    });
    return Array.from(byId.values());
  } catch {
    return seedTasks;
  }
};

const getCurrentReviewerIdentity = (): { keys: string[]; id: string | null } => {
  if (typeof window === "undefined") {
    return { keys: [], id: null };
  }

  const currentUserName = localStorage.getItem("currentUserName")?.trim();
  if (!currentUserName) {
    return { keys: [], id: null };
  }

  const keys = new Set([currentUserName]);
  const atIndex = currentUserName.indexOf("@");
  if (atIndex > 0) {
    keys.add(currentUserName.slice(0, atIndex));
  }
  let reviewerId: string | null = null;

  const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
  if (!raw) {
    return { keys: Array.from(keys), id: reviewerId };
  }

  try {
    const users = JSON.parse(raw) as AdminStorageUser[];
    const matched = users.find(
      (user) =>
        user.name.toLowerCase() === currentUserName.toLowerCase() ||
        user.email.toLowerCase() === currentUserName.toLowerCase(),
    );
    if (matched) {
      keys.add(matched.name);
      keys.add(matched.email);
      reviewerId = matched.id;
    }
  } catch {
    return { keys: Array.from(keys), id: reviewerId };
  }

  return { keys: Array.from(keys), id: reviewerId };
};

const saveTasks = (tasks: ReviewTask[]) => {
  localStorage.setItem(REVIEWER_TASKS_STORAGE_KEY, JSON.stringify(tasks));
  window.dispatchEvent(new CustomEvent(REVIEWER_TASKS_UPDATED_EVENT));
};

const scoreFromSeverity = (severity: Severity) => {
  if (severity === "Low") return -1;
  if (severity === "Medium") return -3;
  return -6;
};

export default function ReviewerQueuePage() {
  const [tasks, setTasks] = useState<ReviewTask[]>(() => loadTasks());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">(
    "All",
  );
  const [activeTask] = useState<ReviewTask | null>(null);
  const [isInspectOpen, setIsInspectOpen] = useState(false);
  const [decision, setDecision] = useState<"Approved" | "Rejected">("Approved");
  const [severity, setSeverity] = useState<Severity>("Low");
  const [errorTypes, setErrorTypes] = useState<string[]>([]);
  const [reviewComment, setReviewComment] = useState("");
  const [activeReviewImageIndex, setActiveReviewImageIndex] = useState(0);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  // Fetch tasks from API
  useEffect(() => {
    let mounted = true;
    const fetchTasks = async () => {
      try {
        const apiTasks = await getReviewerCurrentTasks();
        if (!mounted) return;

        // Convert API ReviewerTask to ReviewTask with seed data defaults
        const convertedTasks = apiTasks.map((apiTask) => ({
          id: apiTask.id,
          projectName: apiTask.projectName,
          dataset: apiTask.dataset,
          priority: apiTask.priority,
          status: apiTask.status as TaskStatus,
          assignedAt: apiTask.assignedAt,
          dueAt: apiTask.dueAt,
          aiPrelabel: "Ready" as const,
          preset: apiTask.preset,
          progress: apiTask.progress,
          instructions: ["Review annotator submission according to project guidelines."],
          checklist: ["Verify accuracy", "Check completeness"],
          assignedAnnotators: apiTask.annotatorName ? [apiTask.annotatorName] : [],
        } satisfies ReviewTask));

        if (convertedTasks.length > 0) {
          setTasks(convertedTasks);
          localStorage.setItem(REVIEWER_TASKS_STORAGE_KEY, JSON.stringify(convertedTasks));
          window.dispatchEvent(new CustomEvent(REVIEWER_TASKS_UPDATED_EVENT));
        }
        setLoadError("");
      } catch {
        if (mounted) setLoadError("Can not load reviewer tasks from API. Showing local data.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void fetchTasks();

    const refreshTasks = () => setTasks(loadTasks());
    window.addEventListener("storage", refreshTasks);
    window.addEventListener(REVIEWER_TASKS_UPDATED_EVENT, refreshTasks);

    return () => {
      mounted = false;
      window.removeEventListener("storage", refreshTasks);
      window.removeEventListener(REVIEWER_TASKS_UPDATED_EVENT, refreshTasks);
    };
  }, []);

  useEffect(() => {
    if (!isInspectOpen) {
      return;
    }

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isInspectOpen]);

  const filteredTasks = useMemo(() => {
    const reviewerIdentity = getCurrentReviewerIdentity();
    return tasks.filter((task) => {
      const bySearch =
        task.projectName.toLowerCase().includes(search.toLowerCase()) ||
        task.dataset.toLowerCase().includes(search.toLowerCase());
      const byStatus = statusFilter === "All" || task.status === statusFilter;
      const hasReviewerAssignment =
        (task.assignedReviewers?.length ?? 0) > 0 ||
        (task.assignedReviewerIds?.length ?? 0) > 0;
      const byReviewer =
        !hasReviewerAssignment ||
        reviewerIdentity.keys.length === 0 ||
        (reviewerIdentity.id !== null &&
          (task.assignedReviewerIds ?? []).includes(reviewerIdentity.id)) ||
        (task.assignedReviewers ?? []).some((reviewer) =>
          reviewerIdentity.keys.some(
            (key) => reviewer.toLowerCase() === key.toLowerCase(),
          ),
        );
      return bySearch && byStatus && byReviewer;
    });
  }, [tasks, search, statusFilter]);

  const stats = useMemo(() => {
    return {
      pending: tasks.filter((task) => task.status === "Pending Review").length,
      approved: tasks.filter((task) => task.qaDecision === "Approved").length,
      rejected: tasks.filter((task) => task.qaDecision === "Rejected").length,
    };
  }, [tasks]);

  const closeWithAnimation = (
    key: string,
    closeFn: Dispatch<SetStateAction<boolean>>,
  ) => {
    setClosingModals((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      closeFn(false);
      setClosingModals((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 180);
  };

  const getReviewImages = (task: ReviewTask) => {
    if (task.submittedImages && task.submittedImages.length > 0) {
      return task.submittedImages;
    }
    return task.uploadedImages ?? [];
  };

  const getSubmittedLabels = (task: ReviewTask) => {
    if (task.submittedLabels && task.submittedLabels.length > 0) {
      return task.submittedLabels;
    }
    if (task.labels && task.labels.length > 0) {
      return task.labels;
    }
    return [];
  };

  const toggleErrorType = (errorType: string) => {
    setErrorTypes((prev) =>
      prev.includes(errorType)
        ? prev.filter((item) => item !== errorType)
        : [...prev, errorType],
    );
  };

  const applyDecision = () => {
    if (!activeTask) return;
    const reviewedAt = new Date().toISOString().slice(0, 10);

    const updated = tasks.map((task) => {
      if (task.id !== activeTask.id) {
        return task;
      }

      if (decision === "Approved") {
        return {
          ...task,
          status: "Completed" as TaskStatus,
          qaDecision: "Approved" as const,
          qaReviewedAt: reviewedAt,
          reviewerNote: reviewComment.trim() || "Approved by reviewer.",
          errorTypes: [],
          annotatorScoreDelta: 2,
          severity: undefined,
        };
      }

      return {
        ...task,
        status: "Returned" as TaskStatus,
        qaDecision: "Rejected" as const,
        qaReviewedAt: reviewedAt,
        reviewerNote: reviewComment.trim() || "Please fix issues and resubmit.",
        errorTypes,
        annotatorScoreDelta: scoreFromSeverity(severity),
        severity,
      };
    });

    setTasks(updated);
    saveTasks(updated);
    closeWithAnimation("inspect", setIsInspectOpen);
  };

  return (
<<<<<<< Updated upstream
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
=======
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-cyan-50/25 px-4 py-5 sm:px-6">
      {isLoading && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Loading tasks from API...
        </div>
      )}
      {loadError && (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
          {loadError}
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-5">
>>>>>>> Stashed changes
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Review Queue</h2>
          <p className="text-sm text-gray-500">
            Inspect pending submissions, approve or reject with categorized
            errors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Pending: {stats.pending}
          </span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Approved: {stats.approved}
          </span>
          <span className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            Rejected: {stats.rejected}
          </span>
        </div>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.8fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Search</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Search project or dataset..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatus | "All")
            }
            title="Filter by status"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="Pending Review">Pending Review</option>
            <option value="Returned">Returned</option>
            <option value="Completed">Completed</option>
            <option value="All">All</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            Order by
          </label>
          <select
            title="Order tasks"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option>Assigned date</option>
            <option>Due date</option>
            <option>Priority</option>
          </select>
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[860px]">
            <div className="grid grid-cols-[1.7fr_1.4fr_0.9fr_0.9fr_1.2fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
              <span>Project</span>
              <span>Dataset</span>
              <span>Status</span>
              <span>Annotator</span>
              <span>Action</span>
            </div>

<<<<<<< Updated upstream
            {filteredTasks.map((task) => (
              <div
                key={task.id}
                className="grid grid-cols-[1.7fr_1.4fr_0.9fr_0.9fr_1.2fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
              >
                <div>
                  <p className="font-semibold text-gray-800">
                    {task.projectName}
                  </p>
                  <p className="text-xs text-gray-500">Due {task.dueAt}</p>
                </div>
                <p className="text-gray-600">{task.dataset}</p>
                <span
                  className={`w-fit rounded-md px-3 py-1 text-xs font-semibold ${
                    task.status === "Pending Review"
                      ? "bg-amber-100 text-amber-700"
                      : task.status === "Completed"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-rose-100 text-rose-700"
                  }`}
                >
                  {task.status}
                </span>
                <p className="text-xs text-gray-600">
                  {task.assignedAnnotators?.join(", ") || "Unassigned"}
                </p>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <Link
                    to={`/reviewer/workspace/${task.id}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Inspect
                  </Link>
                </div>
=======
            {filteredTasks.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <p className="text-sm font-semibold text-slate-700">No tasks match current filters</p>
                <p className="mt-1 text-xs text-slate-500">Try changing status or turning off urgent-only mode.</p>
>>>>>>> Stashed changes
              </div>
            ))}
          </div>
        </div>
      </div>

      {isInspectOpen &&
        activeTask &&
        createPortal(
          <div className="fixed inset-0 z-[110] flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 sm:items-center">
            <div
              className={`max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${closingModals.inspect ? "modal-pop-out" : "modal-pop"}`}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-800">
                  Inspect Submission
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    closeWithAnimation("inspect", setIsInspectOpen)
                  }
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4 p-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Project
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {activeTask.projectName}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Preset
                    </p>
                    <p className="text-sm font-semibold text-gray-800">
                      {activeTask.preset}
                    </p>
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-500">
                    Annotator checklist
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {activeTask.checklist.map((item) => (
                      <div
                        key={item}
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-700"
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-md border border-gray-200 p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-gray-500">
                      Submitted labels (annotator edited)
                    </p>
                    <span className="text-xs text-gray-500">
                      {getSubmittedLabels(activeTask).length} labels
                    </span>
                  </div>
                  <div className="mt-2 max-h-28 overflow-y-auto rounded-md border border-gray-100 bg-gray-50 p-2">
                    <div className="flex flex-wrap gap-2">
                      {getSubmittedLabels(activeTask).length === 0 ? (
                        <span className="text-xs text-gray-400">
                          No submitted labels.
                        </span>
                      ) : (
                        getSubmittedLabels(activeTask).map((label) => (
                          <span
                            key={label}
                            className="rounded-md border border-gray-200 bg-white px-2 py-1 text-xs text-gray-700 break-all"
                          >
                            {label}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {getReviewImages(activeTask).length > 0 ? (
                  <div className="rounded-md border border-gray-200 p-3">
                    <p className="text-xs font-semibold text-gray-500">
                      Submitted data (from annotator)
                    </p>
                    <div className="mt-2 overflow-hidden rounded-md border border-gray-200 bg-gray-50 p-2">
                      <img
                        src={
                          getReviewImages(activeTask)[activeReviewImageIndex]
                            ?.dataUrl
                        }
                        alt={
                          getReviewImages(activeTask)[activeReviewImageIndex]
                            ?.name || "Submitted image"
                        }
                        className="h-[240px] w-full rounded-md border border-gray-200 bg-white object-contain"
                      />
                    </div>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {getReviewImages(activeTask).map((image, index) => (
                        <img
                          key={image.name + index}
                          src={image.dataUrl}
                          alt={image.name}
                          onClick={() => setActiveReviewImageIndex(index)}
                          className={`h-16 w-16 cursor-pointer rounded-md border object-cover ${
                            index === activeReviewImageIndex
                              ? "border-blue-500 ring-2 ring-blue-200"
                              : "border-gray-200"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 p-4 text-xs text-gray-500">
                    No submitted image from annotator for this task.
                  </div>
                )}

                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-500">
                    Decision
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        checked={decision === "Approved"}
                        onChange={() => setDecision("Approved")}
                      />
                      Approve
                    </label>
                    <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="radio"
                        checked={decision === "Rejected"}
                        onChange={() => setDecision("Rejected")}
                      />
                      Reject / Send Back
                    </label>
                  </div>
                </div>

                {decision === "Rejected" && (
                  <div className="space-y-3 rounded-md border border-rose-200 bg-rose-50 p-3">
                    <div>
                      <p className="text-xs font-semibold text-rose-700">
                        Error types
                      </p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        {[
                          "Vẽ không sát biên",
                          "Sai nhãn",
                          "Thiếu nhãn",
                          "Sai guideline",
                        ].map((item) => (
                          <button
                            key={item}
                            type="button"
                            onClick={() => toggleErrorType(item)}
                            className={`rounded-md border px-2 py-1 text-xs ${
                              errorTypes.includes(item)
                                ? "border-rose-400 bg-rose-100 text-rose-700"
                                : "border-rose-200 bg-white text-rose-600"
                            }`}
                          >
                            {item}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-semibold text-rose-700">
                          Severity
                        </p>
                        <select
                          value={severity}
                          onChange={(event) =>
                            setSeverity(event.target.value as Severity)
                          }
                          title="Error severity"
                          className="mt-1 w-full rounded-md border border-rose-200 bg-white px-3 py-2 text-sm"
                        >
                          <option value="Low">Low</option>
                          <option value="Medium">Medium</option>
                          <option value="High">High</option>
                        </select>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-rose-700">
                          Annotator score impact
                        </p>
                        <div className="mt-1 rounded-md border border-rose-200 bg-white px-3 py-2 text-sm font-semibold text-rose-700">
                          {scoreFromSeverity(severity)} points
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <p className="text-xs font-semibold text-gray-500">Comment</p>
                  <textarea
                    value={reviewComment}
                    onChange={(event) => setReviewComment(event.target.value)}
                    className="mt-2 min-h-[100px] w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Provide review notes for annotator..."
                  />
                </div>

                <div className="flex justify-end gap-2 border-t pt-3">
                  <button
                    type="button"
                    onClick={() =>
                      closeWithAnimation("inspect", setIsInspectOpen)
                    }
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={applyDecision}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    Save Decision
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
