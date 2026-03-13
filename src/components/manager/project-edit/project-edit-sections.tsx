import { useRef, type ChangeEvent, type ReactNode } from "react";
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
  onDeleteUploadedFile: (fileName: string) => void;
  onClearAssignedMember: (role: "annotator" | "reviewer", id: string) => void;
  onRemoveConfiguredLabel: (labelId: string) => void;
  onSaveLabelConfiguration: () => void;
  onGuidelineTitleChange: (value: string) => void;
  onGuidelineFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onSaveGuideline: () => void;
  onDeleteProject: () => void;
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
  configuredLabels,
  annotatorFileAssignments,
  reviewerFileAssignments,
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
  onDeleteUploadedFile,
  onClearAssignedMember,
  onRemoveConfiguredLabel,
  onSaveLabelConfiguration,
  onGuidelineTitleChange,
  onGuidelineFileChange,
  onSaveGuideline,
  onDeleteProject,
  onCancel,
  onCompleteProject,
  isReadyToComplete,
  isProjectCompleted,
  completingProject,
  resolveMemberName,
  resolveFileName,
  resolveNames,
}: Props) {
  const guidelineInputRef = useRef<HTMLInputElement>(null);

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
                        </div>
                        <button
                          type="button"
                          onClick={() => onDeleteUploadedFile(file.fileName)}
                          disabled={isProjectCompleted}
                          className="absolute right-1 top-1 hidden rounded bg-white/80 px-1 py-0.5 text-[11px] text-gray-500 hover:bg-rose-50 hover:text-rose-600 group-hover:block"
                          aria-label={`Delete ${file.fileName}`}
                        >
                          x
                        </button>
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
                  {assignedAnnotatorIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {resolveMemberName(annotators, id)}
                      <button
                        type="button"
                        onClick={() => onClearAssignedMember("annotator", id)}
                        disabled={isProjectCompleted}
                        className="rounded-sm px-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                        aria-label={`Remove ${resolveMemberName(annotators, id)}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )
            ) : section.id === "reviewers" ? (
              assignedReviewerIds.length === 0 ? (
                <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                  {section.empty}
                </div>
              ) : (
                <div className="mt-2 flex flex-wrap gap-2">
                  {assignedReviewerIds.map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {resolveMemberName(reviewers, id)}
                      <button
                        type="button"
                        onClick={() => onClearAssignedMember("reviewer", id)}
                        disabled={isProjectCompleted}
                        className="rounded-sm px-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                        aria-label={`Remove ${resolveMemberName(reviewers, id)}`}
                      >
                        x
                      </button>
                    </span>
                  ))}
                </div>
              )
            ) : section.id === "presets" ? (
              <div className="mt-2 space-y-2">
                {configuredLabels.length === 0 ? (
                  <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                    {section.empty}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {configuredLabels.map((label) => (
                      <div
                        key={label.id}
                        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2 text-gray-800">
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-gray-200"
                            style={{
                              backgroundColor: label.color ?? "#d1d5db",
                            }}
                          />
                          <span className="font-semibold">{label.name}</span>
                        </div>
                        <p className="mt-1 text-gray-500">
                          {label.description || "No description"}
                        </p>
                        <button
                          type="button"
                          onClick={() => onRemoveConfiguredLabel(label.id)}
                          disabled={isProjectCompleted}
                          className="mt-2 rounded-sm border border-gray-300 px-2 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100"
                        >
                          Remove label
                        </button>
                      </div>
                    ))}
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

            {section.id === "annotators" &&
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
              )}
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
        <button
          type="button"
          onClick={onDeleteProject}
          className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
        >
          Delete project
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white"
        >
          Cancel
        </button>
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
