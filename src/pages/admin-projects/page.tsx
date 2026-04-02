import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteProject,
  getProjectStatistics,
  getProjectsPaginated,
} from "../../services/project-service.service";
import type { DataType } from "../../interface/enums/domain.enums";
import { ConfirmButton } from "../../components/common/confirm-modal";
import StatisticsSummary from "../../components/common/statistics-summary";

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

      <StatisticsSummary
        className="mb-4"
        fetchStatistics={getProjectStatistics}
        cards={[
          { key: "totalCount", label: "Total projects" },
          { key: "activeCount", label: "Active" },
          { key: "completedCount", label: "Completed" },
          { key: "archivedCount", label: "Archived" },
        ]}
      />

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
                  className="font-semibold text-blue-600 hover:text-blue-700"
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
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm transition-opacity duration-200 ${closingDetail ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-full max-w-md rounded-xl bg-white shadow-2xl transition-transform duration-200 ${closingDetail ? "scale-95" : "scale-100"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-indigo-600 to-indigo-500 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-bold text-sm">
                  {detailItem.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{detailItem.name}</p>
                  <p className="text-xs text-indigo-100">Project</p>
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
              {/* Data Type & Status row */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Data Type</p>
                  <span className="inline-block rounded-md bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">{detailItem.dataType}</span>
                </div>
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Status</p>
                  <span className={`inline-block rounded-md px-2 py-0.5 text-xs font-semibold ${
                    detailItem.projectStatus === "active" ? "bg-green-100 text-green-700"
                    : detailItem.projectStatus === "draft" ? "bg-yellow-100 text-yellow-700"
                    : detailItem.projectStatus === "completed" ? "bg-blue-100 text-blue-700"
                    : "bg-gray-100 text-gray-600"
                  }`}>{detailItem.projectStatus}</span>
                </div>
              </div>

              {/* Description */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Description</p>
                <p className="text-sm text-gray-700">{detailItem.description || <span className="italic text-gray-400">No description</span>}</p>
              </div>

              {/* Created */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Created</p>
                <p className="text-sm text-gray-700">{new Date(detailItem.createdAt).toLocaleString()}</p>
              </div>

              {/* ID */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Project ID</p>
                <p className="break-all font-mono text-xs text-gray-600">{detailItem.id}</p>
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
    </div>
  );
}
