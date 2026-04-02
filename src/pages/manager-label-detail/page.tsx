import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { Role } from "../../interface/enums/domain.enums";
import type { Label as ApiLabel } from "../../interface/label/label.interface";
import type { LabelCategory } from "../../interface/label-category/label-category.interface";
import type { LabelChecklistQuestion } from "../../interface/label-checklist-question/label-checklist-question.interface";
import { getLabelById } from "../../services/label-service.service";
import { getAllCategories } from "../../services/label-category-service.service";
import { getAllLabelChecklistQuestions } from "../../services/label-checklist-question-service.service";

type UiLabelCategory = {
  id: string;
  name: string;
};

type UiQuestion = {
  id: string;
  text: string;
  description?: string;
  role: "Annotator" | "Reviewer";
  required: boolean;
};

type PaginationResult<T> = {
  data: T[];
  totalPages?: number;
  pageCount?: number;
};

const unwrapApiResponse = <T,>(payload: unknown): T | null => {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  if ("data" in payload) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
};

const extractArray = <T,>(payload: unknown): T[] => {
  const data = unwrapApiResponse<T[] | PaginationResult<T>>(payload);
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object") {
    const inner = data as PaginationResult<T>;
    if (Array.isArray(inner.data)) {
      return inner.data;
    }
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

const normalizeColor = (value: unknown): string | undefined => {
  return typeof value === "string" ? value : undefined;
};

const roleEnumToLabel = (role: Role): UiQuestion["role"] =>
  role === "reviewer" ? "Reviewer" : "Annotator";

const mapCategories = (
  categoryRefs: Array<{ id: string; name?: string }> | undefined,
  allCategories: LabelCategory[],
): UiLabelCategory[] => {
  if (!Array.isArray(categoryRefs)) {
    return [];
  }

  const categoryMap = new Map(
    allCategories.map((category) => [category.id, category.name]),
  );

  return categoryRefs
    .filter((category) => Boolean(category?.id))
    .map((category) => ({
      id: category.id,
      name: category.name ?? categoryMap.get(category.id) ?? "Unknown",
    }));
};

const mapQuestions = (questions: LabelChecklistQuestion[]): UiQuestion[] => {
  return questions
    .filter((question) => ["annotator", "reviewer"].includes(question.roleEnum))
    .map((question) => ({
      id: question.id,
      text: question.name,
      description: question.description ?? undefined,
      role: roleEnumToLabel(question.roleEnum),
      required: question.isRequired,
    }));
};

export default function ManagerLabelDetailPage() {
  const { id } = useParams();
  const [label, setLabel] = useState<ApiLabel | null>(null);
  const [categories, setCategories] = useState<LabelCategory[]>([]);
  const [questions, setQuestions] = useState<UiQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("Missing label id.");
      return;
    }

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const [labelResp, categoriesResp, questionsResp] = await Promise.all([
          getLabelById(id),
          getAllCategories({
            orderBy: "name",
            order: "ASC",
          }),
          getAllLabelChecklistQuestions({
            labelId: id,
            orderBy: "createdAt",
            order: "DESC",
          }),
        ]);

        if (cancelled) return;

        const labelData = unwrapApiResponse<ApiLabel>(labelResp);
        if (!labelData) {
          throw new Error("Label not found.");
        }

        const categoryData = extractArray<LabelCategory>(categoriesResp);
        const questionData = extractArray<LabelChecklistQuestion>(questionsResp);

        setLabel(labelData);
        setCategories(categoryData);
        setQuestions(mapQuestions(questionData));
      } catch (err) {
        if (!cancelled) {
          setLabel(null);
          setCategories([]);
          setQuestions([]);
          setError(extractErrorMessage(err, "Failed to load label details."));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const categoryChips = label
    ? mapCategories(
        (label.categories ?? []) as Array<{ id: string; name?: string }>,
        categories,
      )
    : [];

  const annotatorQuestions = useMemo(
    () => questions.filter((question) => question.role === "Annotator"),
    [questions],
  );

  const reviewerQuestions = useMemo(
    () => questions.filter((question) => question.role === "Reviewer"),
    [questions],
  );

  const labelColor = label
    ? normalizeColor((label as { color?: unknown }).color)
    : undefined;

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Link
              to="/manager/labels"
              className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600"
            >
              Back to labels
            </Link>
            <h2 className="mt-2 text-2xl font-semibold text-gray-900">
              Label details
            </h2>
          </div>
        </div>

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
            Loading label details...
          </div>
        ) : !label ? (
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
            No label found.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200"
                    style={{ backgroundColor: labelColor ?? "#f3f4f6" }}
                  >
                    <span className="h-3 w-3 rounded-full bg-white/80" />
                  </span>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {label.name}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {label.description || "No description provided."}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {categoryChips.length === 0 ? (
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
                      No category
                    </span>
                  ) : (
                    categoryChips.map((category) => (
                      <span
                        key={category.id}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                      >
                        {category.name}
                      </span>
                    ))
                  )}
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <div className="rounded-md border border-gray-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Created
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {label.createdAt}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Updated
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {label.updatedAt}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
                    Color
                  </p>
                  <p className="mt-2 text-sm font-semibold text-gray-800">
                    {labelColor ?? "--"}
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-900">
                  Checklist questions
                </h4>
                <span className="text-xs font-semibold text-gray-500">
                  {questions.length} total
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>Annotator</span>
                    <span>{annotatorQuestions.length}</span>
                  </div>
                  <div className="mt-2 min-h-[72px] rounded-md border border-dashed border-blue-200 p-3 text-xs text-blue-300">
                    {annotatorQuestions.length === 0 ? (
                      <div className="flex min-h-[48px] items-center justify-center">
                        No annotator questions yet
                      </div>
                    ) : (
                      <div className="space-y-2 text-blue-600">
                        {annotatorQuestions.map((question) => (
                          <div
                            key={question.id}
                            className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs text-blue-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-blue-700">
                                {question.text}
                              </span>
                              {question.required && (
                                <span className="rounded-full border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                  Required
                                </span>
                              )}
                            </div>
                            {question.description && (
                              <p className="mt-1 text-[11px] text-blue-500">
                                {question.description}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-semibold text-purple-600">
                    <span>Reviewer</span>
                    <span>{reviewerQuestions.length}</span>
                  </div>
                  <div className="mt-2 min-h-[72px] rounded-md border border-dashed border-purple-200 p-3 text-xs text-purple-300">
                    {reviewerQuestions.length === 0 ? (
                      <div className="flex min-h-[48px] items-center justify-center">
                        No reviewer questions yet
                      </div>
                    ) : (
                      <div className="space-y-2 text-purple-600">
                        {reviewerQuestions.map((question) => (
                          <div
                            key={question.id}
                            className="rounded-md border border-purple-100 bg-white px-3 py-2 text-xs text-purple-700"
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-purple-700">
                                {question.text}
                              </span>
                              {question.required && (
                                <span className="rounded-full border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                                  Required
                                </span>
                              )}
                            </div>
                            {question.description && (
                              <p className="mt-1 text-[11px] text-purple-500">
                                {question.description}
                              </p>
                            )}
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
    </div>
  );
}
