import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../context/auth-context.context";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { EntityReference } from "../../interface/common/base-entity.interface";
import type { ChecklistAnswer } from "../../interface/checklist-answer/checklist-answer.interface";
import type { Decision } from "../../interface/enums/domain.enums";
import type { File as ProjectFile } from "../../interface/file/file.interface";
import { FileLabelStatusEnums } from "../../interface/file-label/enums/file-label.enums";
import type { FileLabel } from "../../interface/file-label/file-label.interface";
import type { LabelChecklistQuestion } from "../../interface/label-checklist-question/label-checklist-question.interface";
import type { Label } from "../../interface/label/label.interface";
import type { Project } from "../../interface/project/project.interface";
import type { ProjectInstruction } from "../../interface/project-instruction/project-instruction.interface";
import type { ProjectTask } from "../../interface/project-task/project-task.interface";
import type { CreateReviewErrorTypeDto } from "../../interface/review-error-type/dtos/create-review-error-type.dto";
import { Severity } from "../../interface/review-error-type/enums/severity.enums";
import type { ReviewErrorType } from "../../interface/review-error-type/review-error-type.interface";
import { getAllFileLabels } from "../../services/file-label-service.service";
import { getAllFiles } from "../../services/file-service.service";
import { getAllLabelChecklistQuestions } from "../../services/label-checklist-question-service.service";
import { getAllowedLabelsInProject } from "../../services/label-service.service";
import { getProjectInstructionByProjectId } from "../../services/project-instruction-service.service";
import { getProjectTaskById } from "../../services/project-task-service.service";
import {
  createReviewErrorType,
  getAllReviewErrorTypes,
} from "../../services/review-error-type-service.service";
import {
  submitReviews,
  type SubmitReviewErrorDto,
  type SubmitReviewsDto,
} from "../../services/review-service.service";

import TaskDetailsPanel from "../../components/reviewer/workspace/task-details-panel";
import CanvasPreviewPanel from "../../components/reviewer/workspace/canvas-preview-panel";
import AssignedLabelsPanel from "../../components/reviewer/workspace/assigned-labels-panel";
import WorkflowModal, {
  type WorkflowModalMode,
  type ReviewErrorTypeCreateFormState,
} from "../../components/reviewer/workspace/workflow-modal";
import { FileStatus } from "../../interface/file/enums/file-status.enums";

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
  if (Array.isArray(data)) return data as T[];
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
  if (status === "assigned" || status === "in_progress") return "In Progress";
  if (status === "pending_review") return "Pending Review";
  if (status === "rejected") return "Returned";
  return "Completed";
};

const isChecklistAnswerSnapshot = (
  item: EntityReference | ChecklistAnswer,
): item is ChecklistAnswer =>
  Boolean(item && typeof item === "object" && "answerData" in item);

