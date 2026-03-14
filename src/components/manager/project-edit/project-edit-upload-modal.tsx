import { useRef, type ChangeEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Upload } from "lucide-react";

type Props = {
  open: boolean;
  closing: boolean;
  selectedUploadFiles: File[];
  isUploading: boolean;
  onClose: () => void;
  onUploadFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onConfirmUpload: () => void;
};

export default function ProjectEditUploadModal({
  open,
  closing,
  selectedUploadFiles,
  isUploading,
  onClose,
  onUploadFileChange,
  onConfirmUpload,
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return null;
  }

  const handleOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (!isUploading && event.target === event.currentTarget) {
      onClose();
    }
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4"
      onClick={handleOverlayClick}
    >
      <div
        className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
          closing ? "modal-pop-out" : "modal-pop"
        }`}
      >
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-base font-semibold text-gray-800">
            Upload Images
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
            aria-label="Close"
            disabled={isUploading}
          >
            ✕
          </button>
        </div>

        <fieldset disabled={isUploading} className="p-4">
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-center">
            <Upload className="h-8 w-8 text-gray-400" />
            <p className="mt-3 text-sm font-semibold text-gray-700">
              Drop files here or click to upload
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {selectedUploadFiles.length > 0
                ? `${selectedUploadFiles.length} file(s) selected`
                : "Support for image files (JPG, PNG, etc)"}
            </p>
            <button
              type="button"
              onClick={() => uploadInputRef.current?.click()}
              className="mt-4 rounded-md bg-blue-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-blue-700"
            >
              Select Files
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              title="Upload project files"
              accept="image/*"
              multiple
              onChange={onUploadFileChange}
              className="hidden"
            />
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onConfirmUpload}
              disabled={isUploading}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUploading ? (
                <>
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                    <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
                  </svg>
                  Uploading...
                </>
              ) : (
                "Confirm upload"
              )}
            </button>
          </div>
        </fieldset>
      </div>
    </div>,
    document.body,
  );
}
