import { useRef, type ChangeEvent } from "react";
import type { ManagerProjectEditProject } from "../../../interface/project/manager-project-edit.interface";

type Props = {
  project: ManagerProjectEditProject;
  editProjectName: string;
  editProjectDescription: string;
  editProjectDataType: ManagerProjectEditProject["dataType"];
  thumbnailFile: File | null;
  thumbnailPreview: string | null;
  saving: boolean;
  isProjectCompleted: boolean;
  onEditProjectNameChange: (value: string) => void;
  onEditProjectDescriptionChange: (value: string) => void;
  onEditProjectDataTypeChange: (
    value: ManagerProjectEditProject["dataType"],
  ) => void;
  onThumbnailFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveProjectInfo: () => void;
};

export default function ProjectEditInfoForm({
  project,
  editProjectName,
  editProjectDescription,
  editProjectDataType,
  thumbnailFile,
  thumbnailPreview,
  saving,
  isProjectCompleted,
  onEditProjectNameChange,
  onEditProjectDescriptionChange,
  onEditProjectDataTypeChange,
  onThumbnailFileChange,
  onSaveProjectInfo,
}: Props) {
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  return (
    <>
      <div className="rounded-md border border-gray-200 px-3 py-3">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold text-gray-900">
              {editProjectName || project.name}
            </h2>
            <p className="mt-1 text-xs text-gray-500">
              {editProjectDescription || "Example Image Classification Example"}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold text-gray-700">
            Project name
          </label>
          <input
            value={editProjectName}
            onChange={(event) => onEditProjectNameChange(event.target.value)}
            disabled={isProjectCompleted}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Project name"
          />
        </div>

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold text-gray-700">
            Project description
          </label>
          <textarea
            value={editProjectDescription}
            onChange={(event) =>
              onEditProjectDescriptionChange(event.target.value)
            }
            disabled={isProjectCompleted}
            className="min-h-[96px] rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Project description"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            Data type
          </label>
          <select
            value={editProjectDataType}
            onChange={(event) =>
              onEditProjectDataTypeChange(
                event.target.value as ManagerProjectEditProject["dataType"],
              )
            }
            disabled={isProjectCompleted}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="Image">Image</option>
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

        <div className="flex flex-col gap-1 sm:col-span-2">
          <label className="text-xs font-semibold text-gray-700">
            Project thumbnail
          </label>
          <div className="flex gap-2">
            {thumbnailPreview && (
              <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-gray-200">
                <img
                  src={thumbnailPreview}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <button
              type="button"
              onClick={() => thumbnailInputRef.current?.click()}
              disabled={isProjectCompleted}
              className="flex-1 rounded-md border border-dashed border-gray-300 px-3 py-2 text-center text-sm text-gray-600 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {thumbnailFile ? "Change thumbnail" : "Select thumbnail"}
            </button>
          </div>
          <input
            ref={thumbnailInputRef}
            type="file"
            title="Upload project thumbnail"
            accept="image/*"
            onChange={onThumbnailFileChange}
            className="hidden"
          />
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          onClick={onSaveProjectInfo}
          disabled={saving || isProjectCompleted}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          Save project info
        </button>
      </div>
    </>
  );
}
