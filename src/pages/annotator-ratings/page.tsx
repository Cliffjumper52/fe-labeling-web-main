import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context.context";
import type { Account } from "../../interface/account/account.interface";
import type { AccountRating } from "../../interface/account-rating/account-rating.interface";
import type { AccountRatingHistory } from "../../interface/account-rating-history/account-rating-history.interface";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import { getAllAccountRatingHistories } from "../../services/account-rating-history-service.service";
import { getAllAccountRatings } from "../../services/account-rating-service.service";

const unwrapAxiosData = (payload: unknown): unknown => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
};

const unwrapApiResponse = <T,>(payload: unknown): T | null => {
  const unwrapped = unwrapAxiosData(payload);
  if (!unwrapped || typeof unwrapped !== "object") {
    return unwrapped as T;
  }
  if ("success" in unwrapped && "data" in unwrapped) {
    return (unwrapped as ApiResponse<T>).data;
  }
  return unwrapped as T;
};

const extractArray = <T,>(payload: unknown): T[] => {
  const data = unwrapApiResponse<T[] | { data?: T[] }>(payload);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object" && Array.isArray(data.data)) {
    return data.data;
  }
  return [];
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  return error instanceof Error ? error.message : fallback;
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const calculateScore = (totalPenalty: number, totalLabelsAssigned: number) => {
  if (totalLabelsAssigned <= 0) {
    return 100;
  }

  return 100 - totalPenalty / totalLabelsAssigned;
};

type ReviewErrorBreakdownItem = {
  name: string;
  count: number;
  severity: string;
  totalImpact: number;
  description?: string;
};

type ParsedReviewError = {
  totalFileLabeled: number;
  errorCount: number;
  totalPenalty: number;
  breakdown: ReviewErrorBreakdownItem[];
};

const parseReviewError = (value: unknown): ParsedReviewError | null => {
  if (!value || typeof value !== "object") {
    return null;
  }

  const raw = value as {
    totalFileLabeled?: unknown;
    errorCount?: unknown;
    totalPenalty?: unknown;
    breakdown?: unknown;
  };

  const breakdown = (Array.isArray(raw.breakdown)
    ? raw.breakdown
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }

          const entry = item as {
            name?: unknown;
            count?: unknown;
            severity?: unknown;
            totalImpact?: unknown;
            description?: unknown;
          };

          return {
            name: typeof entry.name === "string" ? entry.name : "Unknown",
            count: Number(entry.count ?? 0),
            severity:
              typeof entry.severity === "string" ? entry.severity : "unknown",
            totalImpact: Number(entry.totalImpact ?? 0),
            description:
              typeof entry.description === "string"
                ? entry.description
                : undefined,
          } satisfies ReviewErrorBreakdownItem;
        })
        .filter((item) => item !== null)
    : []) as ReviewErrorBreakdownItem[];

  return {
    totalFileLabeled: Number(raw.totalFileLabeled ?? 0),
    errorCount: Number(raw.errorCount ?? 0),
    totalPenalty: Number(raw.totalPenalty ?? 0),
    breakdown,
  };
};

const getProjectDisplay = (rating: AccountRating) => {
  const project = rating.project as
    | { id?: string; name?: string; imageUrl?: string | null }
    | undefined;

  return {
    id: project?.id ?? rating.projectId,
    name: project?.name ?? `Project ${rating.projectId.slice(0, 8)}`,
    imageUrl: project?.imageUrl ?? null,
  };
};

