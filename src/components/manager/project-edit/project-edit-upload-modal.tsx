import { useRef, type ChangeEvent, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Upload } from "lucide-react";

type Props = {
  open: boolean;
  closing: boolean;
  selectedUploadFiles: File[];
  onClose: () => void;
  onUploadFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onConfirmUpload: () => void;
};

export default function ProjectEditUploadModal({
  open,
  closing,
  selectedUploadFiles,
  onClose,
  onUploadFileChange,
  onConfirmUpload,
}: Props) {
  const uploadInputRef = useRef<HTMLInputElement>(null);

  if (!open) {
    return null;
  }

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
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        <div className="p-4">
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
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Confirm upload
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
