<<<<<<< Updated upstream
import { Navigate } from "react-router-dom";

export default function ReviewerHomePage() {
  return <Navigate to="/reviewer/queue" replace />;
=======
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { getReviewerCurrentTasks } from "../../services/reviewer-api";

type TaskStatus = "In Progress" | "Pending Review" | "Returned" | "Completed";

type ReviewTask = {
  id: string;
  projectName: string;
  dataset: string;
  status: TaskStatus;
  dueAt: string;
  qaDecision?: "Approved" | "Rejected";
  qaReviewedAt?: string;
  assignedAnnotators?: string[];
  errorTypes?: string[];
};

const REVIEWER_TASKS_STORAGE_KEY = "reviewer-tasks-queue";

const seedTasks: ReviewTask[] = [
  {
    id: "task-101",
    projectName: "Street Scene Vehicles",
    dataset: "Urban-Cam-12",
    status: "Pending Review",
    dueAt: "2026-03-02",
    assignedAnnotators: ["Annotator A"],
  },
  {
    id: "task-102",
    projectName: "Medical Scan Classification",
    dataset: "CT-Slice-22",
    status: "Returned",
    dueAt: "2026-03-01",
    qaDecision: "Rejected",
    qaReviewedAt: "2026-03-01",
    assignedAnnotators: ["Annotator B"],
    errorTypes: ["Missed label", "Incorrect class"],
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
    const parsed = JSON.parse(raw) as ReviewTask[];
    if (!Array.isArray(parsed) || parsed.length === 0) {
      return seedTasks;
    }
    return parsed;
  } catch {
    return seedTasks;
  }
};

export default function ReviewerHomePage() {
  const [tasks, setTasks] = useState<ReviewTask[]>(() => loadTasks());
  const [isLoading, setIsLoading] = useState(true);

  // Fetch tasks from API on mount
  useEffect(() => {
    let mounted = true;
    const fetchTasks = async () => {
      try {
        const apiTasks = await getReviewerCurrentTasks();
        if (!mounted) return;

        const convertedTasks = apiTasks.map((apiTask) => ({
          id: apiTask.id,
          projectName: apiTask.projectName,
          dataset: apiTask.dataset,
          status: apiTask.status as TaskStatus,
          dueAt: apiTask.dueAt,
          assignedAnnotators: apiTask.annotatorName ? [apiTask.annotatorName] : [],
        } satisfies ReviewTask));

        if (convertedTasks.length > 0) {
          setTasks(convertedTasks);
          localStorage.setItem(REVIEWER_TASKS_STORAGE_KEY, JSON.stringify(convertedTasks));
        }
      } catch {
        // Use local/seed data on error
        if (mounted) setTasks(loadTasks());
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    void fetchTasks();
    return () => { mounted = false; };
  }, []);

  const dashboard = useMemo(() => {
    const pending = tasks.filter((task) => task.status === "Pending Review").length;
    const returned = tasks.filter((task) => task.status === "Returned").length;
    const completed = tasks.filter((task) => task.status === "Completed").length;
    const approved = tasks.filter((task) => task.qaDecision === "Approved").length;
    const rejected = tasks.filter((task) => task.qaDecision === "Rejected").length;

    const reviewed = approved + rejected;
    const approvalRate = reviewed > 0 ? Math.round((approved / reviewed) * 100) : 0;

    const priorityQueue = tasks
      .filter((task) => task.status === "Pending Review" || task.status === "Returned")
      .sort((a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime())
      .slice(0, 6);

    return {
      pending,
      returned,
      completed,
      approvalRate,
      priorityQueue,
    };
  }, [tasks]);

  return (
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-cyan-50/40 px-4 py-5 sm:px-6">
      {isLoading && (
        <div className="mb-4 rounded-md border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          Loading dashboard data from API...
        </div>
      )}

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
            Reviewer Command Center
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">
            Quality Dashboard
          </h2>
          <p className="text-sm text-slate-600">
            Theo doi hang doi can review, ket qua QA, va cac task can xu ly ngay.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/reviewer/queue"
            className="rounded-lg bg-cyan-600 px-3 py-2 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-[1px] hover:bg-cyan-700"
          >
            Open Review Queue
          </Link>
          <Link
            to="/reviewer/reports"
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:-translate-y-[1px] hover:border-slate-400 hover:bg-slate-50"
          >
            View Reports
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Pending Review" value={String(dashboard.pending)} tone="amber" />
        <MetricCard title="Returned" value={String(dashboard.returned)} tone="rose" />
        <MetricCard title="Completed" value={String(dashboard.completed)} tone="emerald" />
        <MetricCard title="Approval Rate" value={`${dashboard.approvalRate}%`} tone="cyan" />
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 xl:grid-cols-[1.5fr_1fr]">
        <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Urgent Review Queue</h3>
            <Link to="/reviewer/queue" className="text-xs font-semibold text-cyan-700 hover:text-cyan-800">
              See all
            </Link>
          </div>

          <div className="divide-y divide-slate-100">
            {dashboard.priorityQueue.length === 0 ? (
              <p className="px-4 py-6 text-sm text-slate-500">No tasks requiring immediate action.</p>
            ) : (
              dashboard.priorityQueue.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <p className="font-semibold text-slate-800">{task.projectName}</p>
                    <p className="text-xs text-slate-500">{task.dataset}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        task.status === "Pending Review"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {task.status}
                    </span>
                    <p className="mt-1 text-[11px] text-slate-500">Due {task.dueAt}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-800">Reviewer Checklist</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-700">
            <li className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
              Xac minh guideline va preset truoc khi approve.
            </li>
            <li className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
              Ghi ro error type va severity khi reject.
            </li>
            <li className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
              Uu tien task sap den due date trong queue.
            </li>
            <li className="rounded-lg border border-cyan-100 bg-white px-3 py-2">
              Theo doi approval rate de can doi chat luong va toc do.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  value,
  tone,
}: {
  title: string;
  value: string;
  tone: "amber" | "rose" | "emerald" | "cyan";
}) {
  const styles = {
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    rose: "border-rose-200 bg-rose-50 text-rose-700",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  } as const;

  return (
    <div className={`rounded-xl border px-4 py-3 shadow-sm ${styles[tone]}`}>
      <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
>>>>>>> Stashed changes
}
