import {
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

type Preset = {
  id: string;
  name: string;
  description?: string;
  labels: string[];
  createdAt: string;
};

type ManagerPresetsPageProps = {
  mode?: "manager" | "admin";
  initialPresets?: Preset[];
};

export default function ManagerPresetsPage({
  mode = "manager",
  initialPresets,
}: ManagerPresetsPageProps) {
  const isAdmin = mode === "admin";
  const [presets, setPresets] = useState<Preset[]>(
    () => initialPresets ?? [],
  );
  const hasPresets = presets.length > 0;
  const [isCreatePresetOpen, setIsCreatePresetOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [presetDescription, setPresetDescription] = useState("");
  const [presetLabelQuery, setPresetLabelQuery] = useState("");
  const [selectedPresetLabels, setSelectedPresetLabels] = useState<string[]>([]);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailPreset, setDetailPreset] = useState<Preset | null>(null);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const handleCreatePreset = (event: FormEvent) => {
    event.preventDefault();
    const now = new Date();
    const createdAt = now.toISOString().slice(0, 10);
    setPresets((prev) => [
      {
        id: crypto.randomUUID(),
        name: presetName.trim() || "Untitled Preset",
        description: presetDescription.trim(),
        labels: selectedPresetLabels,
        createdAt,
      },
      ...prev,
    ]);
    setIsCreatePresetOpen(false);
    setPresetName("");
    setPresetDescription("");
    setPresetLabelQuery("");
    setSelectedPresetLabels([]);
  };

  const handleAddPresetLabel = () => {
    const trimmed = presetLabelQuery.trim();
    if (!trimmed) {
      return;
    }
    setSelectedPresetLabels((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed],
    );
    setPresetLabelQuery("");
  };

  const handleRemovePresetLabel = (label: string) => {
    setSelectedPresetLabels((prev) => prev.filter((item) => item !== label));
  };

  const handleOpenPresetDetails = (preset: Preset) => {
    setDetailPreset(preset);
    setIsDetailOpen(true);
  };

  const handleDeletePreset = (presetId: string) => {
    setPresets((prev) => prev.filter((preset) => preset.id !== presetId));
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

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Presets</h2>
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setIsCreatePresetOpen(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            New Preset
          </button>
        )}
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

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
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order by</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>Name</option>
            <option>Date created</option>
            <option>Updated</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>All</option>
            <option>Ascending</option>
            <option>Descending</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>All</option>
            <option>Active</option>
            <option>Archived</option>
          </select>
        </div>
      </div>

      {!hasPresets ? (
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
          <h3 className="text-lg font-semibold text-gray-800">No Presets Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? "No presets are available right now."
              : "Create your first preset to reuse label groups"}
          </p>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreatePresetOpen(true)}
              className="mt-5 flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <span className="text-base leading-none">+</span>
              Create Preset
            </button>
          )}
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
              <div className="flex flex-wrap gap-2">
                {preset.labels.length === 0 ? (
                  <span className="text-xs text-gray-400">No labels</span>
                ) : (
                  preset.labels.map((label) => (
                    <span
                      key={label}
                      className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {label}
                    </span>
                  ))
                )}
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
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleDeletePreset(preset.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
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
                onClick={() => closeWithAnimation("createPreset", setIsCreatePresetOpen)}
                className="text-gray-500 hover:text-gray-700"
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

            <form onSubmit={handleCreatePreset} className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">Preset name</label>
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
                <label className="text-xs font-semibold text-gray-700">Add labels</label>
                <div className="flex items-center gap-2">
                  <input
                    value={presetLabelQuery}
                    onChange={(event) => setPresetLabelQuery(event.target.value)}
                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Search labels to add..."
                  />
                  <button
                    type="button"
                    onClick={handleAddPresetLabel}
                    className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white"
                  >
                    Add
                  </button>
                </div>
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <span className="text-xs font-semibold text-gray-700">Selected labels</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {selectedPresetLabels.length === 0 && (
                    <span className="text-xs text-gray-400">No labels selected</span>
                  )}
                  {selectedPresetLabels.map((label) => (
                    <span
                      key={label}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {label}
                      <button
                        type="button"
                        onClick={() => handleRemovePresetLabel(label)}
                        className="text-red-500 hover:text-red-600"
                        aria-label={`Remove ${label}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  <span className="text-base leading-none">+</span>
                  New Preset
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
              <h3 className="text-sm font-semibold text-gray-800">Preset details</h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("presetDetails", setIsDetailOpen)}
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
                    {detailPreset.labels.length} labels
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">Date created</p>
                  <p className="mt-2 text-sm text-gray-800">
                    {detailPreset.createdAt}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">Labels</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailPreset.labels.length === 0 ? (
                      <span className="text-xs text-gray-400">No labels</span>
                    ) : (
                      detailPreset.labels.map((label) => (
                        <span
                          key={label}
                          className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                        >
                          {label}
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
