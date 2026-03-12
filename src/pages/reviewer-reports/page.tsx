<<<<<<< Updated upstream
import { useMemo } from "react";
=======
import { useEffect, useMemo, useState } from "react";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { Decision } from "../../interface/enums/domain.enums";
import type { Review } from "../../interface/review/review.interface";
import {
  getReviewerAggregationStats,
  getReviewsPaginated,
  type ReviewerAggregationStats,
} from "../../services/review-service.service";
import Pagination from "../../components/common/pagination";
import { useAuth } from "../../context/auth-context.context";
>>>>>>> Stashed changes

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

<<<<<<< Updated upstream
const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";
=======
const decisionBadge = (decision: Decision): string => {
  if (decision === "approved") return "bg-emerald-100 text-emerald-700";
  if (decision === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};
>>>>>>> Stashed changes

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
<<<<<<< Updated upstream
    return parsed;
  } catch {
    return seedTasks;
  }
};

export default function ReviewerReportsPage() {
  const tasks = loadTasks();
=======
  });
  const [stats, setStats] = useState<ReviewerAggregationStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
>>>>>>> Stashed changes

  const metrics = useMemo(() => {
    const approved = tasks.filter(
      (task) => task.qaDecision === "Approved",
    ).length;
    const rejected = tasks.filter(
      (task) => task.qaDecision === "Rejected",
    ).length;
    const pending = tasks.filter(
      (task) => task.status === "Pending Review",
    ).length;
    const totalReviewed = approved + rejected;
    const accuracy =
      totalReviewed > 0 ? Math.round((approved / totalReviewed) * 100) : 0;

<<<<<<< Updated upstream
    const errorCount = tasks.reduce<Record<string, number>>((acc, task) => {
      (task.errorTypes || []).forEach((errorType) => {
        acc[errorType] = (acc[errorType] || 0) + 1;
      });
      return acc;
    }, {});

    const scoreImpact = tasks.reduce(
      (sum, task) => sum + (task.annotatorScoreDelta || 0),
      0,
    );

    return { approved, rejected, pending, accuracy, errorCount, scoreImpact };
  }, [tasks]);
