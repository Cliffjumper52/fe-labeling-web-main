import {
  useMemo,
  useRef,
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
} from "react";
import { createPortal } from "react-dom";
import type { DataType } from "../../../interface/enums/domain.enums";
import type { ManagerLabelPresetOption } from "../../../interface/project/manager-projects.interface";

type Props = {
  open: boolean;
  onClose: () => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  isCreating: boolean;
  projectName: string;
  projectDescription: string;
  projectDataType: DataType;
  onProjectNameChange: (value: string) => void;
  onProjectDescriptionChange: (value: string) => void;
  onProjectDataTypeChange: (value: DataType) => void;
  createThumbnailPreview: string | null;
  createThumbnailFile: File | null;
  onCreateThumbnailFileChange: (file: File | null) => void;
  createPresetSearch: string;
  onCreatePresetSearchChange: (value: string) => void;
  presets: ManagerLabelPresetOption[];
  presetsLoading: boolean;
  selectedPresetIds: string[];
  onTogglePreset: (id: string) => void;
};

export default function CreateProjectModal({
  open,
  onClose,
  onSubmit,
  isCreating,
  projectName,
  projectDescription,
  projectDataType,
  onProjectNameChange,
  onProjectDescriptionChange,
  onProjectDataTypeChange,
  createThumbnailPreview,
  createThumbnailFile,
  onCreateThumbnailFileChange,
  createPresetSearch,
  onCreatePresetSearchChange,
  presets,
  presetsLoading,
  selectedPresetIds,
  onTogglePreset,
}: Props) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  const visiblePresets = useMemo(() => {
    const keyword = createPresetSearch.trim().toLowerCase();
    if (!keyword) {
      return presets;
    }

    return presets.filter((preset) =>
      `${preset.name} ${preset.description ?? ""}`
        .toLowerCase()
        .includes(keyword),
    );
  }, [createPresetSearch, presets]);

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isCreating && event.target === event.currentTarget) {
      onClose();
    }
  };

  const handleThumbnailChange = (event: ChangeEvent<HTMLInputElement>) => {
    onCreateThumbnailFileChange(event.target.files?.[0] ?? null);
  };

  if (!open) {
    return null;
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
      onClick={handleOverlayClick}
    >
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-800">
            Create new project
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
            disabled={isCreating}
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

        <form onSubmit={onSubmit} className="flex flex-col gap-4 p-4">
          <fieldset disabled={isCreating} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Project name
            </label>
            <input
              value={projectName}
              onChange={(event) => onProjectNameChange(event.target.value)}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Example name"
              required
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Project description
            </label>
            <textarea
              value={projectDescription}
              onChange={(event) =>
                onProjectDescriptionChange(event.target.value)
              }
              className="min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Example description"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Data type
            </label>
            <select
              value={projectDataType}
              onChange={(event) =>
                onProjectDataTypeChange(event.target.value as DataType)
              }
              title="Project data type"
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="image">Image</option>
              <option value="Video" disabled>
                Video (coming soon)
              </option>
              <option value="Text" disabled>
                Text (coming soon)
              </option>
              <option value="Audio" disabled>
                Audio (coming soon)
              </option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Project thumbnail
            </label>
            <div className="flex gap-2">
              {createThumbnailPreview && (
                <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                  <img
                    src={createThumbnailPreview}
                    alt="Thumbnail preview"
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              <button
                type="button"
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex-1 rounded-md border border-dashed border-gray-300 px-3 py-2 text-center text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50"
              >
                {createThumbnailFile ? "Change thumbnail" : "Select thumbnail"}
              </button>
            </div>
            <input
              ref={thumbnailInputRef}
              type="file"
              title="Upload project thumbnail"
              accept="image/*"
              onChange={handleThumbnailChange}
              className="hidden"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-semibold text-gray-700">
              Label presets <span className="text-red-500">*</span>
            </label>
            <input
              value={createPresetSearch}
              onChange={(event) =>
                onCreatePresetSearchChange(event.target.value)
              }
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="Search presets..."
            />

            <div className="mt-2 max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-200 p-2">
              {presetsLoading ? (
                <p className="text-xs text-gray-400">Loading presets...</p>
              ) : visiblePresets.length === 0 ? (
                <p className="text-xs text-gray-400">No presets found.</p>
              ) : (
                visiblePresets.map((preset) => (
                  <label
                    key={preset.id}
                    className="flex items-start justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <div>
                      <p className="font-semibold text-gray-800">
                        {preset.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {preset.description || "No description"}
                      </p>
                      <p className="mt-1 text-[11px] text-gray-400">
                        {preset.labelIds.length} labels
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

            {selectedPresetIds.length > 0 && (
              <p className="text-xs text-gray-500">
                {selectedPresetIds.length} preset(s) selected
              </p>
            )}
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isCreating}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isCreating ? (
                <>
                  <svg
                    className="h-4 w-4 animate-spin"
                    viewBox="0 0 24 24"
                    fill="none"
                  >
                    <circle
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      className="opacity-25"
                    />
                    <path
                      d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                      fill="currentColor"
                      className="opacity-75"
                    />
                  </svg>
                  Creating...
                </>
              ) : (
                <>
                  <span className="text-base leading-none">+</span>
                  Create Project
                </>
              )}
            </button>
          </div>
          </fieldset>
        </form>
      </div>
    </div>,
    document.body,
  );
}
