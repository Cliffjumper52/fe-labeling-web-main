import {
  useEffect,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import {
  createLabelPreset,
  deleteLabelPreset,
  getLabelPresetsPaginated,
  updateLabelPreset,
} from "../../services/label-preset-service.service";
import { getLabelPaginated } from "../../services/label-service.service";

type ApiEnvelope<T> = { data?: T; message?: string | string[] };
type PaginatedPayload<T> = {
  data: T[];
  totalPages?: number;
  currentPage?: number;
};

type LabelOption = { id: string; name: string };
type PresetItem = {
  id: string;
  name: string;
  description?: string;
  labels?: LabelOption[];
  createdAt: string;
};

type PresetForm = {
  name: string;
  description: string;
  labelIds: string[];
};

const defaultForm: PresetForm = {
  name: "",
  description: "",
  labelIds: [],
};

const normalize = <T,>(raw: unknown): PaginatedPayload<T> => {
  const env = raw as ApiEnvelope<PaginatedPayload<T>>;
  return {
    data: env?.data?.data ?? [],
    totalPages: env?.data?.totalPages,
    currentPage: env?.data?.currentPage,
  };
};

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [labels, setLabels] = useState<LabelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

<<<<<<< Updated upstream
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<PresetForm>(defaultForm);

  const [editing, setEditing] = useState<PresetItem | null>(null);
  const [editForm, setEditForm] = useState<PresetForm>(defaultForm);

  const fetchLabels = async () => {
    try {
      const resp = await getLabelPaginated({
        page: 1,
        limit: 200,
        orderBy: "createdAt",
        order: "DESC",
      });
      setLabels(normalize<LabelOption>(resp).data);
    } catch {
      toast.error("Failed to load labels");
    }
  };
=======
  return <ManagerPresetsPage mode="admin" initialPresets={samplePresets} />;

  };
};

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailItem, setDetailItem] = useState<PresetItem | null>(null);
  const [closingDetail, setClosingDetail] = useState(false);
>>>>>>> Stashed changes

  const fetchPresets = async (nextPage = page) => {
    setLoading(true);
    try {
      const resp = await getLabelPresetsPaginated({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        orderBy: "createdAt",
        order: "DESC",
      });
      const payload = normalize<PresetItem>(resp);
      setPresets(payload.data);
      setPage(payload.currentPage ?? nextPage);
      setTotalPages(Math.max(1, payload.totalPages ?? 1));
    } catch {
      toast.error("Failed to load presets");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
<<<<<<< Updated upstream
    void fetchLabels();
    void fetchPresets(1);
  }, []);

  const toggleLabel = (
    labelId: string,
    setter: Dispatch<SetStateAction<PresetForm>>,
  ) => {
    setter((prev) => ({
      ...prev,
      labelIds: prev.labelIds.includes(labelId)
        ? prev.labelIds.filter((id) => id !== labelId)
        : [...prev.labelIds, labelId],
    }));
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (createForm.labelIds.length === 0) {
      toast.error("Select at least one label");
      return;
    }

    setSaving(true);
    try {
      await createLabelPreset(createForm);
      toast.success("Preset created");
      setIsCreateOpen(false);
      setCreateForm(defaultForm);
      await fetchPresets(1);
    } catch {
      toast.error("Cannot create preset");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: PresetItem) => {
    setEditing(item);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      labelIds: (item.labels ?? []).map((label) => label.id),
    });
  };

  const onUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;
    if (editForm.labelIds.length === 0) {
      toast.error("Select at least one label");
      return;
    }

    setSaving(true);
    try {
      await updateLabelPreset(editing.id, editForm);
      toast.success("Preset updated");
      setEditing(null);
      await fetchPresets(page);
    } catch {
      toast.error("Cannot update preset");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this preset?")) return;
=======
    void fetchPresets(1);
  }, []);

  const onDelete = async (id: string) => {
>>>>>>> Stashed changes
    try {
      await deleteLabelPreset(id);
      toast.success("Preset deleted");
      await fetchPresets(page);
    } catch {
      toast.error("Cannot delete preset");
    }
  };

<<<<<<< Updated upstream
=======
  const closeDetailModal = () => {
    setClosingDetail(true);
    window.setTimeout(() => {
      setDetailItem(null);
      setClosingDetail(false);
    }, 200);
  };

>>>>>>> Stashed changes
  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Presets</h2>
<<<<<<< Updated upstream
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setIsCreateOpen(true)}
        >
          New preset
        </button>