export default function Page() {
  const { getUserInfo, setUserInfo } = useAuth();
  const [currentUser, setCurrentUser] = useState<Account | null>(null);
  const [userLoading, setUserLoading] = useState(true);

  const [ratings, setRatings] = useState<AccountRating[]>([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState<string | null>(null);

  const [selectedRating, setSelectedRating] = useState<AccountRating | null>(
    null,
  );
  const [histories, setHistories] = useState<AccountRatingHistory[]>([]);
  const [historiesLoading, setHistoriesLoading] = useState(false);
  const [historiesError, setHistoriesError] = useState<string | null>(null);

  const selectedProject = useMemo(() => {
    if (!selectedRating) {
      return null;
    }
    return getProjectDisplay(selectedRating);
  }, [selectedRating]);

  useEffect(() => {
    const loadCurrentUser = async () => {
      setUserLoading(true);
      try {
        let user = getUserInfo();
        if (!user) {
          await setUserInfo();
          user = getUserInfo();
        }
        setCurrentUser(user);
      } finally {
        setUserLoading(false);
      }
    };

    void loadCurrentUser();
  }, [getUserInfo, setUserInfo]);

  useEffect(() => {
    if (!currentUser?.id) {
      setRatings([]);
      return;
    }

    const loadRatings = async () => {
      setRatingsLoading(true);
      setRatingsError(null);
      try {
        const response = await getAllAccountRatings({
          accountId: currentUser.id,
          sortBy: "createdAt",
          order: "DESC",
        });
        setRatings(extractArray<AccountRating>(response));
      } catch (error) {
        setRatingsError(extractErrorMessage(error, "Failed to load ratings."));
        setRatings([]);
      } finally {
        setRatingsLoading(false);
      }
    };

    void loadRatings();
  }, [currentUser?.id]);

  const handleOpenDetail = async (rating: AccountRating) => {
    setSelectedRating(rating);
    setHistoriesLoading(true);
    setHistoriesError(null);
    try {
      const response = await getAllAccountRatingHistories({
        accountRatingId: rating.id,
        order: "DESC",
      });
      setHistories(extractArray<AccountRatingHistory>(response));
    } catch (error) {
      setHistoriesError(
        extractErrorMessage(error, "Failed to load rating history."),
      );
      setHistories([]);
    } finally {
      setHistoriesLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedRating(null);
    setHistories([]);
    setHistoriesError(null);
  };

  return (
    <div className="w-full bg-gray-50 px-6 py-6">
      <div className="mx-auto w-full max-w-6xl space-y-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <h1 className="text-lg font-semibold text-gray-900">My ratings</h1>
          <p className="mt-1 text-sm text-gray-500">
            Review your rating per project and inspect historical score changes.
          </p>
        </div>

        {userLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
            Loading user info...
          </div>
        ) : !currentUser?.id ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm">
            Unable to resolve current user from auth context.
          </div>
        ) : ratingsLoading ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
            Loading ratings...
          </div>
        ) : ratingsError ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-4 text-sm text-rose-700 shadow-sm">
            {ratingsError}
          </div>
        ) : ratings.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white px-4 py-8 text-center text-sm text-gray-500 shadow-sm">
            No ratings found for your account.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {ratings.map((rating) => {
              const project = getProjectDisplay(rating);
              return (
                <div
                  key={rating.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-14 w-14 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                        {project.imageUrl ? (
                          <img
                            src={project.imageUrl}
                            alt={project.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                            No image
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {project.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          Rated at {formatDateTime(rating.updatedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-700">
                      <span>Score: {rating.ratingScore}</span>
                      <span>Files: {rating.totalFileLabeled}</span>
                      <span>Errors: {rating.errorCount}</span>
                      <button
                        type="button"
                        onClick={() => void handleOpenDetail(rating)}
                        className="rounded-md border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        Detail
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedRating && selectedProject && (
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4"
          onClick={closeDetail}
        >
          <div
            className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-xl border border-gray-300 bg-white shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex shrink-0 items-center justify-between border-b px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Rating detail
              </h2>
              <button
                type="button"
                onClick={closeDetail}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto">
              <div className="space-y-4 p-4">
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Project info
                  </p>
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                      {selectedProject.imageUrl ? (
                        <img
                          src={selectedProject.imageUrl}
                          alt={selectedProject.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                          No image
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">
                        {selectedProject.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Project ID: {selectedProject.id}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">
                    Account rating
                  </p>
                  <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-2">
                    <span>Score: {selectedRating.ratingScore}</span>
                    <span>
                      Files labeled: {selectedRating.totalFileLabeled}
                    </span>
                    <span>Error count: {selectedRating.errorCount}</span>
                    <span>
                      Updated: {formatDateTime(selectedRating.updatedAt)}
                    </span>
                  </div>
                  {selectedRating.feedbacks && (
                    <p className="mt-2 text-sm text-gray-600">
                      Feedback: {selectedRating.feedbacks}
                    </p>
                  )}
                </div>

                <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="text-sm font-semibold text-blue-800">
                    Scoring method
                  </p>
                  <p className="mt-1 text-xs text-blue-700">
                    <span className="font-mono font-semibold">
                      Score = 100 &minus; (Total Penalty / Total Labels
                      Assigned)
                    </span>
                  </p>
                  <p className="mt-2 text-[11px] text-blue-600">
                    The final score subtracts average penalty per assigned
                    label. If assigned labels is 0, score defaults to 100.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
                  <p className="text-sm font-semibold text-gray-800">
                    History stacks
                  </p>
                  {historiesLoading ? (
                    <p className="mt-2 text-sm text-gray-500">
                      Loading history...
                    </p>
                  ) : historiesError ? (
                    <p className="mt-2 text-sm text-rose-600">
                      {historiesError}
                    </p>
                  ) : histories.length === 0 ? (
                    <p className="mt-2 text-sm text-gray-500">
                      No history records.
                    </p>
                  ) : (
                    <div className="mt-2 space-y-2">
                      {histories.map((history) => (
                        <div
                          key={history.id}
                          className="rounded-md border border-gray-200 bg-white px-3 py-2"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-gray-500">
                            <span>{formatDateTime(history.changedAt)}</span>
                            <span>
                              {history.previousRatingScore} →{" "}
                              {history.newRatingScore}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-700">
                            {history.changeReason || "No reason provided"}
                          </p>
                          {(() => {
                            const reviewError = parseReviewError(
                              history.reviewError,
                            );
                            if (!reviewError) {
                              return null;
                            }

                            return (
                              <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-2">
                                <p className="text-xs font-semibold text-gray-700">
                                  Review error summary
                                </p>
                                <div className="mt-1 flex flex-wrap gap-3 text-[11px] text-gray-600">
                                  <span>
                                    Files: {reviewError.totalFileLabeled}
                                  </span>
                                  <span>Errors: {reviewError.errorCount}</span>
                                  <span>
                                    Penalty: {reviewError.totalPenalty}
                                  </span>
                                </div>
                                <p className="mt-1 font-mono text-[11px] text-gray-500">
                                  100 &minus; ({reviewError.totalPenalty} /{" "}
                                  {reviewError.totalFileLabeled}) ={" "}
                                  {calculateScore(
                                    reviewError.totalPenalty,
                                    reviewError.totalFileLabeled,
                                  ).toFixed(2)}
                                </p>
                                {reviewError.breakdown.length > 0 && (
                                  <div className="mt-2 space-y-1">
                                    {reviewError.breakdown.map(
                                      (item, index) => (
                                        <div
                                          key={`${history.id}-breakdown-${index}`}
                                          className="rounded border border-gray-200 bg-white px-2 py-1"
                                        >
                                          <p className="text-xs font-semibold text-gray-700">
                                            {item.name} ({item.severity})
                                          </p>
                                          <p className="text-[11px] text-gray-600">
                                            Count: {item.count} • Impact:{" "}
                                            {item.totalImpact}
                                          </p>
                                          {item.description && (
                                            <p className="text-[11px] text-gray-500">
                                              {item.description}
                                            </p>
                                          )}
                                        </div>
                                      ),
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
