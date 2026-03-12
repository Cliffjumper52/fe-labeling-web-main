import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteLabel,
  getLabelPaginated,
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

const normalize = <T,>(raw: unknown): PaginatedPayload<T> => {
  const env = raw as ApiEnvelope<PaginatedPayload<T>>;
  return {
    data: env?.data?.data ?? [],
    totalPages: env?.data?.totalPages,
    currentPage: env?.data?.currentPage,
  };
};

export default function AdminLabelsPage() {
  const [labels, setLabels] = useState<LabelItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailItem, setDetailItem] = useState<LabelItem | null>(null);
  const [closingDetail, setClosingDetail] = useState(false);

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
    void fetchLabels(1);
  }, []);

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
        <h2 className="text-xl font-semibold text-gray-800">Labels</h2>
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
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
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
          <div className="px-4 py-6 text-sm text-gray-500">
            Loading labels...
          </div>
        ) : labels.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No labels found.
          </div>
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
                  onClick={() => setDetailItem(item)}
                >
                  Detail
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

      {/* Detail Modal */}
      {detailItem && (
        <div
          className={`fixed inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200 ${closingDetail ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-96 rounded-lg bg-white p-6 shadow-lg transition-transform duration-200 ${closingDetail ? "scale-95" : "scale-100"}`}
          >
            <h3 className="mb-4 text-lg font-semibold text-gray-800">
              Label Details
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
                <label className="font-medium text-gray-700">Color</label>
                <div className="mt-1 flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-md border border-gray-300"
                    style={{ backgroundColor: detailItem.color || "#22c55e" }}
                  />
                  <p className="text-gray-600">
                    {detailItem.color || "#22c55e"}
                  </p>
                </div>
              </div>
              <div>
                <label className="font-medium text-gray-700">Categories</label>
                <p className="mt-1 text-gray-600">
                  {(detailItem.categories ?? [])
                    .map((c) => c.name)
                    .join(", ") || "-"}
                </p>
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
