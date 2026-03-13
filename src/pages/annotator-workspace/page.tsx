import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/auth-context.context";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { EntityReference } from "../../interface/common/base-entity.interface";
import type { File as ProjectFile } from "../../interface/file/file.interface";
import type { FileLabel } from "../../interface/file-label/file-label.interface";
import type { AnnotatorSubmitDto } from "../../interface/file-label/dtos/annotator-submit.dto";
import type { ChecklistAnswer } from "../../interface/checklist-answer/checklist-answer.interface";
import type { LabelChecklistQuestion } from "../../interface/label-checklist-question/label-checklist-question.interface";
import type { Label } from "../../interface/label/label.interface";
import type { Project } from "../../interface/project/project.interface";
import type { ProjectInstruction } from "../../interface/project-instruction/project-instruction.interface";
import type { ProjectTask } from "../../interface/project-task/project-task.interface";
import {
  annotatorSubmitFileLabels,
  deleteFileLabel,
  getAllFileLabels,
} from "../../services/file-label-service.service";
import { getAllFiles } from "../../services/file-service.service";
import { FileStatus } from "../../interface/file/enums/file-status.enums";
import { updateFile } from "../../services/file-service.service";
import { getAllLabelChecklistQuestions } from "../../services/label-checklist-question-service.service";
import { getAllowedLabelsInProject } from "../../services/label-service.service";
import { getProjectInstructionByProjectId } from "../../services/project-instruction-service.service";
import { getProjectTaskById } from "../../services/project-task-service.service";
import TaskDetailsPanel from "../../components/annotator/workspace/task-details-panel";
import CanvasPreviewPanel from "../../components/annotator/workspace/canvas-preview-panel";
import AssignedLabelsPanel from "../../components/annotator/workspace/assigned-label-panel";
import WorkflowModal, {
  type WorkflowModalMode,
} from "../../components/annotator/workspace/workflow-modal";

const extractApiData = <T,>(payload: unknown): T | null => {
  const apiResponse = payload as ApiResponse<T>;
  if (apiResponse && typeof apiResponse === "object" && "data" in apiResponse) {
    return apiResponse.data;
  }

  if (payload && typeof payload === "object") {
    return payload as T;
  }

  return null;
};

const extractArrayApiData = <T,>(payload: unknown): T[] => {
  const data = extractApiData<unknown>(payload);

  if (Array.isArray(data)) {
    return data as T[];
  }

  if (
    data &&
    typeof data === "object" &&
    "items" in data &&
    Array.isArray((data as { items?: unknown }).items)
  ) {
    return (data as { items: T[] }).items;
  }

  return [];
};

const mapTaskStatusToText = (status: ProjectTask["status"]): string => {
  if (status === "assigned" || status === "in_progress") {
    return "In Progress";
  }

  if (status === "pending_review") {
    return "Pending Review";
  }

  if (status === "rejected") {
    return "Returned";
  }

  return "Completed";
};

const mapFileLabelStatusToBadge = (status: FileLabel["status"]): string => {
  if (status === "approved" || status === "done") {
    return "bg-emerald-100 text-emerald-700";
  }

  if (status === "rejected" || status === "reassigned") {
    return "bg-red-100 text-red-700";
  }

  if (
    status === "pending_review" ||
    status === "reviewed" ||
    status === "in_progress"
  ) {
    return "bg-amber-100 text-amber-700";
  }

  return "bg-gray-100 text-gray-600";
};

const mapFileLabelStatusToText = (status: FileLabel["status"]): string => {
  return status.replaceAll("_", " ");
};

const isChecklistAnswerSnapshot = (
  item: EntityReference | ChecklistAnswer,
): item is ChecklistAnswer => {
  return Boolean(item && typeof item === "object" && "answerData" in item);
};

