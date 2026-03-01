import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type SetStateAction,
} from "react";
import { Link } from "react-router-dom";

type TaskStatus = "In Progress" | "Pending Review" | "Returned" | "Completed";

type Task = {
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
  reviewerNote?: string;
  errorTypes?: string[];
  assignedAnnotators?: string[];
};

const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";
const ANNOTATOR_TASKS_UPDATED_EVENT = "annotator-tasks-updated";

const readTasksFromStorage = (): Task[] => {
  if (typeof window === "undefined") {
    return initialTasks;
  }

  const raw = localStorage.getItem(ANNOTATOR_TASKS_STORAGE_KEY);
  if (!raw) {
    return initialTasks;
  }

  try {
    const assignedTasks = JSON.parse(raw) as Task[];
    const byId = new Map<string, Task>();
    assignedTasks.forEach((task) => byId.set(task.id, task));
    initialTasks.forEach((task) => {
      if (!byId.has(task.id)) {
        byId.set(task.id, task);
      }
    });
    return Array.from(byId.values());
  } catch {
    return initialTasks;
  }
};

const initialTasks: Task[] = [
  {
    id: "task-100",
    projectName: "Retail Shelf Audit",
    dataset: "Shelf-Images-Set-3",
    priority: "High",
    status: "In Progress",
    assignedAt: "2026-02-26",
    dueAt: "2026-03-05",
    aiPrelabel: "Ready",
    preset: "Retail SKU V2",
    progress: 45,
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
  },
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
  },
  {
    id: "task-103",
    projectName: "Document Entities",
    dataset: "Contracts-Set-1",
    priority: "Low",
    status: "Completed",
    assignedAt: "2026-02-12",
    dueAt: "2026-02-19",
    aiPrelabel: "Ready",
    preset: "NER Basic",
    progress: 100,
    instructions: [
      "Tag PERSON, ORG, DATE entities.",
      "Ignore boilerplate signatures.",
    ],
    checklist: ["Entities tagged", "No overlapping spans"],
  },
];