=======
  useEffect(() => {
    let cancelled = false;

    const loadStats = async () => {
      if (!currentUser?.id) {
        setStats(EMPTY_STATS);
        setError("Invalid reviewer ID to load stats.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const response = await getReviewerAggregationStats(currentUser.id);
        if (!cancelled) {
          setStats(normalizeStats(response, currentUser.id));
        }
      } catch (err) {
        if (!cancelled) {
          setStats({ ...EMPTY_STATS, reviewerId: currentUser.id });
          setError(getErrorMessage(err));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void loadStats();

    return () => {
      cancelled = true;
    };
  }, [currentUser]);

  const cards = useMemo(
    () => [
      {
        title: "Approved",
        value: stats.approved.toString(),
        className: "border-emerald-200 bg-emerald-50 text-emerald-700",
      },
      {
        title: "Rejected",
        value: stats.rejected.toString(),
        className: "border-rose-200 bg-rose-50 text-rose-700",
      },
      {
        title: "Approval Rate",
        value: `${stats.approvalRate}%`,
        className: "border-sky-200 bg-sky-50 text-sky-700",
      },
      {
        title: "Score Impact",
        value: stats.scoreImpact.toString(),
        className: "border-amber-200 bg-amber-50 text-amber-700",
      },
    ],
    [stats],
  );

  useEffect(() => {
    let cancelled = false;

    const loadReviews = async () => {
      if (!currentUser?.id) return;

      setReviewsLoading(true);
      setReviewsError(null);

      try {
        const resp = await getReviewsPaginated({
          reviewerId: currentUser.id,
          page,
          limit: PAGE_LIMIT,
          order: "DESC",
          orderBy,
          ...(decisionFilter !== "All" && { decision: decisionFilter }),
          ...(reviewSearch.trim() && { search: reviewSearch.trim() }),
        });

        if (cancelled) return;

        const { reviews: fetched, totalPages: pages } = extractReviews(resp);
        setReviews(fetched);
        setTotalPages(pages);
      } catch (err) {
        if (!cancelled) {
          setReviews([]);
          setTotalPages(1);
          setReviewsError(
            err instanceof Error ? err.message : "Failed to load reviews.",
          );
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    };

    void loadReviews();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, page, decisionFilter, reviewSearch, orderBy]);
>>>>>>> Stashed changes

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          Reviewer Reports
        </h2>
        <p className="text-sm text-gray-500">
          QA outcome overview and common error trends.
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Approved"
          value={String(metrics.approved)}
          tone="green"
        />
        <MetricCard
          title="Rejected"
          value={String(metrics.rejected)}
          tone="red"
        />
        <MetricCard
          title="Pending"
          value={String(metrics.pending)}
          tone="amber"
        />
        <MetricCard
          title="Approval Rate"
          value={`${metrics.accuracy}%`}
          tone="blue"
        />
        <MetricCard
          title="Score Impact"
          value={`${metrics.scoreImpact}`}
          tone="purple"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_1fr]">
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Recent Reviewed Tasks
            </h3>
          </div>
<<<<<<< Updated upstream
          <div className="divide-y">
            {tasks
              .filter((task) => task.qaDecision)
              .slice(0, 10)
              .map((task) => (
=======
        ))}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        Total Reviewed:{" "}
        <span className="font-semibold">{stats.totalReviewed}</span>
      </div>

      <div className="mb-4 mt-8 h-px w-full bg-gray-200" />

      <h3 className="mb-3 text-base font-semibold text-gray-800">My Reviews</h3>

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1.8fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Search</label>
          <input
            value={reviewSearch}
            onChange={(e) => {
              setReviewSearch(e.target.value);
              setPage(1);
            }}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Search reviews..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            Decision
          </label>
          <select
            value={decisionFilter}
            onChange={(e) => {
              setDecisionFilter(e.target.value as Decision | "All");
              setPage(1);
            }}
            title="Filter by decision"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="All">All</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            Order by
          </label>
          <select
            value={orderBy}
            onChange={(e) => {
              setOrderBy(e.target.value);
              setPage(1);
            }}
            title="Order reviews"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="reviewedAt">Review date</option>
            <option value="decision">Decision</option>
            <option value="createdAt">Created date</option>
          </select>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[640px]">
            <div className="grid grid-cols-[1.8fr_0.8fr_1.8fr_0.9fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
              <span>File Label</span>
              <span>Decision</span>
              <span>Feedbacks</span>
              <span>Reviewed At</span>
            </div>

            {reviewsLoading && (
              <div className="px-4 py-6 text-sm text-gray-500">
                Loading reviews...
              </div>
            )}

            {!reviewsLoading && reviewsError && (
              <div className="px-4 py-6 text-sm text-rose-600">
                {reviewsError}
              </div>
            )}

            {!reviewsLoading && !reviewsError && reviews.length === 0 && (
              <div className="px-4 py-6 text-sm text-gray-500">
                No reviews found.
              </div>
            )}

            {!reviewsLoading &&
              !reviewsError &&
              reviews.map((review) => (
>>>>>>> Stashed changes
                <div
                  key={task.id}
                  className="flex items-center justify-between px-4 py-3 text-sm"
                >
                  <div>
                    <p className="font-semibold text-gray-800">
                      {task.projectName}
                    </p>
                    <p className="text-xs text-gray-500">{task.dataset}</p>
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
                    <p className="mt-1 text-xs text-gray-500">
                      {task.qaReviewedAt || "-"}
                    </p>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b px-4 py-3">
            <h3 className="text-sm font-semibold text-gray-800">
              Top Error Categories
            </h3>
          </div>
          <div className="space-y-2 p-4">
            {Object.entries(metrics.errorCount).length === 0 ? (
              <p className="text-sm text-gray-500">
                No error categories available.
              </p>
            ) : (
              Object.entries(metrics.errorCount)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8)
                .map(([errorType, count]) => (
                  <div
                    key={errorType}
                    className="flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="text-gray-700">{errorType}</span>
                    <span className="font-semibold text-gray-800">{count}</span>
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
  tone: "green" | "red" | "amber" | "blue" | "purple";
}) {
  const styles = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    red: "border-rose-200 bg-rose-50 text-rose-700",
    amber: "border-amber-200 bg-amber-50 text-amber-700",
    blue: "border-blue-200 bg-blue-50 text-blue-700",
    purple: "border-violet-200 bg-violet-50 text-violet-700",
  } as const;

  return (
    <div className={`rounded-lg border px-4 py-3 ${styles[tone]}`}>
      <p className="text-xs font-semibold uppercase">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}