export default function AnnotatorWorkspacePage() {
  const { id } = useParams();
  const { getUserInfo } = useAuth();

  const [currentUser] = useState(() => {
    try {
      return getUserInfo();
    } catch {
      return null;
    }
  });

  const [taskById, setTaskById] = useState<ProjectTask | null>(null);
  const [projectInstruction, setProjectInstruction] =
    useState<ProjectInstruction | null>(null);
  const [projectLabels, setProjectLabels] = useState<Label[]>([]);
  const [assignedFiles, setAssignedFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [assignedFileLabels, setAssignedFileLabels] = useState<FileLabel[]>([]);
  const [loadingAssignedFileLabels, setLoadingAssignedFileLabels] =
    useState(false);
  const [assignedFileLabelsError, setAssignedFileLabelsError] = useState<
    string | null
  >(null);
  const [removingFileLabelId, setRemovingFileLabelId] = useState<string | null>(
    null,
  );
  const [labelSearch, setLabelSearch] = useState("");
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [checklistAnswersByLabelId, setChecklistAnswersByLabelId] = useState<
    Record<string, Record<string, { answer: boolean; notes: string }>>
  >({});
  const [submissionNotesByLabelId, setSubmissionNotesByLabelId] = useState<
    Record<string, string>
  >({});
  const [checklistQuestionsByLabelId, setChecklistQuestionsByLabelId] =
    useState<Record<string, LabelChecklistQuestion[]>>({});
  const [loadingChecklistQuestions, setLoadingChecklistQuestions] =
    useState(false);
  const [checklistQuestionsError, setChecklistQuestionsError] = useState<
    string | null
  >(null);
  const [workflowModalMode, setWorkflowModalMode] =
    useState<WorkflowModalMode | null>(null);
  const [workflowLabelName, setWorkflowLabelName] = useState<string | null>(
    null,
  );
  const [workflowLabelId, setWorkflowLabelId] = useState<string | null>(null);
  const [workflowFileLabelId, setWorkflowFileLabelId] = useState<string | null>(
    null,
  );
  const [submittingChecklist, setSubmittingChecklist] = useState(false);
  const [submitChecklistError, setSubmitChecklistError] = useState<
    string | null
  >(null);
  const [submitChecklistSuccess, setSubmitChecklistSuccess] = useState<
    string | null
  >(null);
  const [fileLabelsReloadToken, setFileLabelsReloadToken] = useState(0);
  const [filesError, setFilesError] = useState<string | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);

  const project = useMemo<Project | null>(() => {
    if (!taskById?.project) {
      return null;
    }

    if ("name" in taskById.project) {
      return taskById.project;
    }

    return null;
  }, [taskById?.project]);

  const taskStatusText = useMemo(() => {
    if (!taskById) {
      return "In Progress";
    }

    return mapTaskStatusToText(taskById.status);
  }, [taskById]);

  const showPendingReviewBadge = useMemo(
    () => taskById?.status === "pending_review",
    [taskById?.status],
  );

  const instructionItems = useMemo<string[]>(() => {
    const content = projectInstruction?.content?.trim();
    if (!content) {
      return [];
    }

    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [projectInstruction?.content]);

  const allowedLabelNames = useMemo(
    () => projectLabels.map((label) => label.name),
    [projectLabels],
  );

  const filteredLabels = useMemo(() => {
    const keyword = labelSearch.trim().toLowerCase();
    if (!keyword) {
      return allowedLabelNames;
    }

    return allowedLabelNames.filter((label) =>
      label.toLowerCase().includes(keyword),
    );
  }, [allowedLabelNames, labelSearch]);

  const labelNameById = useMemo(() => {
    const entries = projectLabels.map(
      (label) => [label.id, label.name] as const,
    );
    return new Map<string, string>(entries);
  }, [projectLabels]);

  const selectedLabelId = useMemo(() => {
    if (!selectedLabel) {
      return null;
    }

    const found = projectLabels.find((label) => label.name === selectedLabel);
    return found?.id ?? null;
  }, [projectLabels, selectedLabel]);

  const isSelectedLabelAssigned = useMemo(() => {
    if (!selectedLabelId || !selectedFile?.id) {
      return false;
    }

    return assignedFileLabels.some((item) => item.labelId === selectedLabelId);
  }, [assignedFileLabels, selectedFile?.id, selectedLabelId]);

  const canAddSelectedLabel = useMemo(
    () =>
      Boolean(selectedFile?.id && selectedLabelId && !isSelectedLabelAssigned),
    [isSelectedLabelAssigned, selectedFile?.id, selectedLabelId],
  );

  const workflowChecklistQuestions = useMemo<LabelChecklistQuestion[]>(() => {
    if (!workflowLabelId) {
      return [];
    }

    return checklistQuestionsByLabelId[workflowLabelId] ?? [];
  }, [checklistQuestionsByLabelId, workflowLabelId]);

  const workflowAnswersByQuestionId = useMemo<
    Record<string, { answer: boolean; notes: string }>
  >(() => {
    if (!workflowLabelId) {
      return {};
    }

    return checklistAnswersByLabelId[workflowLabelId] ?? {};
  }, [checklistAnswersByLabelId, workflowLabelId]);

  const workflowRequiredCount = useMemo(
    () =>
      workflowChecklistQuestions.filter((question) => question.isRequired)
        .length,
    [workflowChecklistQuestions],
  );

  const workflowAnsweredCount = useMemo(
    () =>
      workflowChecklistQuestions.filter(
        (question) => workflowAnswersByQuestionId[question.id]?.answer,
      ).length,
    [workflowAnswersByQuestionId, workflowChecklistQuestions],
  );

  const workflowRequiredAnsweredCount = useMemo(
    () =>
      workflowChecklistQuestions.filter(
        (question) =>
          question.isRequired &&
          workflowAnswersByQuestionId[question.id]?.answer,
      ).length,
    [workflowAnswersByQuestionId, workflowChecklistQuestions],
  );

  const hasMissingRequiredChecklist = useMemo(
    () => workflowRequiredAnsweredCount < workflowRequiredCount,
    [workflowRequiredAnsweredCount, workflowRequiredCount],
  );

  const workflowSubmissionNotes = useMemo(() => {
    if (!workflowLabelId) {
      return "";
    }

    return submissionNotesByLabelId[workflowLabelId] ?? "";
  }, [submissionNotesByLabelId, workflowLabelId]);

  const workflowFileLabel = useMemo<FileLabel | null>(() => {
    if (!workflowFileLabelId) {
      return null;
    }

    return (
      assignedFileLabels.find((item) => item.id === workflowFileLabelId) ?? null
    );
  }, [assignedFileLabels, workflowFileLabelId]);

  const workflowChecklistHistory = useMemo<ChecklistAnswer[]>(() => {
    const snapshots = workflowFileLabel?.checklistAnswers;
    if (!snapshots?.length) {
      return [];
    }

    return snapshots
      .filter(isChecklistAnswerSnapshot)
      .slice()
      .sort((left, right) => {
        if (left.labelAttemptNumber !== right.labelAttemptNumber) {
          return left.labelAttemptNumber - right.labelAttemptNumber;
        }

        return left.createdAt.localeCompare(right.createdAt);
      });
  }, [workflowFileLabel?.checklistAnswers]);

  const canPreviewSelectedFile = useMemo(() => {
    if (!selectedFile?.fileUrl || !selectedFile.contentType) {
      return false;
    }

    return selectedFile.contentType.startsWith("image/");
  }, [selectedFile]);

  const canSubmitChecklistByFileStatus = useMemo(() => {
    if (!selectedFile?.status) {
      return false;
    }

    return (
      selectedFile.status === "in_annotation" ||
      selectedFile.status === "requires_fix"
    );
  }, [selectedFile?.status]);

  const canSubmitFileForReview = useMemo(
    () =>
      selectedFile?.status === "in_annotation" ||
      selectedFile?.status === "requires_fix",
    [selectedFile?.status],
  );

  useEffect(() => {
    let cancelled = false;

    const loadWorkspaceMeta = async () => {
      if (!id) {
        return;
      }

      setMetaError(null);
      setFilesError(null);

      try {
        if (!currentUser?.id) {
          throw new Error(
            "Cannot determine current annotator from auth context.",
          );
        }

        const taskResp = await getProjectTaskById(id);
        const fetchedTask = extractApiData<ProjectTask>(taskResp);

        if (!fetchedTask) {
          throw new Error("Task was not found.");
        }

        if (cancelled) {
          return;
        }

        setTaskById(fetchedTask);

        const projectId = fetchedTask.projectId;
        const [instructionResult, labelsResult, filesResult] =
          await Promise.allSettled([
            getProjectInstructionByProjectId(projectId),
            getAllowedLabelsInProject(projectId, {}),
            getAllFiles({ projectId, annotatorId: currentUser.id }),
          ]);

        if (cancelled) {
          return;
        }

        if (instructionResult.status === "fulfilled") {
          setProjectInstruction(
            extractApiData<ProjectInstruction>(instructionResult.value),
          );
        } else {
          setProjectInstruction(null);
        }

        if (labelsResult.status === "fulfilled") {
          setProjectLabels(extractApiData<Label[]>(labelsResult.value) ?? []);
        } else {
          setProjectLabels([]);
        }

        if (filesResult.status === "fulfilled") {
          const files = extractArrayApiData<ProjectFile>(filesResult.value);
          setAssignedFiles(files);
          setSelectedFile(files[0] ?? null);
        } else {
          setAssignedFiles([]);
          setSelectedFile(null);
          setFilesError(
            filesResult.reason instanceof Error
              ? filesResult.reason.message
              : "Failed to load files by project and annotator.",
          );
        }
      } catch (error) {
        if (cancelled) {
          return;
        }

        setMetaError(
          error instanceof Error
            ? error.message
            : "Failed to load task workspace context.",
        );
      }
    };

    void loadWorkspaceMeta();

    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, id]);

  useEffect(() => {
    if (assignedFiles.length === 0) {
      setSelectedFile(null);
      return;
    }

    const selectedExists = selectedFile
      ? assignedFiles.some((file) => file.id === selectedFile.id)
      : false;

    if (!selectedExists) {
      setSelectedFile(assignedFiles[0]);
    }
  }, [assignedFiles, selectedFile]);

  useEffect(() => {
    if (selectedLabel && !allowedLabelNames.includes(selectedLabel)) {
      setSelectedLabel(null);
    }
  }, [allowedLabelNames, selectedLabel]);

  useEffect(() => {
    let cancelled = false;

    const loadAssignedFileLabels = async () => {
      if (!selectedFile?.id) {
        setAssignedFileLabels([]);
        setAssignedFileLabelsError(null);
        return;
      }

      setLoadingAssignedFileLabels(true);
      setAssignedFileLabelsError(null);

      try {
        const resp = await getAllFileLabels({ fileId: selectedFile.id });
        if (cancelled) {
          return;
        }

        setAssignedFileLabels(extractArrayApiData<FileLabel>(resp));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setAssignedFileLabels([]);
        setAssignedFileLabelsError(
          error instanceof Error
            ? error.message
            : "Failed to load assigned labels.",
        );
      } finally {
        if (!cancelled) {
          setLoadingAssignedFileLabels(false);
        }
      }
    };

    void loadAssignedFileLabels();

    return () => {
      cancelled = true;
    };
  }, [fileLabelsReloadToken, selectedFile]);

  useEffect(() => {
    setSubmitChecklistError(null);
    setSubmitChecklistSuccess(null);
  }, [workflowLabelId, workflowModalMode]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkflowChecklistQuestions = async () => {
      if (!workflowLabelId) {
        setLoadingChecklistQuestions(false);
        setChecklistQuestionsError(null);
        return;
      }

      if (checklistQuestionsByLabelId[workflowLabelId]) {
        setChecklistQuestionsError(null);
        return;
      }

      setLoadingChecklistQuestions(true);
      setChecklistQuestionsError(null);

      try {
        const resp = await getAllLabelChecklistQuestions({
          role: "annotator",
          labelId: workflowLabelId,
        });

        if (cancelled) {
          return;
        }

        setChecklistQuestionsByLabelId((prev) => ({
          ...prev,
          [workflowLabelId]: extractArrayApiData<LabelChecklistQuestion>(resp),
        }));
      } catch (error) {
        if (cancelled) {
          return;
        }

        setChecklistQuestionsError(
          error instanceof Error
            ? error.message
            : "Failed to load checklist questions.",
        );
      } finally {
        if (!cancelled) {
          setLoadingChecklistQuestions(false);
        }
      }
    };

    void loadWorkflowChecklistQuestions();

    return () => {
      cancelled = true;
    };
  }, [checklistQuestionsByLabelId, workflowLabelId]);

  const handleToggleChecklistQuestion = (questionId: string) => {
    if (!workflowLabelId) {
      return;
    }

    setChecklistAnswersByLabelId((prev) => {
      const currentForLabel = prev[workflowLabelId] ?? {};
      const currentQuestion = currentForLabel[questionId];
      const nextAnswer = !currentQuestion?.answer;

      return {
        ...prev,
        [workflowLabelId]: {
          ...currentForLabel,
          [questionId]: {
            answer: nextAnswer,
            notes: currentQuestion?.notes ?? "",
          },
        },
      };
    });
  };

  const handleQuestionNoteChange = (questionId: string, notes: string) => {
    if (!workflowLabelId) {
      return;
    }

    setChecklistAnswersByLabelId((prev) => {
      const currentForLabel = prev[workflowLabelId] ?? {};
      const currentQuestion = currentForLabel[questionId];

      return {
        ...prev,
        [workflowLabelId]: {
          ...currentForLabel,
          [questionId]: {
            answer: currentQuestion?.answer ?? false,
            notes,
          },
        },
      };
    });
  };

  const handleWorkflowSubmissionNotesChange = (value: string) => {
    if (!workflowLabelId) {
      return;
    }

    setSubmissionNotesByLabelId((prev) => ({
      ...prev,
      [workflowLabelId]: value,
    }));
  };

  const openWorkflowModal = (
    mode: WorkflowModalMode,
    labelName: string,
    labelId?: string | null,
    fileLabelId?: string,
  ) => {
    setWorkflowLabelName(labelName);
    setWorkflowLabelId(labelId ?? null);
    setWorkflowFileLabelId(fileLabelId ?? null);
    setWorkflowModalMode(mode);
  };

  const closeWorkflowModal = () => {
    setWorkflowModalMode(null);
    setWorkflowLabelId(null);
    setWorkflowFileLabelId(null);
  };

  const handleAddLabel = () => {
    if (!canAddSelectedLabel || !selectedLabel) {
      return;
    }

    openWorkflowModal("assign", selectedLabel, selectedLabelId ?? undefined);
  };

  const refreshAssignedFiles = async (
    fallbackSelectedFileId?: string,
    fallbackErrorMessage = "Failed to refresh files.",
  ) => {
    if (!taskById?.projectId || !currentUser?.id) {
      return;
    }

    try {
      setFilesError(null);
      const filesResp = await getAllFiles({
        projectId: taskById.projectId,
        annotatorId: currentUser.id,
      });
      const refreshedFiles = extractArrayApiData<ProjectFile>(filesResp);
      setAssignedFiles(refreshedFiles);
      setSelectedFile((previous) => {
        const selectedId = previous?.id ?? fallbackSelectedFileId;
        const matched = refreshedFiles.find((file) => file.id === selectedId);
        return matched ?? refreshedFiles[0] ?? null;
      });
    } catch (refreshError) {
      setFilesError(
        refreshError instanceof Error
          ? refreshError.message
          : fallbackErrorMessage,
      );
    }
  };

  const handleRemoveFileLabel = async (fileLabelId: string) => {
    setRemovingFileLabelId(fileLabelId);
    setAssignedFileLabelsError(null);

    try {
      await deleteFileLabel(fileLabelId);
      setFileLabelsReloadToken((prev) => prev + 1);
      await refreshAssignedFiles(
        selectedFile?.id,
        "Failed to refresh files after deleting label.",
      );
    } catch (error) {
      setAssignedFileLabelsError(
        error instanceof Error ? error.message : "Failed to remove label.",
      );
    } finally {
      setRemovingFileLabelId(null);
    }
  };

  const [submittingFileForReview, setSubmittingFileForReview] = useState(false);
  const [submitFileForReviewError, setSubmitFileForReviewError] = useState<
    string | null
  >(null);

  const handleSubmitFileForReview = async () => {
    if (!selectedFile?.id || !canSubmitFileForReview) {
      return;
    }

    setSubmittingFileForReview(true);
    setSubmitFileForReviewError(null);

    try {
      await updateFile(selectedFile.id, { status: FileStatus.PENDING_REVIEW });
      await refreshAssignedFiles(
        selectedFile.id,
        "Failed to refresh files after submitting for review.",
      );
    } catch (error) {
      setSubmitFileForReviewError(
        error instanceof Error
          ? error.message
          : "Failed to submit file for review.",
      );
    } finally {
      setSubmittingFileForReview(false);
    }
  };

  const handleSubmitChecklist = async () => {
    if (!selectedFile?.id || !workflowLabelId) {
      return;
    }

    if (workflowChecklistQuestions.length === 0) {
      setSubmitChecklistError("No checklist questions available to submit.");
      return;
    }

    if (hasMissingRequiredChecklist) {
      setSubmitChecklistError(
        "Complete all required checklist questions before submitting.",
      );
      return;
    }

    setSubmittingChecklist(true);
    setSubmitChecklistError(null);
    setSubmitChecklistSuccess(null);

    try {
      const answers = workflowChecklistQuestions.map((question) => {
        const answerState = workflowAnswersByQuestionId[question.id];
        return {
          questionId: question.id,
          answer: answerState?.answer ?? false,
          notes: answerState?.notes?.trim() || undefined,
        };
      });

      const dto: AnnotatorSubmitDto = {
        fileId: selectedFile.id,
        labelId: workflowLabelId,
        answerData: {
          answers,
          notes: workflowSubmissionNotes.trim() || undefined,
        },
      };

      await annotatorSubmitFileLabels(dto);
      setFileLabelsReloadToken((prev) => prev + 1);
      await refreshAssignedFiles(
        selectedFile.id,
        "Failed to refresh files after submission.",
      );

      closeWorkflowModal();
    } catch (error) {
      setSubmitChecklistError(
        error instanceof Error ? error.message : "Failed to submit checklist.",
      );
    } finally {
      setSubmittingChecklist(false);
    }
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">
            Workspace: {project?.name ?? "Project Workspace"}
          </h2>
          <p className="text-sm text-gray-500">
            Task {taskById?.id ?? id ?? "--"} - {assignedFiles.length} files
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span
            className={`rounded-md px-3 py-1 text-xs font-semibold ${
              showPendingReviewBadge
                ? "bg-amber-100 text-amber-700"
                : "bg-blue-100 text-blue-700"
            }`}
          >
            {taskStatusText}
          </span>
          <Link
            to="/annotator/tasks"
            className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
          >
            Back to tasks
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr_1fr]">
        <TaskDetailsPanel
          project={project}
          taskById={taskById}
          projectInstruction={projectInstruction}
          instructionItems={instructionItems}
          allowedLabelNames={allowedLabelNames}
          selectedFile={selectedFile}
          metaError={metaError}
        />

        <CanvasPreviewPanel
          assignedFiles={assignedFiles}
          selectedFile={selectedFile}
          canPreviewSelectedFile={canPreviewSelectedFile}
          filesError={filesError}
          onSelectFile={setSelectedFile}
        />

        <AssignedLabelsPanel
          selectedFile={selectedFile}
          loadingAssignedFileLabels={loadingAssignedFileLabels}
          assignedFileLabels={assignedFileLabels}
          assignedFileLabelsError={assignedFileLabelsError}
          labelNameById={labelNameById}
          removingFileLabelId={removingFileLabelId}
          labelSearch={labelSearch}
          filteredLabels={filteredLabels}
          selectedLabel={selectedLabel}
          canAddSelectedLabel={canAddSelectedLabel}
          canSubmitFileForReview={canSubmitFileForReview}
          submittingFileForReview={submittingFileForReview}
          submitFileForReviewError={submitFileForReviewError}
          isSelectedLabelAssigned={isSelectedLabelAssigned}
          mapFileLabelStatusToBadge={mapFileLabelStatusToBadge}
          mapFileLabelStatusToText={mapFileLabelStatusToText}
          onRemoveFileLabel={(fileLabelId) => {
            void handleRemoveFileLabel(fileLabelId);
          }}
          onOpenWorkflowModal={openWorkflowModal}
          onLabelSearchChange={setLabelSearch}
          onSelectLabel={setSelectedLabel}
          onAddLabel={handleAddLabel}
          onSubmitFileForReview={() => {
            void handleSubmitFileForReview();
          }}
        />
      </div>

      {workflowModalMode && workflowLabelName ? (
        <WorkflowModal
          mode={workflowModalMode}
          labelName={workflowLabelName}
          fileLabel={workflowFileLabel}
          checklistQuestions={workflowChecklistQuestions}
          loadingChecklistQuestions={loadingChecklistQuestions}
          checklistQuestionsError={checklistQuestionsError}
          answersByQuestionId={workflowAnswersByQuestionId}
          submissionNotes={workflowSubmissionNotes}
          requiredCount={workflowRequiredCount}
          answeredCount={workflowAnsweredCount}
          requiredAnsweredCount={workflowRequiredAnsweredCount}
          hasMissingRequiredChecklist={hasMissingRequiredChecklist}
          checklistHistory={workflowChecklistHistory}
          submittingChecklist={submittingChecklist}
          submitChecklistError={submitChecklistError}
          submitChecklistSuccess={submitChecklistSuccess}
          mapFileLabelStatusToBadge={mapFileLabelStatusToBadge}
          mapFileLabelStatusToText={mapFileLabelStatusToText}
          onClose={closeWorkflowModal}
          onToggleChecklistQuestion={handleToggleChecklistQuestion}
          onQuestionNoteChange={handleQuestionNoteChange}
          onSubmissionNotesChange={handleWorkflowSubmissionNotesChange}
          onSubmitChecklist={handleSubmitChecklist}
          canSubmitForSelectedFile={canSubmitChecklistByFileStatus}
          selectedFileStatus={selectedFile?.status ?? null}
        />
      ) : null}
    </div>
  );
}
