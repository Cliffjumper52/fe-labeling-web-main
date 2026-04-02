import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import {
  createLabelCategory,
  deleteCategory,
  getLabelCategoryStatistics,
  getLabelCategoriesPaginated,
  updateLabelCategory,
} from "../../services/label-category-service.service";
import { ConfirmButton } from "../../components/common/confirm-modal";
import StatisticsSummary from "../../components/common/statistics-summary";

type ApiEnvelope<T> = { data?: T; message?: string | string[] };
type PaginatedPayload<T> = {
  data: T[];
  totalPages?: number;
  currentPage?: number;
};

type CategoryItem = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
};

type CategoryForm = {
  name: string;
  description: string;
};

const defaultForm: CategoryForm = {
  name: "",
  description: "",
};

const normalize = <T,>(raw: unknown): PaginatedPayload<T> => {
  const env = raw as ApiEnvelope<PaginatedPayload<T>>;
  return {
    data: env?.data?.data ?? [],
    totalPages: env?.data?.totalPages,
    currentPage: env?.data?.currentPage,
  };
};

const formatAverage = (value: number | string | null | undefined): string => {
  const numericValue = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numericValue)) {
    return "-";
  }

  return numericValue.toFixed(2);
};

export default function AdminLabelCategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CategoryForm>(defaultForm);

  const [detailItem, setDetailItem] = useState<CategoryItem | null>(null);
  const [closingDetail, setClosingDetail] = useState(false);

  const [editing, setEditing] = useState<CategoryItem | null>(null);
  const [editForm, setEditForm] = useState<CategoryForm>(defaultForm);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );
  const [statisticsRefreshKey, setStatisticsRefreshKey] = useState(0);

  const fetchCategories = async (nextPage = page) => {
    setLoading(true);
    try {
      const resp = await getLabelCategoriesPaginated({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        orderBy: "createdAt",
        order: "DESC",
      });
      const payload = normalize<CategoryItem>(resp);
      setCategories(payload.data);
      setPage(payload.currentPage ?? nextPage);
      setTotalPages(Math.max(1, payload.totalPages ?? 1));
    } catch {
      toast.error("Failed to load label categories");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories(1);
  }, []);

  const onCreateSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!createForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      await createLabelCategory({
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
      });
      toast.success("Category created");
      setIsCreateOpen(false);
      setCreateForm(defaultForm);
      setStatisticsRefreshKey((prev) => prev + 1);
      await fetchCategories(1);
    } catch {
      toast.error("Cannot create category");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: CategoryItem) => {
    setEditing(item);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
    });
  };

  const onEditSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (!editForm.name.trim()) {
      toast.error("Category name is required");
      return;
    }

    setSaving(true);
    try {
      await updateLabelCategory(editing.id, {
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
      });
      toast.success("Category updated");
      setEditing(null);
      setStatisticsRefreshKey((prev) => prev + 1);
      await fetchCategories(page);
    } catch {
      toast.error("Cannot update category");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      toast.success("Category deleted");
      setStatisticsRefreshKey((prev) => prev + 1);
      await fetchCategories(page);
    } catch {
      toast.error("Cannot delete category");
    }
  };

  const closeCreateModal = () => {
    setClosingModals((prev) => ({ ...prev, create: true }));
    window.setTimeout(() => {
      setIsCreateOpen(false);
      setCreateForm(defaultForm);
      setClosingModals((prev) => {
        const next = { ...prev };
        delete next["create"];
        return next;
      });
    }, 200);
  };

  const closeEditModal = () => {
    setClosingModals((prev) => ({ ...prev, edit: true }));
    window.setTimeout(() => {
      setEditing(null);
      setEditForm(defaultForm);
      setClosingModals((prev) => {
        const next = { ...prev };
        delete next["edit"];
        return next;
      });
    }, 200);
  };

  const closeDetailModal = () => {
    setClosingDetail(true);
    window.setTimeout(() => {
      setDetailItem(null);
      setClosingDetail(false);
    }, 200);
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">
          Label Categories
        </h2>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          onClick={() => setIsCreateOpen(true)}
        >
          New Category
        </button>
      </div>

      <StatisticsSummary
        className="mb-4"
        fetchStatistics={getLabelCategoryStatistics}
        refreshKey={statisticsRefreshKey}
        cards={[
          { key: "totalCategories", label: "Total categories" },
          { key: "categoriesWithLabels", label: "With labels" },
          {
            key: "avgLabelsPerCategory",
            label: "Avg labels/category",
            formatValue: formatAverage,
          },
          {
            key: "avgCategoriesPerLabel",
            label: "Avg categories/label",
            formatValue: formatAverage,
          },
        ]}
      />

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search categories..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
          onClick={() => void fetchCategories(1)}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Name</span>
          <span>Description</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            Loading categories...
          </div>
        ) : categories.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No categories found.
          </div>
        ) : (
          categories.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1fr_2fr_1fr_1fr] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-medium text-gray-800">{item.name}</span>
              <span className="truncate text-gray-700">
                {item.description || "-"}
              </span>
              <span className="text-gray-500">
                {new Date(item.createdAt).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                  onClick={() => setDetailItem(item)}
                >
                  Details
                </button>
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>
                <ConfirmButton
                  label="Delete"
                  variant="danger"
                  size="sm"
                  className="!h-auto !border-0 !bg-transparent !p-0 text-red-600 hover:text-red-700 hover:!bg-transparent"
                  modalHeader="Delete this category?"
                  modalBody={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
                  confirmLabel="Delete"
                  onConfirm={() => onDelete(item.id)}
                />
              </div>
            </div>
          ))
        )}
      </div>

      <div className="mt-4 flex items-center justify-end gap-2">
        <button
          type="button"
          disabled={page <= 1}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => void fetchCategories(page - 1)}
        >
          Prev
        </button>
        <span className="text-sm text-gray-600">
          Page {page} / {totalPages}
        </span>
        <button
          type="button"
          disabled={page >= totalPages}
          className="rounded-md border border-gray-300 px-3 py-1 text-sm disabled:opacity-50"
          onClick={() => void fetchCategories(page + 1)}
        >
          Next
        </button>
      </div>

      {/* Detail Modal */}
      {detailItem && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm transition-opacity duration-200 ${closingDetail ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-full max-w-md rounded-xl bg-white shadow-2xl transition-transform duration-200 ${closingDetail ? "scale-95" : "scale-100"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-teal-600 to-teal-500 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-bold text-sm">
                  {detailItem.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{detailItem.name}</p>
                  <p className="text-xs text-teal-100">Label Category</p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Close"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-3">
              {/* Description */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{detailItem.description || <span className="italic text-gray-400">No description</span>}</p>
              </div>

              {/* Created & ID */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Created</p>
                  <p className="text-sm text-gray-700">{new Date(detailItem.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Category ID</p>
                  <p className="break-all font-mono text-xs text-gray-600">{detailItem.id}</p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end border-t border-gray-100 px-5 py-3">
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${closingModals.create ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-96 rounded-lg bg-white p-6 shadow-lg transition-transform duration-200 ${closingModals.create ? "scale-95" : "scale-100"}`}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Create Label Category
            </h3>
            <form onSubmit={onCreateSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={createForm.name}
                  onChange={(e) =>
                    setCreateForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter category name"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={createForm.description}
                  onChange={(e) =>
                    setCreateForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeCreateModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editing && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${closingModals.edit ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-96 rounded-lg bg-white p-6 shadow-lg transition-transform duration-200 ${closingModals.edit ? "scale-95" : "scale-100"}`}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Edit Label Category
            </h3>
            <form onSubmit={onEditSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Enter category name"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  value={editForm.description}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="Enter description (optional)"
                  rows={3}
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={closeEditModal}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  {saving ? "Updating..." : "Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