=======
>>>>>>> Stashed changes
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search presets..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
<<<<<<< Updated upstream
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
=======
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
>>>>>>> Stashed changes
          onClick={() => void fetchPresets(1)}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[1.7fr_2fr_1fr_1fr] gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Name</span>
          <span>Description</span>
          <span>Labels</span>
          <span>Actions</span>
        </div>
        {loading ? (
<<<<<<< Updated upstream
          <div className="px-4 py-6 text-sm text-gray-500">Loading presets...</div>
        ) : presets.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No presets found.</div>
=======
          <div className="px-4 py-6 text-sm text-gray-500">
            Loading presets...
          </div>
        ) : presets.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No presets found.
          </div>
>>>>>>> Stashed changes
        ) : (
          presets.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.7fr_2fr_1fr_1fr] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-medium text-gray-800">{item.name}</span>
              <span>{item.description || "No description"}</span>
              <span className="truncate">
<<<<<<< Updated upstream
                {(item.labels ?? []).map((label) => label.name).join(", ") || "-"}
=======
                {(item.labels ?? []).map((label) => label.name).join(", ") ||
                  "-"}
>>>>>>> Stashed changes
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-700"
<<<<<<< Updated upstream
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
=======
                  onClick={() => setDetailItem(item)}
                >
                  Detail
                </button>
                <ConfirmButton
                  label="Delete"
                  variant="danger"
                  size="sm"
                  className="!h-auto !border-0 !bg-transparent !p-0 text-red-600 hover:text-red-700 hover:!bg-transparent"
                  modalHeader="Delete this preset?"
                  modalBody={`Are you sure you want to delete ${item.name}? This action cannot be undone.`}
                  confirmLabel="Delete"
                  onConfirm={() => onDelete(item.id)}
                />
>>>>>>> Stashed changes
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
          onClick={() => void fetchPresets(page - 1)}
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
          onClick={() => void fetchPresets(page + 1)}
        >
          Next
        </button>
      </div>

<<<<<<< Updated upstream
      {isCreateOpen && (
        <PresetFormModal
          title="Create preset"
          labels={labels}
          form={createForm}
          saving={saving}
          onCancel={() => setIsCreateOpen(false)}
          onSubmit={onCreate}
          onChange={setCreateForm}
          onToggleLabel={(labelId) => toggleLabel(labelId, setCreateForm)}
        />
      )}

      {editing && (
        <PresetFormModal
          title="Edit preset"
          labels={labels}
          form={editForm}
          saving={saving}
          onCancel={() => setEditing(null)}
          onSubmit={onUpdate}
          onChange={setEditForm}
          onToggleLabel={(labelId) => toggleLabel(labelId, setEditForm)}
        />
      )}
    </div>
  );
}

type PresetFormModalProps = {
  title: string;
  labels: LabelOption[];
  form: PresetForm;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (event: FormEvent) => void;
  onChange: Dispatch<SetStateAction<PresetForm>>;
  onToggleLabel: (labelId: string) => void;
};

function PresetFormModal({
  title,
  labels,
  form,
  saving,
  onCancel,
  onSubmit,
  onChange,
  onToggleLabel,
}: PresetFormModalProps) {
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
          placeholder="Preset name"
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

        <div className="rounded-md border border-gray-200 p-3">
          <p className="mb-2 text-xs font-semibold text-gray-700">Labels</p>
          <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
            {labels.map((label) => (
              <label key={label.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.labelIds.includes(label.id)}
                  onChange={() => onToggleLabel(label.id)}
                />
                {label.name}
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
=======
      {/* Detail Modal */}
      {detailItem && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${closingDetail ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-96 rounded-lg bg-white p-6 shadow-lg transition-transform duration-200 ${closingDetail ? "scale-95" : "scale-100"}`}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Preset Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="font-medium text-gray-700">Name</label>
                <p className="mt-1 text-gray-600">{detailItem.name}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Description</label>
                <p className="mt-1 text-gray-600">
                  {detailItem.description || "No description"}
                </p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Labels</label>
                <div className="mt-1">
                  {(detailItem.labels ?? []).length > 0 ? (
                    <ul className="list-inside list-disc text-gray-600">
                      {(detailItem.labels ?? []).map((label) => (
                        <li key={label.id}>{label.name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-600">No labels</p>
                  )}
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700">Created</label>
                <p className="mt-1 text-gray-600">
                  {new Date(detailItem.createdAt).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={closeDetailModal}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
>>>>>>> Stashed changes
    </div>
  );
}
