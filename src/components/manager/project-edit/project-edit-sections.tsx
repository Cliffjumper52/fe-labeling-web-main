import { useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  FileText,
  ListChecks,
  Tags,
  Upload,
  UserCheck,
  Users,
} from "lucide-react";
import { ConfirmButton } from "../../common/confirm-modal";
import type { File as ApiFile } from "../../../interface/file/file.interface";
import type {
  ManagerProjectEditAvailableLabel,
  ManagerProjectEditTeamMember,
} from "../../../interface/project/manager-project-edit.interface";

type Props = {
  uploadedFiles: string[];
  filesLoading: boolean;
  projectFiles: ApiFile[];
  assignedAnnotatorIds: string[];
  assignedReviewerIds: string[];
  annotatorIdsWithApprovedFiles: string[];
  reviewerIdsWithApprovedFiles: string[];
  annotatorTaskAssigneeIds: string[];
  reviewerTaskAssigneeIds: string[];
  configuredLabels: ManagerProjectEditAvailableLabel[];
  annotatorFileAssignments: Record<string, string[]>;
  reviewerFileAssignments: Record<string, string[]>;
  annotators: ManagerProjectEditTeamMember[];
  reviewers: ManagerProjectEditTeamMember[];
  guidelineTitle: string;
  guidelineFile: File | null;
  guidelineAttachmentUrl: string | null;
  hasProjectInstruction: boolean;
  guidelineSaving: boolean;
  configSaving: boolean;
  saving: boolean;
  onOpenUpload: () => void;
  onOpenAssignAnnotators: () => void;
  onOpenAssignReviewers: () => void;
  onOpenLabelConfig: () => void;
  deletingFileName: string | null;
  changingFileAssigneeKey: string | null;
  unassigningMemberId: string | null;
  onDeleteUploadedFile: (fileName: string) => void | Promise<void>;
  onChangeFileAssignee: (
    fileId: string,
    role: "annotator" | "reviewer",
    assigneeId: string,
  ) => void | Promise<void>;
  onClearAssignedMember: (
    role: "annotator" | "reviewer",
    id: string,
  ) => void | Promise<void>;
  onRemoveConfiguredLabel: (labelId: string) => void;
  onSaveLabelConfiguration: () => void;
  onGuidelineTitleChange: (value: string) => void;
  onGuidelineFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveGuideline: () => void;
  onDeleteProject: () => void | Promise<void>;
  onCancel: () => void;
  onCompleteProject: () => void;
  isReadyToComplete: boolean;
  isProjectCompleted: boolean;
  completingProject: boolean;
  resolveMemberName: (
    list: ManagerProjectEditTeamMember[],
    id: string,
  ) => string;
  resolveFileName: (fileId: string) => string;
  resolveNames: (
    list: ManagerProjectEditTeamMember[],
    ids: string[],
  ) => string[];
};

type SectionId = "uploads" | "annotators" | "reviewers" | "presets";

type Section = {
  id: SectionId;
  title: string;
  action: string;
  empty: string;
  icon: ReactNode;
};

const statusColors: Record<string, string> = {
  in_annotation: "bg-blue-100 text-blue-700",
  pending_review: "bg-amber-100 text-amber-700",
  requires_fix: "bg-rose-100 text-rose-700",
  approved: "bg-emerald-100 text-emerald-700",
};

