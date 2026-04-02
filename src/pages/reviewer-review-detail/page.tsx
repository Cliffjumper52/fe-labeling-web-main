import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { EntityReference } from "../../interface/common/base-entity.interface";
import type { Review } from "../../interface/review/review.interface";
import type { ReviewError } from "../../interface/review-error/review-error.interface";
import { getReviewById } from "../../services/review-service.service";

const extractReview = (payload: unknown): Review | null => {
  const apiResponse = payload as ApiResponse<Review>;
  if (apiResponse && typeof apiResponse === "object" && "data" in apiResponse) {
    return apiResponse.data ?? null;
  }

  if (payload && typeof payload === "object") {
    return payload as Review;
  }

  return null;
};

type NormalizedReviewError = {
  id: string;
  reviewErrorTypeId?: string;
  reviewErrorTypeName?: string;
  reviewErrorTypeDescription?: string | null;
  reviewErrorTypeSeverity?: string;
  reviewErrorTypeScoreImpact?: number;
  description?: string | null;
  errorLocation?: Record<string, unknown> | null;
};

type FileLabelContext = {
  fileName?: string;
  fileUrl?: string;
  fileStatus?: string;
  labelName?: string;
  labelDescription?: string;
  labelColor?: string;
};

const normalizeReviewError = (
  item: ReviewError | EntityReference,
): NormalizedReviewError => {
  const full = item as Partial<ReviewError>;
  const errorType = full.reviewErrorType as
    | {
        id?: unknown;
        name?: unknown;
        description?: unknown;
        severity?: unknown;
        scoreImpact?: unknown;
      }
    | undefined;

  return {
    id: item.id,
    reviewErrorTypeId:
      typeof full.reviewErrorTypeId === "string"
        ? full.reviewErrorTypeId
        : undefined,
    reviewErrorTypeName:
      typeof errorType?.name === "string" ? errorType.name : undefined,
    reviewErrorTypeDescription:
      typeof errorType?.description === "string" ||
      errorType?.description === null
        ? errorType.description
        : undefined,
    reviewErrorTypeSeverity:
      typeof errorType?.severity === "string" ? errorType.severity : undefined,
    reviewErrorTypeScoreImpact:
      typeof errorType?.scoreImpact === "number"
        ? errorType.scoreImpact
        : undefined,
    description:
      typeof full.description === "string" || full.description === null
        ? full.description
        : undefined,
    errorLocation:
      full.errorLocation && typeof full.errorLocation === "object"
        ? full.errorLocation
        : null,
  };
};

const formatDateTime = (value: string | null): string => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleString();
};

const mapDecisionBadge = (decision: Review["decision"]): string => {
  if (decision === "approved") return "bg-emerald-100 text-emerald-700";
  if (decision === "rejected") return "bg-rose-100 text-rose-700";
  return "bg-amber-100 text-amber-700";
};

const mapSeverityBadge = (severity?: string): string => {
  if (severity === "critical") return "bg-rose-100 text-rose-700";
  if (severity === "high") return "bg-orange-100 text-orange-700";
  if (severity === "moderate") return "bg-amber-100 text-amber-700";
  if (severity === "low") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
};

const extractFileLabelContext = (review: Review): FileLabelContext | null => {
  const fileLabel = review.fileLabel as
    | {
        file?: {
          fileName?: unknown;
          fileUrl?: unknown;
          status?: unknown;
        };
        label?: {
          name?: unknown;
          description?: unknown;
          color?: unknown;
        };
      }
    | undefined;

  if (!fileLabel || typeof fileLabel !== "object") {
    return null;
  }

  return {
    fileName:
      typeof fileLabel.file?.fileName === "string"
        ? fileLabel.file.fileName
        : undefined,
    fileUrl:
      typeof fileLabel.file?.fileUrl === "string"
        ? fileLabel.file.fileUrl
        : undefined,
    fileStatus:
      typeof fileLabel.file?.status === "string"
        ? fileLabel.file.status
        : undefined,
    labelName:
      typeof fileLabel.label?.name === "string"
        ? fileLabel.label.name
        : undefined,
    labelDescription:
      typeof fileLabel.label?.description === "string"
        ? fileLabel.label.description
        : undefined,
    labelColor:
      typeof fileLabel.label?.color === "string"
        ? fileLabel.label.color
        : undefined,
  };
};

