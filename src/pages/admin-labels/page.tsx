import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import { getLabelCategoriesPaginated } from "../../services/label-category-service.service";
import {
  createLabel,
  deleteLabel,
  getLabelPaginated,
  updateLabel,
} from "../../services/label-service.service";

type ApiEnvelope<T> = { data?: T; message?: string | string[] };
type PaginatedPayload<T> = {
  data: T[];
  totalPages?: number;
  currentPage?: number;
};

type Category = { id: string; name: string };
type LabelItem = {
  id: string;
  name: string;
  description?: string;
  color?: string;
  categories?: Category[];
  createdAt: string;
};

type LabelForm = {
  name: string;
  description: string;
  color: string;
  categoryIds: string[];
};

const defaultForm: LabelForm = {
  name: "",
  description: "",
  color: "#22c55e",
  categoryIds: [],
};

const normalize = <T,>(raw: unknown): PaginatedPayload<T> => {
  const env = raw as ApiEnvelope<PaginatedPayload<T>>;
  return {
    data: env?.data?.data ?? [],
    totalPages: env?.data?.totalPages,
    currentPage: env?.data?.currentPage,
  };
};

export default function AdminLabelsPage() {
<<<<<<< Updated upstream
  const sampleLabels: {
    id: string;
    name: string;
    description: string;
    type: "Bounding Box" | "Polygon" | "Classification";
    totalClasses: number;
    createdAt: string;
  }[] = [
    {
      id: "label-1",
      name: "Vehicle Detection",
      description: "Cars, buses, trucks, bikes, and motorcycles.",
      type: "Bounding Box" as const,
      totalClasses: 5,
      createdAt: "2026-02-05",
    },
    {
      id: "label-2",
      name: "Road Markings",
      description: "Lane lines, crosswalks, and stop lines.",
      type: "Polygon" as const,
      totalClasses: 3,
      createdAt: "2026-01-18",
    },
    {
      id: "label-3",
      name: "CT Slice Quality",
      description: "Classify scan quality and artifact presence.",
      type: "Classification" as const,
      totalClasses: 4,
      createdAt: "2025-12-21",
    },
  ];

  return <ManagerLabelsPage mode="admin" initialLabels={sampleLabels} />;
=======
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<LabelForm>(defaultForm);

  const [editing, setEditing] = useState<LabelItem | null>(null);
  const [editForm, setEditForm] = useState<LabelForm>(defaultForm);

  const fetchCategories = async () => {
    try {
      const resp = await getLabelCategoriesPaginated({
        page: 1,
        limit: 200,
        orderBy: "createdAt",
        order: "DESC",
      });
      setCategories(normalize<Category>(resp).data);
    } catch {
      toast.error("Failed to load label categories");
    }
  };

  const fetchLabels = async (nextPage = page) => {
    setLoading(true);
    try {
      const resp = await getLabelPaginated({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        orderBy: "createdAt",
        order: "DESC",
      });
      const payload = normalize<LabelItem>(resp);
      setLabels(payload.data);
      setPage(payload.currentPage ?? nextPage);
      setTotalPages(Math.max(1, payload.totalPages ?? 1));
    } catch {
      toast.error("Failed to load labels");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchCategories();
    void fetchLabels(1);
  }, []);

  const toggleCategoryInCreate = (categoryId: string) => {
    setCreateForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const toggleCategoryInEdit = (categoryId: string) => {
    setEditForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(categoryId)
        ? prev.categoryIds.filter((id) => id !== categoryId)
        : [...prev.categoryIds, categoryId],
    }));
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (createForm.categoryIds.length === 0) {
      toast.error("Select at least one category");
      return;
    }

    setSaving(true);
    try {
      await createLabel(createForm);
      toast.success("Label created");
      setIsCreateOpen(false);
      setCreateForm(defaultForm);
      await fetchLabels(1);
    } catch {
      toast.error("Cannot create label");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: LabelItem) => {
    setEditing(item);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      color: item.color ?? "#22c55e",
      categoryIds: (item.categories ?? []).map((category) => category.id),
    });
  };

  const onUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (editForm.categoryIds.length === 0) {
      toast.error("Select at least one category");
      return;
    }

    setSaving(true);
    try {
      await updateLabel(editing.id, editForm);
      toast.success("Label updated");
      setEditing(null);
      await fetchLabels(page);
    } catch {
      toast.error("Cannot update label");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this label?")) return;
    try {
      await deleteLabel(id);
      toast.success("Label deleted");
      await fetchLabels(page);
    } catch {
      toast.error("Cannot delete label");
    }
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Labels</h2>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setIsCreateOpen(true)}
        >
          New label
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search labels..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
          onClick={() => void fetchLabels(1)}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.7fr_2fr_1fr_1fr_1fr] gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Name</span>
          <span>Description</span>
          <span>Categories</span>
          <span>Color</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading labels...</div>
        ) : labels.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No labels found.</div>
        ) : (
          labels.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.7fr_2fr_1fr_1fr_1fr] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-medium text-gray-800">{item.name}</span>
              <span>{item.description || "No description"}</span>
              <span className="truncate">
                {(item.categories ?? []).map((c) => c.name).join(", ") || "-"}
              </span>
              <span>{item.color || "-"}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-red-600 hover:text-red-700"
                  onClick={() => void onDelete(item.id)}
                >
                  Delete
                </button>
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
          onClick={() => void fetchLabels(page - 1)}
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
          onClick={() => void fetchLabels(page + 1)}
        >
          Next
        </button>
      </div>

      {isCreateOpen && (
        <LabelFormModal
          title="Create label"
          categories={categories}
          form={createForm}
          saving={saving}
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={onCreate}
          onChange={setCreateForm}
          onToggleCategory={toggleCategoryInCreate}
        />
      )}

      {editing && (
        <LabelFormModal
          title="Edit label"
          categories={categories}
          form={editForm}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSubmit={onUpdate}
          onChange={setEditForm}
          onToggleCategory={toggleCategoryInEdit}
        />
      )}
    </div>
  );
}

type LabelFormModalProps = {
  title: string;
  categories: Category[];
  form: LabelForm;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
  onChange: Dispatch<SetStateAction<LabelForm>>;
  onToggleCategory: (categoryId: string) => void;
};

function LabelFormModal({
  title,
  categories,
  form,
  saving,
  onCancel,
  onSubmit,
  onChange,
  onToggleCategory,
}: LabelFormModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <form
        onSubmit={onSubmit}
        className="flex w-full max-w-2xl flex-col gap-3 rounded-lg bg-white p-4 shadow-xl"
      >
        <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
        <input
          required
          value={form.name}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, name: event.target.value }))
          }
          placeholder="Label name"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <textarea
          value={form.description}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, description: event.target.value }))
          }
          placeholder="Description"
          className="min-h-[90px] rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <input
          value={form.color}
          onChange={(event) =>
            onChange((prev) => ({ ...prev, color: event.target.value }))
          }
          placeholder="Color hex"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm"
        />

        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-700">Categories</p>
          <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {categories.map((category) => (
              <label key={category.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.categoryIds.includes(category.id)}
                  onChange={() => onToggleCategory(category.id)}
                />
                {category.name}
              </label>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
            onClick={onCancel}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            Save
          </button>
        </div>
      </form>
    </div>
  );
>>>>>>> Stashed changes
}
