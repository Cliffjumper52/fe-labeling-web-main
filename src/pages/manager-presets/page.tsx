import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { Label as ApiLabel } from "../../interface/label/label.interface";
import type { LabelPreset as ApiLabelPreset } from "../../interface/label-preset/label-preset.interface";
import {
  createLabelPreset,
  deleteLabelPreset,
  getLabelPresetById,
  getLabelPresetsPaginated,
  getLabelPresetStatistics,
  updateLabelPreset,
} from "../../services/label-preset-service.service";
import { getAllLabels } from "../../services/label-service.service";
import { ConfirmButton } from "../../components/common/confirm-modal";
import Pagination from "../../components/common/pagination";
import StatisticsSummary from "../../components/common/statistics-summary";

type Preset = {
  id: string;
  name: string;
  description?: string;
  labelIds: string[];
  createdAt: string;
  updatedAt: string;
};

type ManagerPresetsPageProps = {
  mode?: "manager" | "admin";
  initialPresets?: Preset[];
};

const PAGE_LIMIT = 10;

type PaginationResult<T> = {
  data: T[];
  totalPages?: number;
  pageCount?: number;
};

export default function ManagerPresetsPage({
  mode = "manager",
  initialPresets,
}: ManagerPresetsPageProps) {
  const isAdmin = mode === "admin";
  const [presets, setPresets] = useState<Preset[]>(() => initialPresets ?? []);
  const hasPresets = presets.length > 0;
  const [labels, setLabels] = useState<ApiLabel[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [presetsError, setPresetsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<"Name" | "Date created" | "Updated">(
    "Date created",
  );
  const [order, setOrder] = useState<"All" | "Ascending" | "Descending">(
    "Descending",
  );
  const [isCreatePresetOpen, setIsCreatePresetOpen] = useState(false);
  const [creatingPreset, setCreatingPreset] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetLabelQuery, setPresetLabelQuery] = useState("");
  const [selectedPresetLabelIds, setSelectedPresetLabelIds] = useState<
    string[]
  >([]);
  const [labelSelectError, setLabelSelectError] = useState<string | null>(null);
  const [isEditPresetOpen, setIsEditPresetOpen] = useState(false);
  const [updatingPreset, setUpdatingPreset] = useState(false);
  const [editingPresetId, setEditingPresetId] = useState<string | null>(null);
  const [editPresetName, setEditPresetName] = useState("");
  const [editPresetDescription, setEditPresetDescription] = useState("");
  const [editPresetLabelQuery, setEditPresetLabelQuery] = useState("");
  const [editSelectedPresetLabelIds, setEditSelectedPresetLabelIds] = useState<
    string[]
  >([]);
  const [editLabelSelectError, setEditLabelSelectError] = useState<
    string | null
  >(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailPreset, setDetailPreset] = useState<Preset | null>(null);
  const [isLoading] = useState(false);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );
  const [statisticsRefreshKey, setStatisticsRefreshKey] = useState(0);

  const labelMap = useMemo(() => {
    return new Map(labels.map((label) => [label.id, label.name]));
  }, [labels]);

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

  const extractTotalPages = (payload: unknown): number => {
    const data = unwrapApiResponse<PaginationResult<unknown>>(payload);
    if (data && typeof data === "object") {
      return data.totalPages ?? data.pageCount ?? 1;
    }
    return 1;
  };

  const extractErrorMessage = (error: unknown, fallback: string) => {
    const message = (error as { response?: { data?: { message?: unknown } } })
      ?.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    return error instanceof Error ? error.message : fallback;
  };

  const formatAverage = (value: number | string | null | undefined): string => {
    const numericValue = typeof value === "number" ? value : Number(value);
    if (!Number.isFinite(numericValue)) {
      return "-";
    }

    return numericValue.toFixed(2);
  };

  const normalizePresets = (apiPresets: ApiLabelPreset[]): Preset[] => {
    return apiPresets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      description: preset.description ?? undefined,
      labelIds: Array.isArray(preset.labels)
        ? preset.labels.map((label) => label.id)
        : [],
      createdAt: preset.createdAt,
      updatedAt: preset.updatedAt,
    }));
  };

  const loadLabels = async () => {
    try {
      const resp = await getAllLabels({
        orderBy: "name",
        order: "ASC",
      });
      const labelList = extractArray<ApiLabel>(resp);
      setLabels(labelList);
    } catch (error) {
      setLabels([]);
      setPresetsError(
        extractErrorMessage(error, "Failed to load labels for presets."),
      );
    }
  };

  const loadPresets = async () => {
    setPresetsLoading(true);
    setPresetsError(null);

    try {
      const resp = await getLabelPresetsPaginated({
        ...(search.trim() && { search: search.trim() }),
        ...(orderBy === "Name" && { orderBy: "name" }),
        ...(orderBy === "Date created" && { orderBy: "createdAt" }),
        ...(orderBy === "Updated" && { orderBy: "updatedAt" }),
        ...(order === "Ascending" && { order: "ASC" }),
        ...(order === "Descending" && { order: "DESC" }),
        page: currentPage,
        limit: PAGE_LIMIT,
      });

      const list = extractArray<ApiLabelPreset>(resp);
      const pages = extractTotalPages(resp);
      setPresets(normalizePresets(list));
      setTotalPages(pages || 1);
    } catch (error) {
      setPresetsError(
        extractErrorMessage(error, "Failed to load manager presets."),
      );
      setPresets([]);
      setTotalPages(1);
    } finally {
      setPresetsLoading(false);
    }
  };

  const resetCreatePresetForm = () => {
    setPresetName("");
    setPresetDescription("");
    setPresetLabelQuery("");
    setSelectedPresetLabelIds([]);
    setLabelSelectError(null);
  };

  const resetEditPresetForm = () => {
    setEditingPresetId(null);
    setEditPresetName("");
    setEditPresetDescription("");
    setEditPresetLabelQuery("");
    setEditSelectedPresetLabelIds([]);
    setEditLabelSelectError(null);
  };

  useEffect(() => {
    void loadLabels();
  }, []);

  useEffect(() => {
    void loadPresets();
  }, [currentPage, search, order, orderBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, order, orderBy]);

  const handleCreatePreset = async (event: FormEvent) => {
    event.preventDefault();
    setPresetsError(null);
    setCreatingPreset(true);

    try {
      await createLabelPreset({
        name: presetName.trim() || "Untitled Preset",
        description: presetDescription.trim() || undefined,
        labelIds: selectedPresetLabelIds,
      });
      setIsCreatePresetOpen(false);
      resetCreatePresetForm();
      setCurrentPage(1);
      await loadPresets();
      setStatisticsRefreshKey((prev) => prev + 1);
    } catch (error) {
      setPresetsError(extractErrorMessage(error, "Failed to create preset."));
    } finally {
      setCreatingPreset(false);
    }
  };

  const handleAddPresetLabel = () => {
    const trimmed = presetLabelQuery.trim();
    if (!trimmed) {
      return;
    }
    const match = labels.find(
      (label) => label.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!match) {
      setLabelSelectError("Label not found.");
      return;
    }
    setSelectedPresetLabelIds((prev) =>
      prev.includes(match.id) ? prev : [...prev, match.id],
    );
    setPresetLabelQuery("");
    setLabelSelectError(null);
  };

  const handleRemovePresetLabel = (labelId: string) => {
    setSelectedPresetLabelIds((prev) =>
      prev.filter((item) => item !== labelId),
    );
  };

  const handleOpenEditPreset = (preset: Preset) => {
    setEditingPresetId(preset.id);
    setEditPresetName(preset.name);
    setEditPresetDescription(preset.description ?? "");
    setEditSelectedPresetLabelIds(preset.labelIds);
    setEditPresetLabelQuery("");
    setIsEditPresetOpen(true);
  };

  const handleAddEditPresetLabel = () => {
    const trimmed = editPresetLabelQuery.trim();
    if (!trimmed) {
      return;
    }
    const match = labels.find(
      (label) => label.name.toLowerCase() === trimmed.toLowerCase(),
    );
    if (!match) {
      setEditLabelSelectError("Label not found.");
      return;
    }
    setEditSelectedPresetLabelIds((prev) =>
      prev.includes(match.id) ? prev : [...prev, match.id],
    );
    setEditPresetLabelQuery("");
    setEditLabelSelectError(null);
  };

  const handleRemoveEditPresetLabel = (labelId: string) => {
    setEditSelectedPresetLabelIds((prev) =>
      prev.filter((item) => item !== labelId),
    );
  };

  const handleUpdatePreset = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingPresetId) {
      return;
    }
    setPresetsError(null);
    setUpdatingPreset(true);

    try {
      await updateLabelPreset(editingPresetId, {
        name: editPresetName.trim() || "Untitled Preset",
        description: editPresetDescription.trim() || undefined,
        labelIds: editSelectedPresetLabelIds,
      });
      setIsEditPresetOpen(false);
      resetEditPresetForm();
      await loadPresets();
      setStatisticsRefreshKey((prev) => prev + 1);
    } catch (error) {
      setPresetsError(extractErrorMessage(error, "Failed to update preset."));
    } finally {
      setUpdatingPreset(false);
    }
  };

  const handleOpenPresetDetails = async (preset: Preset) => {
    setPresetsError(null);

    try {
      const resp = await getLabelPresetById(preset.id);
      const detail = unwrapApiResponse<ApiLabelPreset>(resp);
      if (!detail) {
        throw new Error("Preset not found.");
      }
      const normalized = normalizePresets([detail])[0];
      setDetailPreset(normalized);
      setIsDetailOpen(true);
    } catch (error) {
      setPresetsError(
        extractErrorMessage(error, "Failed to load preset details."),
      );
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    setPresetsError(null);

    try {
      await deleteLabelPreset(presetId);
      setPresets((prev) => prev.filter((preset) => preset.id !== presetId));
      setStatisticsRefreshKey((prev) => prev + 1);
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to delete preset.");
      setPresetsError(message);
      throw error;
    }
  };

  const closeWithAnimation = (
    key: string,
    closeFn: Dispatch<SetStateAction<boolean>>,
  ) => {
    setClosingModals((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      closeFn(false);
      setClosingModals((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 200);
  };

  const fetchPresetStatistics = useCallback(
    () => getLabelPresetStatistics(undefined),
    [],
  );

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Presets</h2>
        <button
          type="button"
          onClick={() => {
            resetCreatePresetForm();
            setIsCreatePresetOpen(true);
          }}
          className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <span className="text-lg leading-none">+</span>
          New Preset
        </button>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <StatisticsSummary
        className="mb-4"
        fetchStatistics={fetchPresetStatistics}
        refreshKey={statisticsRefreshKey}
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

      {isLoading && (
        <div className="mb-4 rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
          Loading presets from API...
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Search</label>
          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="w-full text-sm outline-none placeholder:text-gray-400"
              placeholder="Search presets..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            Order by
          </label>
          <select
            title="Order presets by"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
            value={orderBy}
            onChange={(event) =>
              setOrderBy(
                event.target.value as "Name" | "Date created" | "Updated",
              )
            }
          >
            <option>Name</option>
            <option>Date created</option>
            <option>Updated</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order</label>
          <select
            title="Preset sort order"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
            value={order}
            onChange={(event) =>
              setOrder(event.target.value as "All" | "Ascending" | "Descending")
            }
          >
            <option>All</option>
            <option>Ascending</option>
            <option>Descending</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select
            title="Preset status"
            className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
          >
            <option>All</option>
            <option>Active</option>
            <option>Archived</option>
          </select>
        </div>
      </div>

      {presetsError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {presetsError}
        </div>
      )}

      {presetsLoading ? (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
          Loading presets...
        </div>
      ) : !hasPresets ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            No Presets Yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? "No presets are available right now."
              : "Create your first preset to reuse label groups"}
          </p>
          <button
            type="button"
            onClick={() => {
              resetCreatePresetForm();
              setIsCreatePresetOpen(true);
            }}
            className="mt-5 flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <span className="text-base leading-none">+</span>
            Create Preset
          </button>
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.6fr_2fr_1fr_1fr_0.8fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
            <span>Name</span>
            <span>Description</span>
            <span>Labels</span>
            <span>Date created</span>
            <span>Action</span>
          </div>

          {presets.map((preset) => (
            <div
              key={preset.id}
              className="grid grid-cols-[1.6fr_2fr_1fr_1fr_0.8fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-800">{preset.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {preset.description || "No description"}
                </p>
              </div>
              <div className="flex items-center">
                <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                  {preset.labelIds.length}
                </span>
              </div>
              <span className="text-gray-700">{preset.createdAt}</span>
              <div className="flex items-center gap-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => handleOpenPresetDetails(preset)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Details
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenEditPreset(preset)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Edit
                </button>
                <ConfirmButton
                  label="Delete"
                  variant="danger"
                  size="sm"
                  className="!h-auto !border-0 !bg-transparent !p-0 text-red-500 hover:text-red-600 hover:!bg-transparent"
                  modalHeader="Delete this preset?"
                  modalBody={`Are you sure you want to delete ${preset.name}? This action cannot be undone.`}
                  confirmLabel="Delete"
                  onConfirm={() => handleDeletePreset(preset.id)}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {hasPresets && !presetsLoading && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            size="md"
          />
        </div>
      )}

      {!isAdmin && isCreatePresetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-md rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.createPreset ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Create new preset
              </h3>
              <button
                type="button"
                disabled={creatingPreset}
                onClick={() =>
                  closeWithAnimation("createPreset", setIsCreatePresetOpen)
                }
                className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleCreatePreset}
              className="flex flex-col gap-4 p-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Preset name
                </label>
                <input
                  value={presetName}
                  onChange={(event) => setPresetName(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Preset description
                </label>
                <textarea
                  value={presetDescription}
                  onChange={(event) => setPresetDescription(event.target.value)}
                  className="min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example description"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">
                  Add labels
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={presetLabelQuery}
                    onChange={(event) =>
                      setPresetLabelQuery(event.target.value)
                    }
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Search labels to add..."
                    list="preset-label-options"
                  />
                  <button
                    type="button"
                    onClick={handleAddPresetLabel}
                    className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
                {labelSelectError && (
                  <p className="text-xs text-red-500">{labelSelectError}</p>
                )}
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <span className="text-xs font-semibold text-gray-700">
                  Selected labels
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPresetLabelIds.length === 0 && (
                    <span className="text-xs text-gray-400">
                      No labels selected
                    </span>
                  )}
                  {selectedPresetLabelIds.map((labelId) => (
                    <span
                      key={labelId}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {labelMap.get(labelId) ?? "Unknown"}
                      <button
                        type="button"
                        onClick={() => handleRemovePresetLabel(labelId)}
                        className="text-red-500 hover:text-red-600"
                        aria-label={`Remove ${labelMap.get(labelId) ?? "label"}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <datalist id="preset-label-options">
                {labels.map((label) => (
                  <option key={label.id} value={label.name} />
                ))}
              </datalist>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={creatingPreset}
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {creatingPreset ? (
                    "Creating..."
                  ) : (
                    <>
                      <span className="text-base leading-none">+</span>
                      New Preset
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isEditPresetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-md rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.editPreset ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Edit preset
              </h3>
              <button
                type="button"
                disabled={updatingPreset}
                onClick={() => {
                  closeWithAnimation("editPreset", setIsEditPresetOpen);
                  resetEditPresetForm();
                }}
                className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>

            <form
              onSubmit={handleUpdatePreset}
              className="flex flex-col gap-4 p-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Preset name
                </label>
                <input
                  value={editPresetName}
                  onChange={(event) => setEditPresetName(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Preset description
                </label>
                <textarea
                  value={editPresetDescription}
                  onChange={(event) =>
                    setEditPresetDescription(event.target.value)
                  }
                  className="min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example description"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-gray-700">
                  Edit labels
                </label>
                <div className="flex items-center gap-2">
                  <input
                    value={editPresetLabelQuery}
                    onChange={(event) =>
                      setEditPresetLabelQuery(event.target.value)
                    }
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Label name..."
                    list="edit-preset-label-options"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditPresetLabel}
                    className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
                {editLabelSelectError && (
                  <p className="text-xs text-red-500">{editLabelSelectError}</p>
                )}
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <span className="text-xs font-semibold text-gray-700">
                  Selected labels
                </span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {editSelectedPresetLabelIds.length === 0 && (
                    <span className="text-xs text-gray-400">
                      No labels selected
                    </span>
                  )}
                  {editSelectedPresetLabelIds.map((labelId) => (
                    <span
                      key={labelId}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {labelMap.get(labelId) ?? "Unknown"}
                      <button
                        type="button"
                        onClick={() => handleRemoveEditPresetLabel(labelId)}
                        className="text-red-500 hover:text-red-600"
                        aria-label={`Remove ${labelMap.get(labelId) ?? "label"}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <datalist id="edit-preset-label-options">
                {labels.map((label) => (
                  <option key={label.id} value={label.name} />
                ))}
              </datalist>

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  disabled={updatingPreset}
                  onClick={() => {
                    closeWithAnimation("editPreset", setIsEditPresetOpen);
                    resetEditPresetForm();
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingPreset}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {updatingPreset ? "Updating..." : "Save changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && detailPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.presetDetails ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Preset details
              </h3>
              <button
                type="button"
                onClick={() =>
                  closeWithAnimation("presetDetails", setIsDetailOpen)
                }
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <div className="rounded-md border border-gray-200 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {detailPreset.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {detailPreset.description || "No description provided"}
                    </p>
                  </div>
                  <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {detailPreset.labelIds.length} labels
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Date created
                  </p>
                  <p className="mt-2 text-sm text-gray-800">
                    {detailPreset.createdAt}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">Labels</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailPreset.labelIds.length === 0 ? (
                      <span className="text-xs text-gray-400">No labels</span>
                    ) : (
                      detailPreset.labelIds.map((labelId) => (
                        <span
                          key={labelId}
                          className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                        >
                          {labelMap.get(labelId) ?? "Unknown"}
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
