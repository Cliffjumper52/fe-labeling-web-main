import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { getLabelPaginated } from "../../services/label-service.service";
import {
  createProject,
  deleteProject,
  getProjectsPaginated,
  updateProject,
} from "../../services/project-service.service";
import type { DataType } from "../../interface/enums/domain.enums";

type ApiEnvelope<T> = { data?: T; message?: string | string[] };
type PaginatedPayload<T> = {
  data: T[];
  totalPages?: number;
  currentPage?: number;
};

type LabelOption = { id: string; name: string };
type ProjectItem = {
  id: string;
  name: string;
  description?: string | null;
  dataType: DataType;
  projectStatus: string;
  createdAt: string;
};

type ProjectForm = {
  name: string;
  description: string;
  dataType: DataType;
  availableLabelIds: string[];
};

const defaultForm: ProjectForm = {
  name: "",
  description: "",
  dataType: "image",
  availableLabelIds: [],
};

const normalize = <T,>(raw: unknown): PaginatedPayload<T> => {
  const env = raw as ApiEnvelope<PaginatedPayload<T>>;
  return {
    data: env?.data?.data ?? [],
    totalPages: env?.data?.totalPages,
    currentPage: env?.data?.currentPage,
  };
};

export default function AdminProjectsPage() {
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [labels, setLabels] = useState<LabelOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState<ProjectForm>(defaultForm);

  const [editing, setEditing] = useState<ProjectItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    dataType: "image" as DataType,
  });

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

  const fetchProjects = async (nextPage = page) => {
    setLoading(true);
    try {
      const resp = await getProjectsPaginated({
        page: nextPage,
        limit: 20,
        search: search.trim() || undefined,
        orderBy: "createdAt",
        order: "DESC",
      });
      const payload = normalize<ProjectItem>(resp);
      setProjects(payload.data);
      setPage(payload.currentPage ?? nextPage);
      setTotalPages(Math.max(1, payload.totalPages ?? 1));
    } catch {
      toast.error("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchLabels();
    void fetchProjects(1);
  }, []);

  const toggleLabel = (labelId: string) => {
    setCreateForm((prev) => ({
      ...prev,
      availableLabelIds: prev.availableLabelIds.includes(labelId)
        ? prev.availableLabelIds.filter((id) => id !== labelId)
        : [...prev.availableLabelIds, labelId],
    }));
  };

  const onCreate = async (event: FormEvent) => {
    event.preventDefault();
    if (createForm.availableLabelIds.length === 0) {
      toast.error("Select at least one label");
      return;
    }

    setSaving(true);
    try {
      await createProject(createForm);
      toast.success("Project created");
      setIsCreateOpen(false);
      setCreateForm(defaultForm);
      await fetchProjects(1);
    } catch {
      toast.error("Cannot create project");
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (item: ProjectItem) => {
    setEditing(item);
    setEditForm({
      name: item.name,
      description: item.description ?? "",
      dataType: item.dataType,
    });
  };

  const onUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editing) return;

    setSaving(true);
    try {
      await updateProject(editing.id, editForm);
      toast.success("Project updated");
      setEditing(null);
      await fetchProjects(page);
    } catch {
      toast.error("Cannot update project");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (!window.confirm("Delete this project?")) return;
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      await fetchProjects(page);
    } catch {
      toast.error("Cannot delete project");
    }
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
        <button
          type="button"
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          onClick={() => setIsCreateOpen(true)}
        >
          New project
        </button>
      </div>

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search projects..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold"
          onClick={() => void fetchProjects(1)}
        >
          Refresh
        </button>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
          <span>Name</span>
          <span>Type</span>
          <span>Status</span>
          <span>Created</span>
          <span>Actions</span>
        </div>
        {loading ? (
          <div className="px-4 py-6 text-sm text-gray-500">Loading projects...</div>
        ) : projects.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">No projects found.</div>
        ) : (
          projects.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-800">{item.name}</p>
                <p className="text-xs text-gray-500">
                  {item.description || "No description"}
                </p>
              </div>
              <span>{item.dataType}</span>
              <span>{item.projectStatus}</span>
              <span>{new Date(item.createdAt).toLocaleDateString()}</span>
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
          onClick={() => void fetchProjects(page - 1)}
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
          onClick={() => void fetchProjects(page + 1)}
        >
          Next
        </button>
      </div>

      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={onCreate}
            className="flex w-full max-w-2xl flex-col gap-3 rounded-lg bg-white p-4 shadow-xl"
          >
            <h3 className="text-sm font-semibold text-gray-800">Create project</h3>
            <input
              required
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Project name"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description"
              className="min-h-[90px] rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              title="Project data type"
              value={createForm.dataType}
              onChange={(event) =>
                setCreateForm((prev) => ({
                  ...prev,
                  dataType: event.target.value as DataType,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="image">image</option>
              <option value="video">video</option>
              <option value="text">text</option>
              <option value="audio">audio</option>
            </select>
            <div className="rounded-md border border-gray-200 p-3">
              <p className="mb-2 text-xs font-semibold text-gray-700">Available labels</p>
              <div className="grid max-h-48 grid-cols-1 gap-2 overflow-y-auto md:grid-cols-2">
                {labels.map((label) => (
                  <label key={label.id} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={createForm.availableLabelIds.includes(label.id)}
                      onChange={() => toggleLabel(label.id)}
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
                onClick={() => setIsCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
              >
                Create
              </button>
            </div>
          </form>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
          <form
            onSubmit={onUpdate}
            className="flex w-full max-w-lg flex-col gap-3 rounded-lg bg-white p-4 shadow-xl"
          >
            <h3 className="text-sm font-semibold text-gray-800">Edit project</h3>
            <input
              required
              value={editForm.name}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="Project name"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              value={editForm.description}
              onChange={(event) =>
                setEditForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description"
              className="min-h-[90px] rounded-md border border-gray-300 px-3 py-2 text-sm"
            />
            <select
              title="Edit project data type"
              value={editForm.dataType}
              onChange={(event) =>
                setEditForm((prev) => ({
                  ...prev,
                  dataType: event.target.value as DataType,
                }))
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="image">image</option>
              <option value="video">video</option>
              <option value="text">text</option>
              <option value="audio">audio</option>
            </select>
            <div className="mt-2 flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-gray-300 px-3 py-1.5 text-sm"
                onClick={() => setEditing(null)}
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
      )}
    </div>
  );
}