export default function ProjectEditSections({
  uploadedFiles,
  filesLoading,
  projectFiles,
  assignedAnnotatorIds,
  assignedReviewerIds,
  annotatorIdsWithApprovedFiles,
  reviewerIdsWithApprovedFiles,
  annotatorTaskAssigneeIds,
  reviewerTaskAssigneeIds,
  configuredLabels,
  annotators,
  reviewers,
  guidelineTitle,
  guidelineFile,
  guidelineAttachmentUrl,
  hasProjectInstruction,
  guidelineSaving,
  configSaving,
  saving,
  onOpenUpload,
  onOpenAssignAnnotators,
  onOpenAssignReviewers,
  onOpenLabelConfig,
  deletingFileName,
  changingFileAssigneeKey,
  unassigningMemberId,
  onDeleteUploadedFile,
  onChangeFileAssignee,
  onClearAssignedMember,
  onRemoveConfiguredLabel,
  onSaveLabelConfiguration,
  onGuidelineTitleChange,
  onGuidelineFileChange,
  onSaveGuideline,
  onDeleteProject,
  onCompleteProject,
  isReadyToComplete,
  isProjectCompleted,
  completingProject,
  resolveMemberName,
}: Props) {
  const guidelineInputRef = useRef<HTMLInputElement>(null);
  const [editingAnnotatorFileId, setEditingAnnotatorFileId] = useState<
    string | null
  >(null);
  const [editingReviewerFileId, setEditingReviewerFileId] = useState<
    string | null
  >(null);
  const [pendingAnnotatorSelection, setPendingAnnotatorSelection] = useState<
    Record<string, string>
  >({});
  const [pendingReviewerSelection, setPendingReviewerSelection] = useState<
    Record<string, string>
  >({});

  const getChangeKey = (fileId: string, role: "annotator" | "reviewer") =>
    `${fileId}:${role}`;

  const openAnnotatorEditor = (file: ApiFile) => {
    if (annotatorTaskAssigneeIds.length === 0 || file.status === "approved") {
      return;
    }
    const fallback = annotatorTaskAssigneeIds[0];
    const selected =
      file.annotatorId && annotatorTaskAssigneeIds.includes(file.annotatorId)
        ? file.annotatorId
        : fallback;
    setPendingAnnotatorSelection((prev) => ({
      ...prev,
      [file.id]: selected,
    }));
    setEditingAnnotatorFileId(file.id);
  };

  const openReviewerEditor = (file: ApiFile) => {
    if (reviewerTaskAssigneeIds.length === 0 || file.status === "approved") {
      return;
    }
    const fallback = reviewerTaskAssigneeIds[0];
    const selected =
      file.reviewerId && reviewerTaskAssigneeIds.includes(file.reviewerId)
        ? file.reviewerId
        : fallback;
    setPendingReviewerSelection((prev) => ({
      ...prev,
      [file.id]: selected,
    }));
    setEditingReviewerFileId(file.id);
  };

  const handleApplyAssigneeChange = async (
    fileId: string,
    role: "annotator" | "reviewer",
    assigneeId: string | undefined,
  ) => {
    if (!assigneeId) {
      return;
    }

    await onChangeFileAssignee(fileId, role, assigneeId);

    if (role === "annotator") {
      setEditingAnnotatorFileId(null);
    } else {
      setEditingReviewerFileId(null);
    }
  };

  const sections: Section[] = [
    {
      id: "uploads",
      title: `Uploaded images (${uploadedFiles.length})`,
      action: "Upload File",
      empty: "No images uploaded",
      icon: <Upload className="h-5 w-5" />,
    },
    {
      id: "annotators",
      title: "Assign annotators",
      action: "Assign annotators",
      empty: "No annotator assigned",
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: "reviewers",
      title: "Assign reviewers",
      action: "Assign reviewers",
      empty: "No reviewer assigned",
      icon: <UserCheck className="h-5 w-5" />,
    },
    {
      id: "presets",
      title: "Labels",
      action: "Configure labels",
      empty: "No available labels",
      icon: <Tags className="h-5 w-5" />,
    },
  ];

  const handleOpenSection = (sectionId: SectionId) => {
    if (sectionId === "uploads") {
      onOpenUpload();
      return;
    }

    if (sectionId === "annotators") {
      onOpenAssignAnnotators();
      return;
    }

    if (sectionId === "reviewers") {
      onOpenAssignReviewers();
      return;
    }

    onOpenLabelConfig();
  };

  const disableCompleteProject =
    saving ||
    configSaving ||
    completingProject ||
    isProjectCompleted ||
    !isReadyToComplete;

  return (
    <>
      <div className="mt-4 flex flex-col gap-3">
        {sections.map((section) => (
          <div
            key={section.id}
            className="rounded-md border border-gray-200 px-3 py-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                {section.icon}
                {section.title}
              </div>
              <button
                type="button"
                onClick={() => handleOpenSection(section.id)}
                disabled={isProjectCompleted}
                className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {section.action}
              </button>
            </div>

            {section.id === "uploads" ? (
              filesLoading ? (
                <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                  Loading files...
                </div>
              ) : uploadedFiles.length === 0 ? (
                <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                  {section.empty}
                </div>
              ) : (
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                  {projectFiles.map((file) => {
                    const isImage = file.contentType?.startsWith("image/");
                    const statusClass =
                      statusColors[file.status] ?? "bg-gray-100 text-gray-600";

                    return (
                      <div
                        key={file.id}
                        className="group relative flex flex-col overflow-hidden rounded-md border border-gray-200 bg-white"
                      >
                        <div className="flex h-24 items-center justify-center overflow-hidden bg-gray-50">
                          {isImage ? (
                            <img
                              src={file.fileUrl}
                              alt={file.fileName}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="text-xs text-gray-400">
                              No preview
                            </span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1 px-2 py-1">
                          <p
                            className="truncate text-[11px] font-medium text-gray-700"
                            title={file.fileName}
                          >
                            {file.fileName}
                          </p>
                          <span
                            className={`self-start rounded px-1.5 py-0.5 text-[10px] font-semibold capitalize ${statusClass}`}
                          >
                            {file.status?.replaceAll("_", " ") ?? "unknown"}
                          </span>
                          <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                            <p className="min-w-0 truncate">
                              <span className="font-medium text-gray-500">
                                A:
                              </span>{" "}
                              {file.annotator?.username ?? (
                                <span className="italic text-gray-300">
                                  Unassigned
                                </span>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => openAnnotatorEditor(file)}
                              disabled={
                                isProjectCompleted ||
                                file.status === "approved" ||
                                annotatorTaskAssigneeIds.length === 0 ||
                                changingFileAssigneeKey !== null
                              }
                              className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Change
                            </button>
                          </div>
                          {editingAnnotatorFileId === file.id &&
                            file.status !== "approved" && (
                              <div className="flex items-center gap-1 text-[10px]">
                                <select
                                  value={
                                    pendingAnnotatorSelection[file.id] ?? ""
                                  }
                                  onChange={(event) =>
                                    setPendingAnnotatorSelection((prev) => ({
                                      ...prev,
                                      [file.id]: event.target.value,
                                    }))
                                  }
                                  className="min-w-0 flex-1 rounded border border-gray-300 px-1 py-0.5 text-[10px]"
                                >
                                  {annotatorTaskAssigneeIds.map((memberId) => (
                                    <option key={memberId} value={memberId}>
                                      {resolveMemberName(annotators, memberId)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleApplyAssigneeChange(
                                      file.id,
                                      "annotator",
                                      pendingAnnotatorSelection[file.id],
                                    )
                                  }
                                  disabled={
                                    changingFileAssigneeKey !== null ||
                                    !pendingAnnotatorSelection[file.id]
                                  }
                                  className="rounded bg-blue-600 px-1.5 py-0.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {changingFileAssigneeKey ===
                                  getChangeKey(file.id, "annotator")
                                    ? "..."
                                    : "Apply"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setEditingAnnotatorFileId(null)
                                  }
                                  disabled={changingFileAssigneeKey !== null}
                                  className="rounded border border-gray-300 px-1.5 py-0.5 text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}

                          <div className="flex items-center justify-between gap-2 text-[10px] text-gray-400">
                            <p className="min-w-0 truncate">
                              <span className="font-medium text-gray-500">
                                R:
                              </span>{" "}
                              {file.reviewer?.username ?? (
                                <span className="italic text-gray-300">
                                  Unassigned
                                </span>
                              )}
                            </p>
                            <button
                              type="button"
                              onClick={() => openReviewerEditor(file)}
                              disabled={
                                isProjectCompleted ||
                                file.status === "approved" ||
                                reviewerTaskAssigneeIds.length === 0 ||
                                changingFileAssigneeKey !== null
                              }
                              className="rounded border border-gray-300 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Change
                            </button>
                          </div>
                          {editingReviewerFileId === file.id &&
                            file.status !== "approved" && (
                              <div className="flex items-center gap-1 text-[10px]">
                                <select
                                  value={
                                    pendingReviewerSelection[file.id] ?? ""
                                  }
                                  onChange={(event) =>
                                    setPendingReviewerSelection((prev) => ({
                                      ...prev,
                                      [file.id]: event.target.value,
                                    }))
                                  }
                                  className="min-w-0 flex-1 rounded border border-gray-300 px-1 py-0.5 text-[10px]"
                                >
                                  {reviewerTaskAssigneeIds.map((memberId) => (
                                    <option key={memberId} value={memberId}>
                                      {resolveMemberName(reviewers, memberId)}
                                    </option>
                                  ))}
                                </select>
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleApplyAssigneeChange(
                                      file.id,
                                      "reviewer",
                                      pendingReviewerSelection[file.id],
                                    )
                                  }
                                  disabled={
                                    changingFileAssigneeKey !== null ||
                                    !pendingReviewerSelection[file.id]
                                  }
                                  className="rounded bg-blue-600 px-1.5 py-0.5 font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  {changingFileAssigneeKey ===
                                  getChangeKey(file.id, "reviewer")
                                    ? "..."
                                    : "Apply"}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setEditingReviewerFileId(null)}
                                  disabled={changingFileAssigneeKey !== null}
                                  className="rounded border border-gray-300 px-1.5 py-0.5 text-gray-600 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  Cancel
                                </button>
                              </div>
                            )}
                        </div>
                        <ConfirmButton
                          label="x"
                          variant="danger"
                          size="sm"
                          modalHeader="Delete file?"
                          modalBody={`"${file.fileName}" will be permanently deleted. This cannot be undone.`}
                          confirmLabel="Delete"
                          disabled={
                            isProjectCompleted || deletingFileName !== null
                          }
                          onConfirm={() => onDeleteUploadedFile(file.fileName)}
                          className="absolute right-1 top-1 hidden !rounded !px-1 !py-0.5 !text-[11px] group-hover:block"
                        />
                      </div>
                    );
                  })}
                </div>
              )
            ) : section.id === "annotators" ? (
              assignedAnnotatorIds.length === 0 ? (
                <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                  {section.empty}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {assignedAnnotatorIds.map((id) => {
                    const hasApprovedFiles =
                      annotatorIdsWithApprovedFiles.includes(id);

                    return (
                      <span
                        key={id}
                        title={
                          hasApprovedFiles
                            ? "Cannot remove: this annotator has at least one approved file."
                            : undefined
                        }
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                      >
                        {resolveMemberName(annotators, id)}
                        <ConfirmButton
                          label={unassigningMemberId === id ? "..." : "x"}
                          variant="danger"
                          size="sm"
                          modalHeader="Remove annotator?"
                          modalBody={`Remove "${resolveMemberName(annotators, id)}" from this project? All their task assignments will be deleted.`}
                          confirmLabel="Remove"
                          disabled={
                            isProjectCompleted ||
                            unassigningMemberId !== null ||
                            hasApprovedFiles
                          }
                          onConfirm={() =>
                            onClearAssignedMember("annotator", id)
                          }
                          className="!rounded-sm !px-1 !py-0.5 !text-[11px] !border-0 !bg-transparent !text-gray-500 hover:!bg-gray-200 hover:!text-gray-700"
                        />
                      </span>
                    );
                  })}
                </div>
              )
            ) : section.id === "reviewers" ? (
              assignedReviewerIds.length === 0 ? (
                <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                  {section.empty}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {assignedReviewerIds.map((id) => {
                    const hasApprovedFiles =
                      reviewerIdsWithApprovedFiles.includes(id);

                    return (
                      <span
                        key={id}
                        title={
                          hasApprovedFiles
                            ? "Cannot remove: this reviewer has at least one approved file."
                            : undefined
                        }
                        className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                      >
                        {resolveMemberName(reviewers, id)}
                        <ConfirmButton
                          label={unassigningMemberId === id ? "..." : "x"}
                          variant="danger"
                          size="sm"
                          modalHeader="Remove reviewer?"
                          modalBody={`Remove "${resolveMemberName(reviewers, id)}" from this project? All their task assignments will be deleted.`}
                          confirmLabel="Remove"
                          disabled={
                            isProjectCompleted ||
                            unassigningMemberId !== null ||
                            hasApprovedFiles
                          }
                          onConfirm={() =>
                            onClearAssignedMember("reviewer", id)
                          }
                          className="!rounded-sm !px-1 !py-0.5 !text-[11px] !border-0 !bg-transparent !text-gray-500 hover:!bg-gray-200 hover:!text-gray-700"
                        />
                      </span>
                    );
                  })}
                </div>
              )
            ) : section.id === "presets" ? (
              <div className="mt-2 space-y-2">
                {configuredLabels.length === 0 ? (
                  <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                    {section.empty}
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-md border border-gray-200">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-gray-50 text-[11px] uppercase tracking-wide text-gray-500">
                        <tr>
                          <th className="px-3 py-2 font-semibold">Color</th>
                          <th className="px-3 py-2 font-semibold">Name</th>
                          <th className="px-3 py-2 font-semibold">
                            Description
                          </th>
                          <th className="px-3 py-2 text-right font-semibold">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {configuredLabels.map((label) => (
                          <tr key={label.id} className="hover:bg-gray-50">
                            <td className="px-3 py-2">
                              <span
                                className="inline-block h-3 w-3 rounded-full border border-gray-200"
                                style={{
                                  backgroundColor: label.color ?? "#d1d5db",
                                }}
                              />
                            </td>
                            <td className="px-3 py-2 font-semibold text-gray-800">
                              {label.name}
                            </td>
                            <td className="px-3 py-2 text-gray-500">
                              {label.description || "No description"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <ConfirmButton
                                label="Remove"
                                variant="danger"
                                size="sm"
                                modalHeader="Remove label?"
                                modalBody={`Remove label "${label.name}" from this project?`}
                                confirmLabel="Remove"
                                disabled={isProjectCompleted}
                                onConfirm={() =>
                                  onRemoveConfiguredLabel(label.id)
                                }
                                className="!rounded-sm !px-2 !py-1 !text-[11px]"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onSaveLabelConfiguration}
                    disabled={configSaving || isProjectCompleted}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    Save label configuration
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                {section.empty}
              </div>
            )}

            {/* {section.id === "annotators" &&
              Object.keys(annotatorFileAssignments).length > 0 && (
                <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700">
                  <p className="font-semibold text-gray-800">Assigned files</p>
                  <div className="mt-2 flex flex-col gap-1">
                    {Object.entries(annotatorFileAssignments).map(
                      ([fileId, ids]) => (
                        <span key={fileId}>
                          {resolveFileName(fileId)}:{" "}
                          {resolveNames(annotators, ids).join(", ")}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}

            {section.id === "reviewers" &&
              Object.keys(reviewerFileAssignments).length > 0 && (
                <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700">
                  <p className="font-semibold text-gray-800">Assigned files</p>
                  <div className="mt-2 flex flex-col gap-1">
                    {Object.entries(reviewerFileAssignments).map(
                      ([fileId, ids]) => (
                        <span key={fileId}>
                          {resolveFileName(fileId)}:{" "}
                          {resolveNames(reviewers, ids).join(", ")}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )} */}
          </div>
        ))}

        <div className="rounded-md border border-gray-200 px-3 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <ListChecks className="h-5 w-5" />
              Guideline
            </div>
            <button
              type="button"
              onClick={() => guidelineInputRef.current?.click()}
              disabled={isProjectCompleted}
              className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700 disabled:cursor-not-allowed disabled:opacity-70"
            >
              Select file
            </button>
          </div>

          <input
            ref={guidelineInputRef}
            type="file"
            title="Guideline attachment"
            onChange={onGuidelineFileChange}
            className="hidden"
          />

          <div className="mt-2 flex flex-col gap-2">
            <input
              value={guidelineTitle}
              onChange={(event) => onGuidelineTitleChange(event.target.value)}
              disabled={isProjectCompleted}
              className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="guideline name"
            />

            {(guidelineFile || guidelineAttachmentUrl) && (
              <div className="mt-2 flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                <FileText className="h-4 w-4 shrink-0 text-gray-400" />
                {guidelineFile ? (
                  <span className="truncate text-xs text-gray-600">
                    {guidelineFile.name}
                  </span>
                ) : (
                  <a
                    href={guidelineAttachmentUrl!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="truncate text-xs text-blue-600 hover:underline"
                  >
                    {guidelineAttachmentUrl?.split("/").pop()}
                  </a>
                )}
              </div>
            )}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={onSaveGuideline}
                disabled={guidelineSaving || isProjectCompleted}
                className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {hasProjectInstruction
                  ? "Update guideline"
                  : "Create guideline"}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
        <ConfirmButton
          label="Delete project"
          variant="danger"
          className="!rounded-md"
          disabled={isProjectCompleted}
          modalHeader="Delete this project?"
          modalBody="This will permanently delete the project and cannot be undone."
          confirmLabel="Delete project"
          onConfirm={onDeleteProject}
        />
        {/* <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white"
        >
          Cancel
        </button> */}
        <ConfirmButton
          label={
            isProjectCompleted
              ? "Project completed"
              : completingProject
                ? "Completing..."
                : "Complete project"
          }
          variant="primary"
          className="!rounded-md"
          disabled={disableCompleteProject}
          modalHeader="Complete this project?"
          modalBody="This will mark the project as completed. Make sure all files are fully approved before continuing."
          confirmLabel="Complete project"
          onConfirm={onCompleteProject}
        />
      </div>
    </>
  );
}
