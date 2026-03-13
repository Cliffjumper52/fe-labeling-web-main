import type { MouseEvent } from "react";
import { createPortal } from "react-dom";
import type { File as ApiFile } from "../../../interface/file/file.interface";
import type { ManagerProjectEditTeamMember } from "../../../interface/project/manager-project-edit.interface";

type Props = {
  open: boolean;
  closing: boolean;
  title: string;
  searchPlaceholder: string;
  search: string;
  onSearchChange: (value: string) => void;
  members: ManagerProjectEditTeamMember[];
  selectedMemberId: string | null;
  onSelectMember: (id: string | null) => void;
  selectedFiles: string[];
  onClearFiles: () => void;
  filesLoading: boolean;
  unassignedFiles: ApiFile[];
  onToggleFile: (fileId: string) => void;
  onConfirm: () => void;
  onClose: () => void;
};

export default function ProjectEditAssignModal({
  open,
  closing,
  title,
  searchPlaceholder,
  search,
  onSearchChange,
  members,
  selectedMemberId,
  onSelectMember,
  selectedFiles,
  onClearFiles,
  filesLoading,
  unassignedFiles,
  onToggleFile,
  onConfirm,
  onClose,
}: Props) {
  if (!open) {
    return null;
  }

  const visibleMembers = members.filter((member) =>
    `${member.name} ${member.email}`
      .toLowerCase()
      .includes(search.toLowerCase()),
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
          <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
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
          <input
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder={searchPlaceholder}
          />

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">Assign user</p>
              <button
                type="button"
                onClick={() => onSelectMember(null)}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Clear
              </button>
            </div>
            <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
              {visibleMembers.map((member) => (
                <label
                  key={member.id}
                  className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                >
                  <div>
                    <p className="font-semibold text-gray-800">{member.name}</p>
                    <p className="text-xs text-gray-500">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500">
                      {member.workload}
                    </span>
                    <input
                      type="radio"
                      name={`${title}-selected-member`}
                      checked={selectedMemberId === member.id}
                      onChange={() => onSelectMember(member.id)}
                    />
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-800">
                Assign to files
              </p>
              <button
                type="button"
                onClick={onClearFiles}
                className="text-xs font-semibold text-gray-500 hover:text-gray-700"
              >
                Clear files
              </button>
            </div>
            <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
              {filesLoading ? (
                <p className="text-xs text-gray-400">
                  Loading unassigned files...
                </p>
              ) : unassignedFiles.length === 0 ? (
                <p className="text-xs text-gray-400">
                  No unassigned files available.
                </p>
              ) : (
                unassignedFiles.map((file) => (
                  <label
                    key={file.id}
                    className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                  >
                    <span className="truncate">{file.fileName}</span>
                    <input
                      type="checkbox"
                      checked={selectedFiles.includes(file.id)}
                      onChange={() => onToggleFile(file.id)}
                    />
                  </label>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={onConfirm}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              Confirm assign
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
