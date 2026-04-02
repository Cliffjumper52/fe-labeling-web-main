import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { getReviewByChecklistAnswerId } from "../../services/review-service.service";

const extractErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return error instanceof Error ? error.message : fallback;
};

export default function Page() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveReview = async () => {
      const checklistId = searchParams.get("checklistId");

      if (!checklistId?.trim()) {
        setError("Missing checklistId query parameter.");
        return;
      }

      try {
        const review = await getReviewByChecklistAnswerId(checklistId.trim());

        if (cancelled) {
          return;
        }

        if (!review?.id) {
          setError("No review found for this checklist answer.");
          return;
        }

        navigate(`/reviewer/reviews/${review.id}`, { replace: true });
      } catch (resolveError) {
        if (!cancelled) {
          setError(
            extractErrorMessage(
              resolveError,
              "Failed to resolve review from checklist answer.",
            ),
          );
        }
      }
    };

    void resolveReview();

    return () => {
      cancelled = true;
    };
  }, [navigate, searchParams]);

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mx-auto max-w-2xl rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800">
          Resolving Review Detail
        </h2>
        {!error ? (
          <p className="mt-3 text-sm text-gray-600">
            Looking up the review for this checklist answer...
          </p>
        ) : (
          <>
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
            <div className="mt-4 flex gap-3">
              <Link
                to="/reviewer/reviews"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Back to reviews
              </Link>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                Retry
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
