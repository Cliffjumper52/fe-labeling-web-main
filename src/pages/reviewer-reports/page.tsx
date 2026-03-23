import { useEffect, useMemo, useState } from "react";

type TaskStatus = "In Progress" | "Pending Review" | "Returned" | "Completed";

type ReviewTask = {
  id: string;
  projectName: string;
  dataset: string;
  status: TaskStatus;
  qaDecision?: "Approved" | "Rejected";
  qaReviewedAt?: string;
  errorTypes?: string[];
  annotatorScoreDelta?: number;
};

const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";
const ANNOTATOR_TASKS_UPDATED_EVENT = "annotator-tasks-updated";

const seedTasks: ReviewTask[] = [
  {
    id: "task-101",
    projectName: "Street Scene Vehicles",
    dataset: "Urban-Cam-12",
    status: "Pending Review",
  },
  {
    id: "task-102",
    projectName: "Medical Scan Classification",
    dataset: "CT-Slice-22",
    status: "Returned",
    qaDecision: "Rejected",
    qaReviewedAt: "2026-03-01",
    errorTypes: ["Missed label", "Incorrect class"],
    annotatorScoreDelta: -6,
  },
];

const loadTasks = (): ReviewTask[] => {
  if (typeof window === "undefined") {
    return seedTasks;
  }

  const raw = localStorage.getItem(ANNOTATOR_TASKS_STORAGE_KEY);
  if (!raw) return seedTasks;

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

export default function ReviewerReportsPage() {
  const [tasks, setTasks] = useState<ReviewTask[]>(() => loadTasks());

  useEffect(() => {
    const refresh = () => setTasks(loadTasks());
    window.addEventListener("storage", refresh);
    window.addEventListener(ANNOTATOR_TASKS_UPDATED_EVENT, refresh);

    return () => {
      window.removeEventListener("storage", refresh);
      window.removeEventListener(ANNOTATOR_TASKS_UPDATED_EVENT, refresh);
    };
  }, []);

  const metrics = useMemo(() => {
    const approved = tasks.filter((task) => task.qaDecision === "Approved").length;
    const rejected = tasks.filter((task) => task.qaDecision === "Rejected").length;
    const pending = tasks.filter((task) => task.status === "Pending Review").length;
    const totalReviewed = approved + rejected;
    const accuracy = totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : 0;

    const errorCount = tasks.reduce<Record<string, number>>((acc, task) => {
      (task.errorTypes || []).forEach((errorType) => {
        acc[errorType] = (acc[errorType] || 0) + 1;
      });
      return acc;
    }, {});

    const scoreImpact = tasks.reduce((sum, task) => sum + (task.annotatorScoreDelta || 0), 0);

    const maxError = Math.max(1, ...Object.values(errorCount));

    return { approved, rejected, pending, accuracy, errorCount, scoreImpact, maxError };
  }, [tasks]);

  return (
<<<<<<< Updated upstream
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Reviewer Reports</h2>
        <p className="text-sm text-gray-500">
          QA outcome overview and common error trends.
=======
    <div className="w-full bg-gradient-to-b from-slate-50 via-white to-cyan-50/30 px-4 py-5 sm:px-6">
      <div className="mb-5 rounded-2xl border border-slate-200 bg-white/90 px-4 py-4 shadow-sm backdrop-blur sm:px-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-700">
          QA Analytics
        </p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900 sm:text-2xl">Reviewer Reports</h2>
        <p className="text-sm text-slate-600">
          Outcome overview, approval health, and top recurring error categories.
>>>>>>> Stashed changes
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Approved" value={String(metrics.approved)} tone="green" />
        <MetricCard title="Rejected" value={String(metrics.rejected)} tone="red" />
        <MetricCard title="Pending" value={String(metrics.pending)} tone="amber" />
        <MetricCard title="Approval Rate" value={`${metrics.accuracy}%`} tone="blue" />
        <MetricCard title="Score Impact" value={`${metrics.scoreImpact}`} tone="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Recent Reviewed Tasks</h3>
          </div>
          <div className="divide-y">
            {tasks
              .filter((task) => task.qaDecision)
              .slice(0, 10)
              .map((task) => (
                <div key={task.id} className="flex items-center justify-between px-4 py-3 text-sm">
                  <div>
                    <p className="font-semibold text-slate-800">{task.projectName}</p>
                    <p className="text-xs text-slate-500">{task.dataset}</p>
                  </div>
                  <div className="text-right">
                    <span
                      className={`rounded-md px-2 py-1 text-xs font-semibold ${
                        task.qaDecision === "Approved"
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-700"
                      }`}
                    >
                      {task.qaDecision}
                    </span>
                    <p className="mt-1 text-xs text-slate-500">{task.qaReviewedAt || "-"}</p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-4 py-3">
            <h3 className="text-sm font-semibold text-slate-800">Top Error Categories</h3>
          </div>
          <div className="space-y-2 p-4">
            {Object.entries(metrics.errorCount).length === 0 ? (
              <p className="text-sm text-slate-500">No error categories available.</p>
            ) : (
              Object.entries(metrics.errorCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([errorType, count]) => (
                  <div key={errorType} className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span className="text-slate-700">{errorType}</span>
                      <span className="font-semibold text-slate-800">{count}</span>
                    </div>
                    <progress
                      className="h-1.5 w-full overflow-hidden rounded-full [&::-webkit-progress-bar]:bg-slate-200 [&::-webkit-progress-value]:bg-cyan-600 [&::-moz-progress-bar]:bg-cyan-600"
                      value={count}
                      max={metrics.maxError}
                    />
                  </div>
                ))
            )}
          </div>
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
  tone: "green" | "red" | "amber" | "blue" | "cyan";
}) {
  const styles = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    cyan: "border-cyan-200 bg-cyan-50 text-cyan-700",
  } as const;

  return (
    <div className={`rounded-lg border px-4 py-3 ${styles[tone]}`}>
      <p className="text-xs font-semibold uppercase">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