export default function AnnotatorTasksPage() {
  const [tasks, setTasks] = useState<Task[]>(() => readTasksFromStorage());
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TaskStatus | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<
    Task["priority"] | "All"
  >("All");
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const matchesSearch =
        task.projectName.toLowerCase().includes(search.toLowerCase()) ||
        task.dataset.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;
      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const counts = useMemo(() => {
    return {
      total: tasks.length,
      inProgress: tasks.filter((task) => task.status === "In Progress").length,
      pending: tasks.filter((task) => task.status === "Pending Review").length,
      returned: tasks.filter((task) => task.status === "Returned").length,
    };
  }, [tasks]);

  const handleOpenInstructions = (task: Task) => {
    setActiveTask(task);
    setIsInstructionsOpen(true);
  };

  const handleOpenFeedback = (task: Task) => {
    setActiveTask(task);
    setIsFeedbackOpen(true);
  };

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
    }, 200);
  };

  useEffect(() => {
    const refreshTasks = () => {
      setTasks(readTasksFromStorage());
    };

    window.addEventListener("storage", refreshTasks);
    window.addEventListener(ANNOTATOR_TASKS_UPDATED_EVENT, refreshTasks);

    return () => {
      window.removeEventListener("storage", refreshTasks);
      window.removeEventListener(ANNOTATOR_TASKS_UPDATED_EVENT, refreshTasks);
    };
  }, []);

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">My Tasks</h2>
          <p className="text-sm text-gray-500">
            Assigned work queue with AI pre-label status and checklist guidance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
            Total: {counts.total}
          </div>
          <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
            In Progress: {counts.inProgress}
          </div>
          <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Pending: {counts.pending}
          </div>
          <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            Returned: {counts.returned}
          </div>
        </div>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Search</label>
          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full text-sm outline-none placeholder:text-gray-400"
              placeholder="Search by project or dataset..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(event.target.value as TaskStatus | "All")
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="All">All</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending Review">Pending Review</option>
            <option value="Returned">Returned</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Priority</label>
          <select
            value={priorityFilter}
            onChange={(event) =>
              setPriorityFilter(event.target.value as Task["priority"] | "All")
            }
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option value="All">All</option>
            <option value="High">High</option>
            <option value="Normal">Normal</option>
            <option value="Low">Low</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order by</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>Due date</option>
            <option>Assigned date</option>
            <option>Priority</option>
          </select>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.6fr_1.5fr_0.8fr_0.9fr_0.9fr_1.2fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Project</span>
          <span>Dataset</span>
          <span>Status</span>
          <span>Priority</span>
          <span>AI Pre-label</span>
          <span>Action</span>
        </div>

        {filteredTasks.map((task) => (
          <div
            key={task.id}
            className="grid grid-cols-[1.6fr_1.5fr_0.8fr_0.9fr_0.9fr_1.2fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
          >
            <div>
              <p className="font-medium text-gray-800">{task.projectName}</p>
              <p className="text-xs text-gray-500">Due {task.dueAt}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{task.dataset}</p>
              <p className="text-xs text-gray-500">Preset: {task.preset}</p>
            </div>
            <div>
              <span
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  task.status === "In Progress"
                    ? "bg-blue-100 text-blue-700"
                    : task.status === "Pending Review"
                      ? "bg-amber-100 text-amber-700"
                      : task.status === "Returned"
                        ? "bg-rose-100 text-rose-700"
                        : "bg-emerald-100 text-emerald-700"
                }`}
              >
                {task.status}
              </span>
            </div>
            <div>
              <span
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
                  task.priority === "High"
                    ? "bg-rose-100 text-rose-700"
                    : task.priority === "Normal"
                      ? "bg-gray-100 text-gray-700"
                      : "bg-slate-100 text-slate-600"
                }`}
              >
                {task.priority}
              </span>
            </div>
            <div>
              <span
                className={`rounded-md px-3 py-1 text-xs font-semibold ${
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
            <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
              <Link
                to={`/annotator/workspace/${task.id}`}
                className="text-blue-600 hover:text-blue-700"
              >
                {task.status === "Returned" ? "Fix & Resubmit" : "Open"}
              </Link>
              <button
                type="button"
                onClick={() => handleOpenInstructions(task)}
                className="text-blue-600 hover:text-blue-700"
              >
                Instructions
              </button>
              {task.status === "Returned" && (
                <button
                  type="button"
                  onClick={() => handleOpenFeedback(task)}
                  className="text-rose-500 hover:text-rose-600"
                >
                  Feedback
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isInstructionsOpen && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.instructions ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Instructions
              </h3>
              <button
                type="button"
                onClick={() =>
                  closeWithAnimation("instructions", setIsInstructionsOpen)
                }
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 p-4 text-sm text-gray-700">
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Project
                </p>
                <p className="text-sm font-semibold text-gray-800">
                  {activeTask.projectName}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Dataset
                </p>
                <p>{activeTask.dataset}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Key instructions
                </p>
                <ul className="mt-2 list-disc space-y-2 pl-4 text-sm">
                  {activeTask.instructions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">Checklist</p>
                <div className="mt-2 space-y-2">
                  {activeTask.checklist.map((item) => (
                    <div
                      key={item}
                      className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-600"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isFeedbackOpen && activeTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.feedback ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Reviewer Feedback
              </h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("feedback", setIsFeedbackOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="space-y-3 p-4 text-sm text-gray-700">
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Reviewer note
                </p>
                <p className="mt-1 rounded-md border border-rose-100 bg-rose-50 px-3 py-2 text-sm text-rose-700">
                  {activeTask.reviewerNote ||
                    "No additional notes were provided."}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Error categories
                </p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {(activeTask.errorTypes ?? ["Unspecified"]).map((item) => (
                    <span
                      key={item}
                      className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs font-semibold text-rose-700"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500">
                  Next step
                </p>
                <p>
                  Update the labels in Workspace and resubmit for review.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
