import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  deleteLabelPreset,
  getLabelPresetStatistics,
  getLabelPresetsPaginated,
} from "../../services/label-preset-service.service";
import { ConfirmButton } from "../../components/common/confirm-modal";
import StatisticsSummary from "../../components/common/statistics-summary";

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

export default function AdminPresetsPage() {
  const [presets, setPresets] = useState<PresetItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [detailItem, setDetailItem] = useState<PresetItem | null>(null);
  const [closingDetail, setClosingDetail] = useState(false);

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
    void fetchPresets(1);
  }, []);

  const onDelete = async (id: string) => {
    try {
      await deleteLabelPreset(id);
      toast.success("Preset deleted");
      await fetchPresets(page);
    } catch {
      toast.error("Cannot delete preset");
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
        <h2 className="text-xl font-semibold text-gray-800">Presets</h2>
      </div>

      <StatisticsSummary
        className="mb-4"
        fetchStatistics={getLabelPresetStatistics}
        cards={[
          { key: "totalPresets", label: "Total presets" },
          { key: "presetsWithLabels", label: "With labels" },
          {
            key: "avgLabelsPerPreset",
            label: "Avg labels/preset",
            formatValue: formatAverage,
          },
          {
            key: "avgPresetsPerLabel",
            label: "Avg presets/label",
            formatValue: formatAverage,
          },
        ]}
      />

      <div className="mb-4 flex gap-2">
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search presets..."
          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold hover:bg-gray-50"
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
          <div className="px-4 py-6 text-sm text-gray-500">
            Loading presets...
          </div>
        ) : presets.length === 0 ? (
          <div className="px-4 py-6 text-sm text-gray-500">
            No presets found.
          </div>
        ) : (
          presets.map((item) => (
            <div
              key={item.id}
              className="grid grid-cols-[1.7fr_2fr_1fr_1fr] gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <span className="font-medium text-gray-800">{item.name}</span>
              <span>{item.description || "No description"}</span>
              <span className="truncate">
                {(item.labels ?? []).map((label) => label.name).join(", ") ||
                  "-"}
              </span>
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
                  modalHeader="Delete this preset?"
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

      {/* Detail Modal */}
      {detailItem && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm transition-opacity duration-200 ${closingDetail ? "opacity-0" : "opacity-100"}`}
        >
          <div
            className={`w-full max-w-md rounded-xl bg-white shadow-2xl transition-transform duration-200 ${closingDetail ? "scale-95" : "scale-100"}`}
          >
            {/* Header */}
            <div className="flex items-center justify-between rounded-t-xl bg-gradient-to-r from-violet-600 to-violet-500 px-5 py-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white font-bold text-sm">
                  {detailItem.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{detailItem.name}</p>
                  <p className="text-xs text-violet-100">Preset · {(detailItem.labels ?? []).length} label{(detailItem.labels ?? []).length !== 1 ? "s" : ""}</p>
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

              {/* Labels */}
              <div className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-2">Labels</p>
                {(detailItem.labels ?? []).length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {(detailItem.labels ?? []).map((label) => (
                      <span key={label.id} className="rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-700">
                        {label.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="italic text-sm text-gray-400">No labels assigned</p>
                )}
              </div>

              {/* Created & ID */}
              <div className="flex gap-3">
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Created</p>
                  <p className="text-sm text-gray-700">{new Date(detailItem.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="flex-1 rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1">Preset ID</p>
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
    </div>
  );
}
