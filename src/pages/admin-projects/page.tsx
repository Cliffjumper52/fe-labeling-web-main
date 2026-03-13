import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteProject,
  getProjectsPaginated,
} from "../../services/project-service.service";
import type { DataType } from "../../interface/enums/domain.enums";
import { ConfirmButton } from "../../components/common/confirm-modal";

type ApiEnvelope<T> = { data?: T; message?: string | string[] };
type PaginatedPayload<T> = {
  data: T[];
  totalPages?: number;
  currentPage?: number;
};

type ProjectItem = {
  id: string;
  name: string;
  description?: string | null;
  dataType: DataType;
  projectStatus: string;
  createdAt: string;
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
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailItem, setDetailItem] = useState<ProjectItem | null>(null);
  const [closingDetail, setClosingDetail] = useState(false);

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
    void fetchProjects(1);
  }, []);

  const onDelete = async (id: string) => {
    try {
      await deleteProject(id);
      toast.success("Project deleted");
      await fetchProjects(page);
    } catch {
      toast.error("Cannot delete project");
    }
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
        <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
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
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
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
          <div className="px-4 py-6 text-sm text-gray-500">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No projects found.
          </div>
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
                  onClick={() => setDetailItem(item)}
                >
                  Detail
                </button>
                <ConfirmButton
                  label="Delete"
                  variant="danger"
                  size="sm"
                  className="!h-auto !border-0 !bg-transparent !p-0 text-red-600 hover:text-red-700 hover:!bg-transparent"
                  modalHeader="Delete this project?"
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

      {/* Detail Modal */}
      {detailItem && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${closingDetail ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-96 rounded-lg bg-white p-6 shadow-lg transition-transform duration-200 ${closingDetail ? "scale-95" : "scale-100"}`}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Project Details
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
                <label className="font-medium text-gray-700">Data Type</label>
                <p className="mt-1 text-gray-600">{detailItem.dataType}</p>
              </div>
              <div>
                <label className="font-medium text-gray-700">Status</label>
                <p className="mt-1 text-gray-600">{detailItem.projectStatus}</p>
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
    </div>
  );
}