export default function Page() {
  const { id } = useParams();
  const [review, setReview] = useState<Review | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadReviewDetail = async () => {
      if (!id) {
        setError("Invalid review ID.");
        setReview(null);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await getReviewById(id);
        if (cancelled) return;

        const extracted = extractReview(response);
        if (!extracted) {
          setReview(null);
          setError("Review not found.");
          return;
        }

        setReview(extracted);
      } catch (err) {
        if (!cancelled) {
          setReview(null);
          setError(
            err instanceof Error
              ? err.message
              : "Failed to load review detail.",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReviewDetail();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const reviewErrors = useMemo<NormalizedReviewError[]>(() => {
    if (!review?.reviewErrors?.length) {
      return [];
    }

    return review.reviewErrors
      .filter((item): item is ReviewError | EntityReference => {
        return Boolean(item && typeof item === "object" && "id" in item);
      })
      .map(normalizeReviewError);
  }, [review?.reviewErrors]);

  const fileLabelContext = useMemo(() => {
    if (!review) {
      return null;
    }

    return extractFileLabelContext(review);
  }, [review]);

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-5 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Review Detail</h2>
          <p className="text-sm text-gray-500">
            Inspect one submitted review and its attached review errors.
          </p>
        </div>
        <Link
          to="/reviewer/reviews"
          className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
        >
          Back to reports
        </Link>
      </div>

      {loading && (
        <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600">
          Loading review detail...
        </div>
      )}

      {!loading && error && (
        <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
          {error}
        </div>
      )}

      {!loading && !error && review && (
        <div className="space-y-5">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-gray-800">Summary</h3>
              <span
                className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${mapDecisionBadge(review.decision)}`}
              >
                {review.decision}
              </span>
            </div>

            <div className="mb-4 rounded-md border border-gray-100 bg-gray-50 p-3">
              <p className="mb-2 text-sm font-semibold text-gray-800">
                Labeled file
              </p>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
                  {fileLabelContext?.fileUrl ? (
                    <img
                      src={fileLabelContext.fileUrl}
                      alt={fileLabelContext.fileName ?? "File preview"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">
                      No image
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-gray-900">
                    {fileLabelContext?.fileName ?? "--"}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-md border border-gray-200 bg-white px-2 py-1 text-gray-700">
                      Status: {fileLabelContext?.fileStatus ?? "--"}
                    </span>
                    <span
                      className="rounded-md border px-2 py-1"
                      style={{
                        borderColor: fileLabelContext?.labelColor ?? "#d1d5db",
                        color: fileLabelContext?.labelColor ?? "#374151",
                        backgroundColor: "#ffffff",
                      }}
                    >
                      Label: {fileLabelContext?.labelName ?? "--"}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    {fileLabelContext?.labelDescription ?? "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 text-sm text-gray-700 md:grid-cols-2">
              <p>
                <span className="font-semibold">Reviewer ID:</span>{" "}
                {review.reviewerId}
              </p>
              <p>
                <span className="font-semibold">Checklist Answer ID:</span>{" "}
                {review.checklistAnswerId ?? "--"}
              </p>
              <p>
                <span className="font-semibold">Reviewed At:</span>{" "}
                {formatDateTime(review.reviewedAt)}
              </p>
              <p>
                <span className="font-semibold">Created At:</span>{" "}
                {formatDateTime(review.createdAt)}
              </p>
            </div>

            <div className="mt-4 rounded-md border border-gray-100 bg-gray-50 p-3 text-sm text-gray-700">
              <p className="mb-1 font-semibold text-gray-800">Feedback</p>
              <p>{review.feedbacks?.trim() ? review.feedbacks : "--"}</p>
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="mb-3 text-base font-semibold text-gray-800">
              Review Errors ({reviewErrors.length})
            </h3>

            {reviewErrors.length === 0 ? (
              <p className="text-sm text-gray-500">
                No review errors attached to this review.
              </p>
            ) : (
              <div className="space-y-3">
                {reviewErrors.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-md border border-gray-200 bg-gray-50 p-3"
                  >
                    <p className="text-xs text-gray-500">Error ID: {item.id}</p>
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-semibold">Error Type:</span>{" "}
                      {item.reviewErrorTypeName ??
                        item.reviewErrorTypeId ??
                        "--"}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs">
                      <span
                        className={`rounded-full px-2 py-0.5 font-semibold capitalize ${mapSeverityBadge(item.reviewErrorTypeSeverity)}`}
                      >
                        {item.reviewErrorTypeSeverity ?? "unknown"}
                      </span>
                      {typeof item.reviewErrorTypeScoreImpact === "number" && (
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 font-semibold text-gray-700">
                          Impact: {item.reviewErrorTypeScoreImpact}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-semibold">Type Description:</span>{" "}
                      {item.reviewErrorTypeDescription?.trim()
                        ? item.reviewErrorTypeDescription
                        : "--"}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-semibold">Description:</span>{" "}
                      {item.description?.trim() ? item.description : "--"}
                    </p>
                    <p className="mt-1 text-sm text-gray-700">
                      <span className="font-semibold">Error Location:</span>{" "}
                      {item.errorLocation
                        ? JSON.stringify(item.errorLocation)
                        : "--"}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
