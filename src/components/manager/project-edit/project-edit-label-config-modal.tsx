import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import type {
  ManagerProjectEditAvailableLabel,
  ManagerProjectEditPreset,
} from "../../../interface/project/manager-project-edit.interface";

type Props = {
  open: boolean;
  closing: boolean;
  labelSearch: string;
  presetSearch: string;
  labelsLoading: boolean;
  labels: ManagerProjectEditAvailableLabel[];
  selectedConfigLabelIds: string[];
  presetsLoading: boolean;
  presets: ManagerProjectEditPreset[];
  selectedPresetIds: string[];
  onLabelSearchChange: (value: string) => void;
  onPresetSearchChange: (value: string) => void;
  onToggleConfigLabel: (id: string) => void;
  onTogglePreset: (id: string) => void;
  onClose: () => void;
};

export default function ProjectEditLabelConfigModal({
  open,
  closing,
  labelSearch,
  presetSearch,
  labelsLoading,
  labels,
  selectedConfigLabelIds,
  presetsLoading,
  presets,
  selectedPresetIds,
  onLabelSearchChange,
  onPresetSearchChange,
  onToggleConfigLabel,
  onTogglePreset,
  onClose,
}: Props) {
  if (!open) {
    return null;
  }

  const filteredLabels = labels.filter((label) =>
    `${label.name} ${label.description ?? ""}`
      .toLowerCase()
      .includes(labelSearch.toLowerCase()),
  );

  const filteredPresets = presets.filter((preset) =>
    `${preset.name} ${preset.description ?? ""}`
      .toLowerCase()
      .includes(presetSearch.toLowerCase()),
  );

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4"
      onClick={handleOverlayClick}
    >
      <div
        className={`max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
          closing ? "modal-pop-out" : "modal-pop"
        }`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-lg font-semibold text-gray-800">
            Configure labels
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Add individual labels
              </p>
              <span className="text-xs text-gray-500">
                Multi-select enabled
              </span>
            </div>
            <input
              value={labelSearch}
              onChange={(event) => onLabelSearchChange(event.target.value)}
              className="mt-2 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Search labels"
            />

            <div className="mt-2 max-h-44 space-y-2 overflow-y-auto rounded-md border border-gray-300 p-3">
              {labelsLoading ? (
                <span className="text-xs text-gray-400">Loading labels...</span>
              ) : labels.length === 0 ? (
                <span className="text-xs text-gray-400">
                  No labels available
                </span>
              ) : filteredLabels.length === 0 ? (
                <span className="text-xs text-gray-400">
                  No matching labels
                </span>
              ) : (
                filteredLabels.map((label) => (
                  <label
                    key={label.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {label.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {label.description || "No description"}
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedConfigLabelIds.includes(label.id)}
                      onChange={() => onToggleConfigLabel(label.id)}
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          <input
            value={presetSearch}
            onChange={(event) => onPresetSearchChange(event.target.value)}
            className="mt-4 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Search presets"
          />

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Add presets</p>
              <span className="text-xs text-gray-500">
                Multi-select enabled
              </span>
            </div>
            <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
              {presetsLoading ? (
                <span className="text-xs text-gray-400">
                  Loading presets...
                </span>
              ) : presets.length === 0 ? (
                <span className="text-xs text-gray-400">
                  No presets available
                </span>
              ) : filteredPresets.length === 0 ? (
                <span className="text-xs text-gray-400">
                  No matching preset
                </span>
              ) : (
                filteredPresets.map((preset) => (
                  <label
                    key={preset.id}
                    className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                      selectedPresetIds.includes(preset.id)
                        ? "border-blue-500 bg-blue-50 text-blue-700"
                        : "border-gray-200 bg-white text-gray-700"
                    }`}
                  >
                    <div>
                      <p className="font-semibold">{preset.name}</p>
                      <p className="text-xs text-gray-500">
                        {preset.description}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {preset.labelIds.length} label ID(s)
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={selectedPresetIds.includes(preset.id)}
                      onChange={() => onTogglePreset(preset.id)}
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Apply selection
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
