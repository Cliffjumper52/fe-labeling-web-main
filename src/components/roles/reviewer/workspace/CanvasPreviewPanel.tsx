import type { File as ProjectFile } from "../../../../interface/file/file.interface";
import type { FileLabel } from "../../../../interface/file-label/file-label.interface";
import { FileLabelStatusEnums } from "../../../../interface/file-label/enums/file-label.enums";

const mapStatusToDotClass = (status: FileLabel["status"]): string => {
  if (status === "approved" || status === "done") {
    return "bg-emerald-500";
  }

  if (status === "rejected" || status === "reassigned") {
    return "bg-rose-500";
  }

  if (
    status === "pending_review" ||
    status === "reviewed" ||
    status === "in_progress"
  ) {
    return "bg-amber-400";
  }

  return "bg-gray-300";
};

type Props = {
  reviewerFiles: ProjectFile[];
  selectedFile: ProjectFile | null;
  canPreviewSelectedFile: boolean;
  filesError: string | null;
  onSelectFile: (file: ProjectFile) => void;
};

const isKnownFileLabelStatus = (
  status: unknown,
): status is FileLabel["status"] => {
  if (typeof status !== "string") {
    return false;
  }

  return (Object.values(FileLabelStatusEnums) as string[]).includes(status);
};

const getFileLabelStatuses = (file: ProjectFile): FileLabel["status"][] => {
  const refs = file.fileLabels as unknown[] | undefined;
  if (!refs?.length) {
    return [];
  }

  return refs
    .map((item) => {
      if (!item || typeof item !== "object") {
        return undefined;
      }

      return (item as { status?: unknown }).status;
    })
    .filter(isKnownFileLabelStatus);
};

export default function CanvasPreviewPanel({
  reviewerFiles,
  selectedFile,
  canPreviewSelectedFile,
  filesError,
  onSelectFile,
}: Props) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Canvas Preview</p>
        <span className="rounded-md bg-gray-100 px-2 py-1 text-xs font-semibold text-gray-500">
          Read-only
        </span>
      </div>

      {canPreviewSelectedFile && selectedFile ? (
        <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
          <div className="h-[420px] overflow-hidden rounded-md border border-gray-200 bg-white">
            <div className="flex h-full items-center justify-center p-3">
              <img
                src={selectedFile.fileUrl}
                alt={selectedFile.fileName || selectedFile.id}
                draggable={false}
                className="h-auto max-h-full w-auto max-w-full object-contain"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-4 flex h-[420px] items-center justify-center rounded-md border border-dashed border-gray-300 bg-gray-50 text-sm text-gray-500">
          {selectedFile
            ? "Selected file is not an image preview."
            : "Canvas preview is unavailable for this task."}
        </div>
      )}

      <div className="mt-4 rounded-md border border-gray-200 bg-gray-50 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
          Files in task
        </p>

        {reviewerFiles.length > 0 ? (
          <div className="mt-2 flex flex-wrap gap-2">
            {reviewerFiles.map((file) => {
              const statuses = getFileLabelStatuses(file);

              return (
                <button
                  key={file.id}
                  type="button"
                  title={file.id}
                  onClick={() => onSelectFile(file)}
                  className={`max-w-full rounded-md border px-2 py-1 text-xs ${
                    selectedFile?.id === file.id
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-200 bg-white text-gray-700"
                  }`}
                >
                  <div className="flex flex-col items-start gap-1">
                    <span className="block max-w-[220px] truncate">
                      {file.fileName || file.id}
                    </span>

                    {statuses.length > 0 ? (
                      <span className="inline-flex items-center gap-1">
                        {statuses.map((status, index) => (
                          <span
                            key={`${file.id}-${status}-${index}`}
                            className={`h-2 w-2 rounded-full ${mapStatusToDotClass(status)}`}
                          />
                        ))}
                      </span>
                    ) : null}
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <p className="mt-2 text-xs text-gray-500">
            No files found for this project and reviewer.
          </p>
        )}

        {filesError ? (
          <p className="mt-2 rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
            {filesError}
          </p>
        ) : null}
      </div>
    </div>
  );
}