export default function ReviewerWorkspacePage() {
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
  const [reviewerFiles, setReviewerFiles] = useState<ProjectFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<ProjectFile | null>(null);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [filesError, setFilesError] = useState<string | null>(null);

  const [reviewerFileLabels, setReviewerFileLabels] = useState<FileLabel[]>([]);
  const [loadingReviewerFileLabels, setLoadingReviewerFileLabels] =
    useState(false);
  const [reviewerFileLabelsError, setReviewerFileLabelsError] = useState<
    string | null
  >(null);
  const [reviewerFileLabelsReloadToken, setReviewerFileLabelsReloadToken] =
    useState(0);
  const [selectedAssignedFileLabelId, setSelectedAssignedFileLabelId] =
    useState<string | null>(null);

  const [workflowModalMode, setWorkflowModalMode] =
    useState<WorkflowModalMode | null>(null);
  const [workflowLabelName, setWorkflowLabelName] = useState<string | null>(
    null,
  );
  const [workflowLabelId, setWorkflowLabelId] = useState<string | null>(null);
  const [workflowFileLabelId, setWorkflowFileLabelId] = useState<string | null>(
    null,
  );

  const [
    reviewChecklistQuestionsByLabelId,
    setReviewChecklistQuestionsByLabelId,
  ] = useState<Record<string, LabelChecklistQuestion[]>>({});
  const [
    reviewChecklistAnswersByFileLabelId,
    setReviewChecklistAnswersByFileLabelId,
  ] = useState<
    Record<string, Record<string, { answer: boolean; notes: string }>>
  >({});
  const [
    reviewChecklistNotesByFileLabelId,
    setReviewChecklistNotesByFileLabelId,
  ] = useState<Record<string, string>>({});
  const [reviewDecisionByFileLabelId, setReviewDecisionByFileLabelId] =
    useState<Record<string, Decision>>({});
  const [reviewFeedbackByFileLabelId, setReviewFeedbackByFileLabelId] =
    useState<Record<string, string>>({});
  const [loadingReviewChecklistQuestions, setLoadingReviewChecklistQuestions] =
    useState(false);
  const [reviewChecklistQuestionsError, setReviewChecklistQuestionsError] =
    useState<string | null>(null);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submitReviewError, setSubmitReviewError] = useState<string | null>(
    null,
  );

  const [reviewErrorTypes, setReviewErrorTypes] = useState<ReviewErrorType[]>(
    [],
  );
  const [loadingReviewErrorTypes, setLoadingReviewErrorTypes] = useState(false);
  const [reviewErrorTypesError, setReviewErrorTypesError] = useState<
    string | null
  >(null);
  const [reviewErrorTypeSearch, setReviewErrorTypeSearch] = useState("");
  const [
    selectedReviewErrorsByFileLabelId,
    setSelectedReviewErrorsByFileLabelId,
  ] = useState<Record<string, SubmitReviewErrorDto[]>>({});

  const [createReviewErrorTypeForm, setCreateReviewErrorTypeForm] =
    useState<ReviewErrorTypeCreateFormState>({
      name: "",
      description: "",
      severity: Severity.MINOR,
      scoreImpact: "0",
    });
  const [creatingReviewErrorType, setCreatingReviewErrorType] = useState(false);
  const [createReviewErrorTypeError, setCreateReviewErrorTypeError] = useState<
    string | null
  >(null);

  const project = useMemo<Project | null>(() => {
    if (!taskById?.project) return null;
    if ("name" in taskById.project) return taskById.project;
    return null;
  }, [taskById?.project]);

  const taskStatusText = useMemo(
    () => (taskById ? mapTaskStatusToText(taskById.status) : "In Progress"),
    [taskById],
  );

  const instructionItems = useMemo<string[]>(() => {
    const content = projectInstruction?.content?.trim();
    if (!content) return [];
    return content
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
  }, [projectInstruction?.content]);

  const labelNameById = useMemo(
    () =>
      new Map<string, string>(
        projectLabels.map((label) => [label.id, label.name]),
      ),
    [projectLabels],
  );

  const canPreviewSelectedFile = useMemo(
    () =>
      Boolean(
        selectedFile?.fileUrl && selectedFile.contentType?.startsWith("image/"),
      ),
    [selectedFile],
  );

  const workflowFileLabel = useMemo<FileLabel | null>(
    () =>
      workflowFileLabelId
        ? (reviewerFileLabels.find((item) => item.id === workflowFileLabelId) ??
          null)
        : null,
    [reviewerFileLabels, workflowFileLabelId],
  );

  const workflowReviewChecklistQuestions = useMemo(
    () =>
      workflowLabelId
        ? (reviewChecklistQuestionsByLabelId[workflowLabelId] ?? [])
        : [],
    [reviewChecklistQuestionsByLabelId, workflowLabelId],
  );

  const workflowReviewAnswersByQuestionId = useMemo(
    () =>
      workflowFileLabelId
        ? (reviewChecklistAnswersByFileLabelId[workflowFileLabelId] ?? {})
        : ({} as Record<string, { answer: boolean; notes: string }>),
    [reviewChecklistAnswersByFileLabelId, workflowFileLabelId],
  );

  const workflowReviewChecklistNotes = useMemo(
    () =>
      workflowFileLabelId
        ? (reviewChecklistNotesByFileLabelId[workflowFileLabelId] ?? "")
        : "",
    [reviewChecklistNotesByFileLabelId, workflowFileLabelId],
  );

  const workflowReviewDecision = useMemo<Decision>(
    () =>
      workflowFileLabelId
        ? (reviewDecisionByFileLabelId[workflowFileLabelId] ?? "approved")
        : "approved",
    [reviewDecisionByFileLabelId, workflowFileLabelId],
  );

  const workflowReviewFeedback = useMemo(
    () =>
      workflowFileLabelId
        ? (reviewFeedbackByFileLabelId[workflowFileLabelId] ?? "")
        : "",
    [reviewFeedbackByFileLabelId, workflowFileLabelId],
  );

  const workflowReviewRequiredCount = useMemo(
    () => workflowReviewChecklistQuestions.filter((q) => q.isRequired).length,
    [workflowReviewChecklistQuestions],
  );

  const workflowReviewRequiredAnsweredCount = useMemo(
    () =>
      workflowReviewChecklistQuestions.filter(
        (q) => q.isRequired && workflowReviewAnswersByQuestionId[q.id]?.answer,
      ).length,
    [workflowReviewAnswersByQuestionId, workflowReviewChecklistQuestions],
  );

  const hasMissingRequiredReviewChecklist = useMemo(
    () => workflowReviewRequiredAnsweredCount < workflowReviewRequiredCount,
    [workflowReviewRequiredAnsweredCount, workflowReviewRequiredCount],
  );

  const selectedAssignedFileLabel = useMemo<FileLabel | null>(
    () =>
      selectedAssignedFileLabelId
        ? (reviewerFileLabels.find(
            (item) => item.id === selectedAssignedFileLabelId,
          ) ?? null)
        : null,
    [reviewerFileLabels, selectedAssignedFileLabelId],
  );

  const selectedAssignedLabelName = useMemo(() => {
    if (!selectedAssignedFileLabel?.labelId) return "No label selected";
    return (
      labelNameById.get(selectedAssignedFileLabel.labelId) ??
      selectedAssignedFileLabel.labelId
    );
  }, [labelNameById, selectedAssignedFileLabel]);

  const canOpenSelectedLabelReview = useMemo(
    () =>
      selectedAssignedFileLabel?.status === FileLabelStatusEnums.PENDING_REVIEW,
    [selectedAssignedFileLabel],
  );

  const workflowChecklistHistory = useMemo<ChecklistAnswer[]>(() => {
    const snapshots = workflowFileLabel?.checklistAnswers;
    if (!snapshots?.length) return [];
    return snapshots
      .filter(isChecklistAnswerSnapshot)
      .slice()
      .sort((a, b) => {
        if (a.labelAttemptNumber !== b.labelAttemptNumber) {
          return a.labelAttemptNumber - b.labelAttemptNumber;
        }
        return a.createdAt.localeCompare(b.createdAt);
      });
  }, [workflowFileLabel?.checklistAnswers]);

  const workflowSelectedReviewErrors = useMemo(
    () =>
      workflowFileLabelId
        ? (selectedReviewErrorsByFileLabelId[workflowFileLabelId] ?? [])
        : [],
    [selectedReviewErrorsByFileLabelId, workflowFileLabelId],
  );

  const workflowSelectedReviewErrorTypeIds = useMemo(
    () =>
      new Set(
        workflowSelectedReviewErrors.map((item) => item.reviewErrorTypeId),
      ),
    [workflowSelectedReviewErrors],
  );

  const filteredReviewErrorTypes = useMemo(() => {
    const keyword = reviewErrorTypeSearch.trim().toLowerCase();
    if (!keyword) return reviewErrorTypes;
    return reviewErrorTypes.filter((item) => {
      const haystacks = [item.name, item.description ?? "", item.severity];
      return haystacks.some((v) => v.toLowerCase().includes(keyword));
    });
  }, [reviewErrorTypeSearch, reviewErrorTypes]);

  useEffect(() => {
    let cancelled = false;

    const loadWorkspaceMeta = async () => {
      if (!id) return;

      setMetaError(null);
      setFilesError(null);

      try {
        if (!currentUser?.id) {
          throw new Error(
            "Cannot determine current reviewer from auth context.",
          );
        }

        const taskResp = await getProjectTaskById(id);
        const fetchedTask = extractApiData<ProjectTask>(taskResp);
        if (!fetchedTask) throw new Error("Task was not found.");

        if (cancelled) return;
        setTaskById(fetchedTask);

        const projectId = fetchedTask.projectId;
        const [instructionResult, labelsResult, filesResult] =
          await Promise.allSettled([
            getProjectInstructionByProjectId(projectId),
            getAllowedLabelsInProject(projectId, {}),
            getAllFiles({
              projectId,
              reviewerId: currentUser.id,
              status: FileStatus.PENDING_REVIEW,
            }),
          ]);

        if (cancelled) return;

        setProjectInstruction(
          instructionResult.status === "fulfilled"
            ? extractApiData<ProjectInstruction>(instructionResult.value)
            : null,
        );

        setProjectLabels(
          labelsResult.status === "fulfilled"
            ? (extractApiData<Label[]>(labelsResult.value) ?? [])
            : [],
        );

        if (filesResult.status === "fulfilled") {
          const files = extractArrayApiData<ProjectFile>(filesResult.value);
          setReviewerFiles(files);
          setSelectedFile(files[0] ?? null);
        } else {
          setReviewerFiles([]);
          setSelectedFile(null);
          setFilesError(
            filesResult.reason instanceof Error
              ? filesResult.reason.message
              : "Failed to load files assigned to current reviewer.",
          );
        }
      } catch (error) {
        if (cancelled) return;
        setMetaError(
          error instanceof Error
            ? error.message
            : "Failed to load reviewer workspace context.",
        );
      }
    };

    void loadWorkspaceMeta();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, id]);

  useEffect(() => {
    if (reviewerFiles.length === 0) {
      setSelectedFile(null);
      return;
    }
    const selectedExists = selectedFile
      ? reviewerFiles.some((file) => file.id === selectedFile.id)
      : false;
    if (!selectedExists) setSelectedFile(reviewerFiles[0]);
  }, [reviewerFiles, selectedFile]);

  useEffect(() => {
    let cancelled = false;

    const loadReviewerFileLabels = async () => {
      if (!selectedFile?.id) {
        setReviewerFileLabels([]);
        setReviewerFileLabelsError(null);
        return;
      }

      setLoadingReviewerFileLabels(true);
      setReviewerFileLabelsError(null);

      try {
        const resp = await getAllFileLabels({
          fileId: selectedFile.id,
          reviewerId: currentUser?.id,
        });
        if (cancelled) return;
        setReviewerFileLabels(extractArrayApiData<FileLabel>(resp));
      } catch (error) {
        if (cancelled) return;
        setReviewerFileLabels([]);
        setReviewerFileLabelsError(
          error instanceof Error
            ? error.message
            : "Failed to load file labels for selected file.",
        );
      } finally {
        if (!cancelled) setLoadingReviewerFileLabels(false);
      }
    };

    void loadReviewerFileLabels();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id, reviewerFileLabelsReloadToken, selectedFile?.id]);

  useEffect(() => {
    if (reviewerFileLabels.length === 0) {
      setSelectedAssignedFileLabelId(null);
      return;
    }
    const selectedExists = selectedAssignedFileLabelId
      ? reviewerFileLabels.some(
          (item) => item.id === selectedAssignedFileLabelId,
        )
      : false;
    if (!selectedExists)
      setSelectedAssignedFileLabelId(reviewerFileLabels[0].id);
  }, [reviewerFileLabels, selectedAssignedFileLabelId]);

  useEffect(() => {
    let cancelled = false;

    const loadReviewChecklistQuestions = async () => {
      if (workflowModalMode !== "review" || !workflowLabelId) {
        setLoadingReviewChecklistQuestions(false);
        setReviewChecklistQuestionsError(null);
        return;
      }

      if (reviewChecklistQuestionsByLabelId[workflowLabelId]) {
        setReviewChecklistQuestionsError(null);
        return;
      }

      setLoadingReviewChecklistQuestions(true);
      setReviewChecklistQuestionsError(null);

      try {
        const resp = await getAllLabelChecklistQuestions({
          role: "reviewer",
          labelId: workflowLabelId,
        });
        if (cancelled) return;
        setReviewChecklistQuestionsByLabelId((prev) => ({
          ...prev,
          [workflowLabelId]: extractArrayApiData<LabelChecklistQuestion>(resp),
        }));
      } catch (error) {
        if (cancelled) return;
        setReviewChecklistQuestionsError(
          error instanceof Error
            ? error.message
            : "Failed to load reviewer checklist questions.",
        );
      } finally {
        if (!cancelled) setLoadingReviewChecklistQuestions(false);
      }
    };

    void loadReviewChecklistQuestions();
    return () => {
      cancelled = true;
    };
  }, [reviewChecklistQuestionsByLabelId, workflowLabelId, workflowModalMode]);

  useEffect(() => {
    let cancelled = false;

    const loadReviewErrorTypes = async () => {
      if (workflowModalMode !== "review") {
        setLoadingReviewErrorTypes(false);
        setReviewErrorTypesError(null);
        return;
      }

      setLoadingReviewErrorTypes(true);
      setReviewErrorTypesError(null);

      try {
        const resp = await getAllReviewErrorTypes({});
        if (cancelled) return;
        setReviewErrorTypes(extractArrayApiData<ReviewErrorType>(resp));
      } catch (error) {
        if (cancelled) return;
        setReviewErrorTypes([]);
        setReviewErrorTypesError(
          error instanceof Error
            ? error.message
            : "Failed to load review error types.",
        );
      } finally {
        if (!cancelled) setLoadingReviewErrorTypes(false);
      }
    };

    void loadReviewErrorTypes();
    return () => {
      cancelled = true;
    };
  }, [workflowModalMode]);

  useEffect(() => {
    setSubmitReviewError(null);
    setCreateReviewErrorTypeError(null);
  }, [workflowFileLabelId, workflowModalMode]);

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
    setWorkflowLabelName(null);
    setWorkflowLabelId(null);
    setWorkflowFileLabelId(null);
    setReviewErrorTypeSearch("");
    setCreateReviewErrorTypeError(null);
    setCreateReviewErrorTypeForm({
      name: "",
      description: "",
      severity: Severity.MINOR,
      scoreImpact: "0",
    });
  };

  const handleToggleReviewChecklistQuestion = (questionId: string) => {
    if (!workflowFileLabelId) return;
    setReviewChecklistAnswersByFileLabelId((prev) => {
      const currentForFileLabel = prev[workflowFileLabelId] ?? {};
      const current = currentForFileLabel[questionId];
      return {
        ...prev,
        [workflowFileLabelId]: {
          ...currentForFileLabel,
          [questionId]: {
            answer: !current?.answer,
            notes: current?.notes ?? "",
          },
        },
      };
    });
  };

  const handleReviewQuestionNoteChange = (
    questionId: string,
    notes: string,
  ) => {
    if (!workflowFileLabelId) return;
    setReviewChecklistAnswersByFileLabelId((prev) => {
      const currentForFileLabel = prev[workflowFileLabelId] ?? {};
      const current = currentForFileLabel[questionId];
      return {
        ...prev,
        [workflowFileLabelId]: {
          ...currentForFileLabel,
          [questionId]: {
            answer: current?.answer ?? false,
            notes,
          },
        },
      };
    });
  };

  const handleReviewChecklistNotesChange = (value: string) => {
    if (!workflowFileLabelId) return;
    setReviewChecklistNotesByFileLabelId((prev) => ({
      ...prev,
      [workflowFileLabelId]: value,
    }));
  };

  const handleReviewFeedbackChange = (value: string) => {
    if (!workflowFileLabelId) return;
    setReviewFeedbackByFileLabelId((prev) => ({
      ...prev,
      [workflowFileLabelId]: value,
    }));
  };

  const handleReviewDecisionChange = (value: Decision) => {
    if (!workflowFileLabelId) return;
    setReviewDecisionByFileLabelId((prev) => ({
      ...prev,
      [workflowFileLabelId]: value,
    }));
  };

  const handleToggleReviewErrorType = (reviewErrorTypeId: string) => {
    if (!workflowFileLabelId) return;
    setSelectedReviewErrorsByFileLabelId((prev) => {
      const current = prev[workflowFileLabelId] ?? [];
      const exists = current.some(
        (item) => item.reviewErrorTypeId === reviewErrorTypeId,
      );
      return {
        ...prev,
        [workflowFileLabelId]: exists
          ? current.filter(
              (item) => item.reviewErrorTypeId !== reviewErrorTypeId,
            )
          : [...current, { reviewErrorTypeId }],
      };
    });
  };

  const handleSelectedReviewErrorDescriptionChange = (
    reviewErrorTypeId: string,
    description: string,
  ) => {
    if (!workflowFileLabelId) return;
    setSelectedReviewErrorsByFileLabelId((prev) => {
      const current = prev[workflowFileLabelId] ?? [];
      return {
        ...prev,
        [workflowFileLabelId]: current.map((item) =>
          item.reviewErrorTypeId === reviewErrorTypeId
            ? { ...item, description: description.trim() || undefined }
            : item,
        ),
      };
    });
  };

  const handleCreateReviewErrorTypeSubmit = async () => {
    const name = createReviewErrorTypeForm.name.trim();
    const scoreImpactValue = Number(createReviewErrorTypeForm.scoreImpact);

    if (!name) {
      setCreateReviewErrorTypeError("Name is required.");
      return;
    }
    if (Number.isNaN(scoreImpactValue)) {
      setCreateReviewErrorTypeError("Score impact must be a valid number.");
      return;
    }

    setCreatingReviewErrorType(true);
    setCreateReviewErrorTypeError(null);

    try {
      const dto: CreateReviewErrorTypeDto = {
        name,
        description: createReviewErrorTypeForm.description.trim() || undefined,
        severity: createReviewErrorTypeForm.severity,
        scoreImpact: scoreImpactValue,
      };

      const createdResp = await createReviewErrorType(dto);
      const created = extractApiData<ReviewErrorType>(createdResp);

      if (created) {
        setReviewErrorTypes((prev) => {
          if (prev.some((item) => item.id === created.id)) return prev;
          return [created, ...prev];
        });

        if (workflowFileLabelId) {
          setSelectedReviewErrorsByFileLabelId((prev) => {
            const current = prev[workflowFileLabelId] ?? [];
            if (current.some((item) => item.reviewErrorTypeId === created.id)) {
              return prev;
            }
            return {
              ...prev,
              [workflowFileLabelId]: [
                ...current,
                { reviewErrorTypeId: created.id },
              ],
            };
          });
        }
      }

      setCreateReviewErrorTypeForm({
        name: "",
        description: "",
        severity: Severity.MINOR,
        scoreImpact: "0",
      });
    } catch (error) {
      setCreateReviewErrorTypeError(
        error instanceof Error
          ? error.message
          : "Failed to create review error type.",
      );
    } finally {
      setCreatingReviewErrorType(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!workflowFileLabelId || !workflowLabelId) return;

    const submittedWorkflowFileLabelId = workflowFileLabelId;

    if (workflowReviewChecklistQuestions.length === 0) {
      setSubmitReviewError("No reviewer checklist questions available.");
      return;
    }

    if (hasMissingRequiredReviewChecklist) {
      setSubmitReviewError(
        "Complete all required reviewer checklist questions before submitting.",
      );
      return;
    }

    setSubmittingReview(true);
    setSubmitReviewError(null);

    try {
      const dto: SubmitReviewsDto = {
        fileLabelId: workflowFileLabelId,
        decision: workflowReviewDecision,
        feedbacks: workflowReviewFeedback.trim() || undefined,
        answerData: {
          answers: workflowReviewChecklistQuestions.map((question) => {
            const answerState = workflowReviewAnswersByQuestionId[question.id];
            return {
              questionId: question.id,
              answer: answerState?.answer ?? false,
              notes: answerState?.notes?.trim() || undefined,
            };
          }),
          notes: workflowReviewChecklistNotes.trim() || undefined,
        },
        reviewErrors: workflowSelectedReviewErrors,
      };

      await submitReviews(dto);

      setSelectedReviewErrorsByFileLabelId((prev) => {
        const next = { ...prev };
        delete next[submittedWorkflowFileLabelId];
        return next;
      });
      setReviewChecklistAnswersByFileLabelId((prev) => {
        const next = { ...prev };
        delete next[submittedWorkflowFileLabelId];
        return next;
      });
      setReviewChecklistNotesByFileLabelId((prev) => {
        const next = { ...prev };
        delete next[submittedWorkflowFileLabelId];
        return next;
      });
      setReviewDecisionByFileLabelId((prev) => {
        const next = { ...prev };
        delete next[submittedWorkflowFileLabelId];
        return next;
      });
      setReviewFeedbackByFileLabelId((prev) => {
        const next = { ...prev };
        delete next[submittedWorkflowFileLabelId];
        return next;
      });
      setReviewerFileLabelsReloadToken((prev) => prev + 1);

      if (taskById?.projectId && currentUser?.id) {
        try {
          setFilesError(null);
          const filesResp = await getAllFiles({
            projectId: taskById.projectId,
            reviewerId: currentUser.id,
            status: FileStatus.PENDING_REVIEW,
          });
          const refreshedFiles = extractArrayApiData<ProjectFile>(filesResp);
          setReviewerFiles(refreshedFiles);
          setSelectedFile((previous) => {
            const selectedId = previous?.id ?? selectedFile?.id;
            const matched = refreshedFiles.find(
              (file) => file.id === selectedId,
            );
            return matched ?? refreshedFiles[0] ?? null;
          });
        } catch (refreshError) {
          setFilesError(
            refreshError instanceof Error
              ? refreshError.message
              : "Failed to refresh files after review submission.",
          );
        }
      }

      closeWorkflowModal();
    } catch (error) {
      setSubmitReviewError(
        error instanceof Error ? error.message : "Failed to submit review.",
      );
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleOpenSelectedLabelReview = () => {
    if (
      !selectedAssignedFileLabel ||
      !selectedAssignedFileLabel.labelId ||
      !canOpenSelectedLabelReview
    ) {
      return;
    }
    openWorkflowModal(
      "review",
      selectedAssignedLabelName,
      selectedAssignedFileLabel.labelId,
      selectedAssignedFileLabel.id,
    );
  };

  const handleOpenSelectedLabelDetails = () => {
    if (!selectedAssignedFileLabel) return;
    openWorkflowModal(
      "view",
      selectedAssignedLabelName,
      selectedAssignedFileLabel.labelId,
      selectedAssignedFileLabel.id,
    );
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-gray-500">
            {reviewerFiles.length} files in task
          </p>
        </div>
        <Link
          to="/reviewer"
          className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
        >
          Back to queue
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_2fr_1fr]">
        <TaskDetailsPanel
          project={project}
          taskById={taskById}
          taskId={id}
          taskStatusText={taskStatusText}
          projectInstruction={projectInstruction}
          instructionItems={instructionItems}
          projectLabels={projectLabels}
          metaError={metaError}
        />

        <CanvasPreviewPanel
          reviewerFiles={reviewerFiles}
          selectedFile={selectedFile}
          canPreviewSelectedFile={canPreviewSelectedFile}
          filesError={filesError}
          onSelectFile={setSelectedFile}
        />

        <AssignedLabelsPanel
          selectedFile={selectedFile}
          reviewerFileLabels={reviewerFileLabels}
          loadingReviewerFileLabels={loadingReviewerFileLabels}
          reviewerFileLabelsError={reviewerFileLabelsError}
          selectedAssignedFileLabelId={selectedAssignedFileLabelId}
          labelNameById={labelNameById}
          selectedAssignedLabelName={selectedAssignedLabelName}
          selectedAssignedFileLabel={selectedAssignedFileLabel}
          canOpenSelectedLabelReview={canOpenSelectedLabelReview}
          onSelectFileLabelId={setSelectedAssignedFileLabelId}
          onOpenSelectedLabelDetails={handleOpenSelectedLabelDetails}
          onOpenSelectedLabelReview={handleOpenSelectedLabelReview}
        />
      </div>

      {workflowModalMode && workflowLabelName ? (
        <WorkflowModal
          mode={workflowModalMode}
          labelName={workflowLabelName}
          fileLabel={workflowFileLabel}
          reviewChecklistQuestions={workflowReviewChecklistQuestions}
          loadingReviewChecklistQuestions={loadingReviewChecklistQuestions}
          reviewChecklistQuestionsError={reviewChecklistQuestionsError}
          reviewAnswersByQuestionId={workflowReviewAnswersByQuestionId}
          reviewChecklistNotes={workflowReviewChecklistNotes}
          reviewRequiredCount={workflowReviewRequiredCount}
          reviewRequiredAnsweredCount={workflowReviewRequiredAnsweredCount}
          hasMissingRequiredChecklist={hasMissingRequiredReviewChecklist}
          reviewDecision={workflowReviewDecision}
          reviewFeedback={workflowReviewFeedback}
          reviewErrorTypes={reviewErrorTypes}
          loadingReviewErrorTypes={loadingReviewErrorTypes}
          reviewErrorTypesError={reviewErrorTypesError}
          reviewErrorTypeSearch={reviewErrorTypeSearch}
          filteredReviewErrorTypes={filteredReviewErrorTypes}
          selectedReviewErrors={workflowSelectedReviewErrors}
          selectedReviewErrorTypeIds={workflowSelectedReviewErrorTypeIds}
          createReviewErrorTypeForm={createReviewErrorTypeForm}
          creatingReviewErrorType={creatingReviewErrorType}
          createReviewErrorTypeError={createReviewErrorTypeError}
          checklistHistory={workflowChecklistHistory}
          submittingReview={submittingReview}
          submitReviewError={submitReviewError}
          onClose={closeWorkflowModal}
          onToggleChecklistQuestion={handleToggleReviewChecklistQuestion}
          onReviewQuestionNoteChange={handleReviewQuestionNoteChange}
          onReviewChecklistNotesChange={handleReviewChecklistNotesChange}
          onReviewFeedbackChange={handleReviewFeedbackChange}
          onReviewDecisionChange={handleReviewDecisionChange}
          onToggleReviewErrorType={handleToggleReviewErrorType}
          onSelectedReviewErrorDescriptionChange={
            handleSelectedReviewErrorDescriptionChange
          }
          onReviewErrorTypeSearchChange={setReviewErrorTypeSearch}
          onCreateReviewErrorTypeFormChange={(patch) =>
            setCreateReviewErrorTypeForm((prev) => ({ ...prev, ...patch }))
          }
          onCreateReviewErrorTypeSubmit={handleCreateReviewErrorTypeSubmit}
          onSubmitReview={handleSubmitReview}
        />
      ) : null}
    </div>
  );
}
