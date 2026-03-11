import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSearchParams } from "react-router-dom";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { Review } from "../../interface/review/review.interface";
import { Decision } from "../../interface/review/enums/decisions.enums";
import {
  getReviewerAggregationStats,
  getReviewsPaginated,
  type ReviewerAggregationStats,
} from "../../services/review-service.service";
import Pagination from "../../components/common/pagination";
import { useAuth } from "../../context/auth-context.context";

const PAGE_LIMIT = 20;

interface PaginatedReviewPayload {
  data?: Review[];
  items?: Review[];
  meta?: { totalPages?: number; pageCount?: number };
}

const extractReviews = (
  payload: unknown,
): { reviews: Review[]; totalPages: number } => {
  const outer = payload as { data?: PaginatedReviewPayload } | undefined;
  const inner = outer?.data;
  const reviews: Review[] = Array.isArray(inner?.data)
    ? (inner!.data as Review[])
    : Array.isArray(inner?.items)
      ? (inner!.items as Review[])
      : [];
  const totalPages = inner?.meta?.totalPages ?? inner?.meta?.pageCount ?? 1;
  return { reviews, totalPages };
};

const decisionBadge = (decision: Decision): string => {
  if (decision === Decision.APPROVED) return "bg-emerald-100 text-emerald-700";
  if (decision === Decision.REJECTED) return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

const formatDate = (value: string | null): string => {
  if (!value) return "--";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "--" : d.toLocaleDateString();
};
const EMPTY_STATS: ReviewerAggregationStats = {
  reviewerId: "",
  approved: 0,
  rejected: 0,
  totalReviewed: 0,
  approvalRate: 0,
  scoreImpact: 0,
};

const isReviewerStats = (value: unknown): value is ReviewerAggregationStats => {
  if (!value || typeof value !== "object") return false;

  const data = value as Partial<ReviewerAggregationStats>;
  return (
    typeof data.reviewerId === "string" &&
    typeof data.approved === "number" &&
    typeof data.rejected === "number" &&
    typeof data.totalReviewed === "number" &&
    typeof data.approvalRate === "number" &&
    typeof data.scoreImpact === "number"
  );
};

const normalizeStats = (
  payload: unknown,
  reviewerId: string,
): ReviewerAggregationStats => {
  const apiResponse = payload as ApiResponse<ReviewerAggregationStats>;
  const data = apiResponse?.data;

  if (isReviewerStats(data)) {
    return data;
  }

  if (isReviewerStats(payload)) {
    return payload;
  }

  return {
    ...EMPTY_STATS,
    reviewerId,
  };
};

const getErrorMessage = (error: unknown): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to load reviewer aggregation stats.";
};

export default function Page() {
  const { getUserInfo } = useAuth();
  const [currentUser] = useState(() => {
    try {
      return getUserInfo();
    } catch {
      return null;
    }
  });
  const [searchParams, setSearchParams] = useSearchParams();

  const [reviewerIdInput, setReviewerIdInput] = useState(currentUser?.id ?? "");
  const [stats, setStats] = useState<ReviewerAggregationStats>(EMPTY_STATS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reviewSearch, setReviewSearch] = useState("");
  const [decisionFilter, setDecisionFilter] = useState<Decision | "All">("All");
  const [orderBy, setOrderBy] = useState("reviewedAt");

  useEffect(() => {
    setReviewerIdInput(currentUser?.id ?? "");
  }, [currentUser]);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextReviewerId = reviewerIdInput.trim();
    const nextParams = new URLSearchParams(searchParams);

    if (!nextReviewerId) {
      nextParams.delete("reviewerId");
    } else {
      nextParams.set("reviewerId", nextReviewerId);
    }

    setSearchParams(nextParams);
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-5">
        <h2 className="text-xl font-semibold text-gray-800">Reviewer Stats</h2>
        <p className="text-sm text-gray-500">
          Aggregated review outcomes by reviewer ID.
        </p>
      </div>

      {error ? (
        <div className="mb-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`rounded-lg border px-4 py-3 ${card.className}`}
          >
            <div className="text-xs font-semibold uppercase tracking-wide">
              {card.title}
            </div>
            <div className="mt-2 text-2xl font-bold">
              {isLoading ? "..." : card.value}
            </div>
          </div>
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
            <option value={Decision.APPROVED}>Approved</option>
            <option value={Decision.REJECTED}>Rejected</option>
            <option value={Decision.PENDING}>Pending</option>
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
                <div
                  key={review.id}
                  className="grid grid-cols-[1.8fr_0.8fr_1.8fr_0.9fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
                >
                  <div>
                    <p className="truncate font-medium text-gray-800">
                      {review.fileLabelId.slice(0, 16)}…
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {review.id.slice(0, 12)}…
                    </p>
                  </div>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${decisionBadge(review.decision)}`}
                  >
                    {review.decision}
                  </span>
                  <p className="line-clamp-2 text-xs text-gray-600">
                    {review.feedbacks ?? "--"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(review.reviewedAt)}
                  </p>
                </div>
              ))}
          </div>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="mt-4 flex justify-end">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            onPageChange={setPage}
          />
        </div>
      )}
    </div>
  );
}
