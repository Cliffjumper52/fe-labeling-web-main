import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { ReviewErrorType } from "../../interface/review-error-type/review-error-type.interface";
import { Severity } from "../../interface/review-error-type/enums/severity.enums";
import type { CreateReviewErrorTypeDto } from "../../interface/review-error-type/dtos/create-review-error-type.dto";
import type { UpdateReviewErrorTypeDto } from "../../interface/review-error-type/dtos/update-review-error-type.dto";
import {
  createReviewErrorType,
  deleteReviewErrorType,
  getReviewErrorTypesPaginated,
  restoreReviewErrorType,
  updateReviewErrorType,
} from "../../services/review-error-type-service.service";
import Pagination from "../../components/common/pagination";

const PAGE_LIMIT = 10;

interface PaginatedReviewErrorTypePayload {
  data?: ReviewErrorType[];
  totalPages?: number;
  currentPage?: number;
  limit?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
}

const extractPaginatedData = (
  payload: unknown,
): { items: ReviewErrorType[]; totalPages: number } => {
  const apiResponse = payload as ApiResponse<PaginatedReviewErrorTypePayload>;
  const data = apiResponse?.data;
  const items = Array.isArray(data?.data) ? data.data : [];
  const totalPages = data?.totalPages ?? 1;
  return { items, totalPages };
};

const getErrorMessage = (error: unknown, fallback: string): string => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
  if (typeof message === "string" && message.trim()) {
    return message;
  }
  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }
  return fallback;
};

const severityBadge = (severity: ReviewErrorType["severity"]): string => {
  if (severity === Severity.CRITICAL) return "bg-rose-100 text-rose-700";
  if (severity === Severity.MAJOR) return "bg-orange-100 text-orange-700";
  if (severity === Severity.MODERATE) return "bg-amber-100 text-amber-700";
  if (severity === Severity.MINOR) return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
};

const formatDate = (value: string | null): string => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString();
};

type DeleteModalState = {
  id: string;
  type: "soft" | "hard";
  name: string;
};

export default function Page() {
  const [items, setItems] = useState<ReviewErrorType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [reloadToken, setReloadToken] = useState(0);

  const [search, setSearch] = useState("");
  const [searchBy, setSearchBy] = useState<
    "name" | "description" | "scoreImpact"
  >("name");
  const [severityFilter, setSeverityFilter] = useState<Severity | "All">("All");
  const [orderBy, setOrderBy] = useState<
    "createdAt" | "updatedAt" | "name" | "description" | "scoreImpact"
  >("createdAt");
  const [includeDeleted, setIncludeDeleted] = useState(false);

  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [createSeverity, setCreateSeverity] = useState<Severity>(
    Severity.MINOR,
  );
  const [createScoreImpact, setCreateScoreImpact] = useState("0");
  const [creating, setCreating] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSeverity, setEditSeverity] = useState<Severity>(Severity.MINOR);
  const [editScoreImpact, setEditScoreImpact] = useState("0");
  const [updating, setUpdating] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const [deleteModal, setDeleteModal] = useState<DeleteModalState | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [rowActionId, setRowActionId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await getReviewErrorTypesPaginated(
          {
            page,
            limit: PAGE_LIMIT,
            order: "DESC",
            orderBy,
            search: search.trim() || undefined,
            searchBy,
            severity: severityFilter === "All" ? undefined : severityFilter,
          },
          includeDeleted,
        );

        if (cancelled) return;

        const { items: fetched, totalPages: pages } =
          extractPaginatedData(response);
        setItems(fetched);
        setTotalPages(pages > 0 ? pages : 1);
      } catch (err) {
        if (!cancelled) {
          setItems([]);
          setTotalPages(1);
          setError(getErrorMessage(err, "Failed to load review error types."));
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [
    includeDeleted,
    orderBy,
    page,
    reloadToken,
    search,
    searchBy,
    severityFilter,
  ]);

  const counters = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.total += 1;
        if (item.deletedAt) {
          acc.deleted += 1;
        }
        if (
          item.severity === Severity.CRITICAL ||
          item.severity === Severity.MAJOR
        ) {
          acc.highImpact += 1;
        }
        return acc;
      },
      { total: 0, deleted: 0, highImpact: 0 },
    );
  }, [items]);

  const resetCreateForm = () => {
    setCreateName("");
    setCreateDescription("");
    setCreateSeverity(Severity.MINOR);
    setCreateScoreImpact("0");
  };

  const refetchData = () => {
    setReloadToken((prev) => prev + 1);
  };

  const startEdit = (item: ReviewErrorType) => {
    setEditingId(item.id);
    setEditName(item.name);
    setEditDescription(item.description ?? "");
    setEditSeverity(item.severity as Severity);
    setEditScoreImpact(String(item.scoreImpact));
    setIsEditModalOpen(true);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDescription("");
    setEditSeverity(Severity.MINOR);
    setEditScoreImpact("0");
    setIsEditModalOpen(false);
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSuccess(null);

    const scoreImpact = Number(createScoreImpact);
    const name = createName.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!Number.isFinite(scoreImpact)) {
      setError("Score impact must be a valid number.");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const dto: CreateReviewErrorTypeDto = {
        name,
        description: createDescription.trim() || undefined,
        severity: createSeverity,
        scoreImpact,
      };

      await createReviewErrorType(dto);
      resetCreateForm();
      setSuccess("Created review error type.");
      setIsCreateModalOpen(false);
      setPage(1);
      refetchData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to create review error type."));
    } finally {
      setCreating(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingId) return;
    setSuccess(null);

    const scoreImpact = Number(editScoreImpact);
    const name = editName.trim();

    if (!name) {
      setError("Name is required.");
      return;
    }

    if (!Number.isFinite(scoreImpact)) {
      setError("Score impact must be a valid number.");
      return;
    }

    setUpdating(true);
    setError(null);

    try {
      const dto: UpdateReviewErrorTypeDto = {
        name,
        description: editDescription.trim() || undefined,
        severity: editSeverity,
        scoreImpact,
      };

      await updateReviewErrorType(editingId, dto);
      cancelEdit();
      setSuccess("Updated review error type.");
      refetchData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update review error type."));
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async (id: string, type: "soft" | "hard") => {
    setSuccess(null);
    setDeleting(true);
    setError(null);

    try {
      await deleteReviewErrorType(id, type);
      setSuccess(
        type === "hard"
          ? "Hard deleted review error type."
          : "Soft deleted review error type.",
      );
      setDeleteModal(null);
      refetchData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to delete review error type."));
    } finally {
      setDeleting(false);
    }
  };

  const handleRestore = async (id: string) => {
    setSuccess(null);
    setRowActionId(id);
    setError(null);

    try {
      await restoreReviewErrorType(id);
      setSuccess("Restored review error type.");
      refetchData();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to restore review error type."));
    } finally {
      setRowActionId(null);
    }
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Review Error Types
            </h2>
            <p className="text-sm text-gray-500">
              Manage review error type catalog for reviewer feedback.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              resetCreateForm();
              setIsCreateModalOpen(true);
            }}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            New error type
          </button>
        </div>
      </div>

      {(error || success) && (
        <div className="mb-4 space-y-2">
          {error && (
            <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {error}
            </div>
          )}
          {success && (
            <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              {success}
            </div>
          )}
        </div>
      )}

      <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Current page items
          </p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {counters.total}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Deleted in page
          </p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {counters.deleted}
          </p>
        </div>
        <div className="rounded-lg border border-gray-200 px-4 py-3">
          <p className="text-xs font-semibold uppercase text-gray-500">
            Major + Critical
          </p>
          <p className="mt-1 text-xl font-semibold text-gray-900">
            {counters.highImpact}
          </p>
        </div>
      </div>

      <div className="mb-4 grid grid-cols-1 gap-3 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          placeholder="Search..."
        />
        <select
          value={searchBy}
          onChange={(event) => {
            setSearchBy(
              event.target.value as "name" | "description" | "scoreImpact",
            );
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="name">Search by name</option>
          <option value="description">Search by description</option>
          <option value="scoreImpact">Search by score impact</option>
        </select>
        <select
          value={severityFilter}
          onChange={(event) => {
            setSeverityFilter(event.target.value as Severity | "All");
            setPage(1);
          }}
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="All">All severities</option>
          {Object.values(Severity).map((severity) => (
            <option key={severity} value={severity}>
              {severity}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-2">
          <select
            value={orderBy}
            onChange={(event) => {
              setOrderBy(
                event.target.value as
                  | "createdAt"
                  | "updatedAt"
                  | "name"
                  | "description"
                  | "scoreImpact",
              );
              setPage(1);
            }}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="createdAt">Order by created date</option>
            <option value="updatedAt">Order by updated date</option>
            <option value="name">Order by name</option>
            <option value="description">Order by description</option>
            <option value="scoreImpact">Order by score impact</option>
          </select>
          <label className="inline-flex items-center gap-1 text-xs text-gray-700">
            <input
              type="checkbox"
              checked={includeDeleted}
              onChange={(event) => {
                setIncludeDeleted(event.target.checked);
                setPage(1);
              }}
            />
            Include deleted
          </label>
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <div className="min-w-[980px]">
            <div className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1.8fr_0.9fr_0.8fr_1.6fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
              <span>Name</span>
              <span>Severity</span>
              <span>Impact</span>
              <span>Description</span>
              <span>Updated</span>
              <span>Status</span>
              <span>Action</span>
            </div>

            {isLoading && (
              <div className="px-4 py-6 text-sm text-gray-500">
                Loading review error types...
              </div>
            )}

            {!isLoading && items.length === 0 && !error && (
              <div className="px-4 py-6 text-sm text-gray-500">
                No review error types found.
              </div>
            )}

            {!isLoading &&
              items.map((item) => {
                const isDeleted = Boolean(item.deletedAt);
                const isRowBusy = rowActionId === item.id;

                return (
                  <div
                    key={item.id}
                    className="grid grid-cols-[1.4fr_0.8fr_0.8fr_1.8fr_0.9fr_0.8fr_1.6fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
                  >
                    <div>
                      <p className="font-medium text-gray-800">{item.name}</p>
                      <p className="text-xs text-gray-500">
                        {item.id.slice(0, 12)}...
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${severityBadge(item.severity)}`}
                    >
                      {item.severity}
                    </span>

                    <span>{item.scoreImpact}</span>

                    <p className="line-clamp-2 text-xs text-gray-600">
                      {item.description ?? "--"}
                    </p>

                    <span className="text-xs text-gray-500">
                      {formatDate(item.updatedAt)}
                    </span>

                    <span
                      className={`w-fit rounded-full px-2 py-0.5 text-xs font-semibold ${
                        isDeleted
                          ? "bg-rose-100 text-rose-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isDeleted ? "Deleted" : "Active"}
                    </span>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {!isDeleted && (
                        <button
                          type="button"
                          onClick={() => startEdit(item)}
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700"
                        >
                          Edit
                        </button>
                      )}

                      {!isDeleted ? (
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => {
                            setDeleteModal({
                              id: item.id,
                              type: "soft",
                              name: item.name,
                            });
                          }}
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                        >
                          Soft delete
                        </button>
                      ) : (
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => {
                            void handleRestore(item.id);
                          }}
                          className="rounded-md border border-emerald-300 px-2 py-1 text-xs font-semibold text-emerald-700 disabled:opacity-50"
                        >
                          Restore
                        </button>
                      )}

                      {(includeDeleted || isDeleted) && (
                        <button
                          type="button"
                          disabled={isRowBusy}
                          onClick={() => {
                            setDeleteModal({
                              id: item.id,
                              type: "hard",
                              name: item.name,
                            });
                          }}
                          className="rounded-md border border-rose-300 px-2 py-1 text-xs font-semibold text-rose-700 disabled:opacity-50"
                        >
                          Hard delete
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
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

      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
            <h3 className="mb-3 text-base font-semibold text-gray-800">
              Create Review Error Type
            </h3>
            <form
              onSubmit={(event) => {
                void handleCreate(event);
              }}
              className="space-y-3"
            >
              <input
                value={createName}
                onChange={(event) => setCreateName(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Name"
              />
              <input
                value={createDescription}
                onChange={(event) => setCreateDescription(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Description"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={createSeverity}
                  onChange={(event) =>
                    setCreateSeverity(event.target.value as Severity)
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.values(Severity).map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={createScoreImpact}
                  onChange={(event) => setCreateScoreImpact(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Score impact"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-2xl rounded-lg bg-white p-4 shadow-xl">
            <h3 className="mb-3 text-base font-semibold text-gray-800">
              Update Review Error Type
            </h3>
            <div className="space-y-3">
              <input
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Name"
              />
              <input
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Description"
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <select
                  value={editSeverity}
                  onChange={(event) =>
                    setEditSeverity(event.target.value as Severity)
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  {Object.values(Severity).map((severity) => (
                    <option key={severity} value={severity}>
                      {severity}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  value={editScoreImpact}
                  onChange={(event) => setEditScoreImpact(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Score impact"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={cancelEdit}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={updating}
                  onClick={() => {
                    void handleUpdate();
                  }}
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {updating ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {deleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-4 shadow-xl">
            <h3 className="text-base font-semibold text-gray-800">
              Confirm {deleteModal.type === "hard" ? "Hard" : "Soft"} Delete
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              {deleteModal.type === "hard"
                ? `Permanently delete "${deleteModal.name}"? This cannot be undone.`
                : `Soft delete "${deleteModal.name}"?`}
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteModal(null)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={() => {
                  void handleDelete(deleteModal.id, deleteModal.type);
                }}
                className="rounded-md border border-rose-300 px-3 py-2 text-sm font-semibold text-rose-700 disabled:opacity-50"
              >
                {deleting ? "Deleting..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
