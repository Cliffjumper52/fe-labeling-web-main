import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type SetStateAction,
  type Dispatch,
} from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type {
  AccountStatus,
  DataType,
  ProjectStatus,
  Role,
} from "../../interface/enums/domain.enums";
import type { Account } from "../../interface/account/account.interface";
import type { Label as ApiLabel } from "../../interface/label/label.interface";
import type { ProjectInstruction } from "../../interface/project-instruction/project-instruction.interface";
import type { Project as ApiProject } from "../../interface/project/project.interface";
import type { LabelPreset as ApiLabelPreset } from "../../interface/label-preset/label-preset.interface";
import type { File as ApiFile } from "../../interface/file/file.interface";
import type { ExportRequestDto } from "../../interface/dataset/dtos/export-request.dto";
import type { ProjectSnapshotListItem } from "../../interface/project-snapshot/project-snapshot.interface";
import type {
  ManagerProjectEditAvailableLabel as AvailableLabel,
  ManagerProjectEditPaginationResult as PaginationResult,
  ManagerProjectEditPreset as Preset,
  ManagerProjectEditProject as Project,
  ManagerProjectEditTeamMember as TeamMember,
} from "../../interface/project/manager-project-edit.interface";
import {
  getProjectById,
  updateProject,
  deleteProject,
  completeProject,
} from "../../services/project-service.service";
import { getLabelPresetsPaginated } from "../../services/label-preset-service.service";
import {
  createFile,
  getFilesPaginated,
  getUnassignedFiles,
  deleteFile,
  updateFile,
} from "../../services/file-service.service";
import { getAllLabels } from "../../services/label-service.service";
import { getAllAccounts } from "../../services/account-service.service";
import {
  createProjectTask,
  deleteProjectTask,
  getManagerProjectTasks,
} from "../../services/project-task-service.service";
import type { ProjectTask } from "../../interface/project-task/project-task.interface";
import {
  getProjectConfigurationByProjectId,
  updateProjectConfiguration,
} from "../../services/project-configuration-service.service";
import type { ProjectConfiguration } from "../../interface/project-configuration/project-configuration.interface";
import {
  createProjectInstruction,
  getProjectInstructionByProjectId,
  updateProjectInstruction,
} from "../../services/project-instruction-service.service";
import {
  createProjectSnapshot,
  deleteProjectSnapshot,
  getProjectSnapshots,
} from "../../services/project-snapshot-service.service";
import {
  downloadDatasetExport,
  getDatasetExportStatus,
  initiateDatasetExport,
  type DatasetExportJobStatus,
  type DatasetExportInitiateResponse,
  type DatasetExportStatusResponse,
} from "../../services/dataset-service.service";
import ProjectEditAssignModal from "../../components/manager/project-edit/project-edit-assign-modal";
import ProjectEditHeader from "../../components/manager/project-edit/project-edit-header";
import ProjectEditInfoForm from "../../components/manager/project-edit/project-edit-info-form";
import ProjectEditLabelConfigModal from "../../components/manager/project-edit/project-edit-label-config-modal";
import ProjectEditSnapshotExportModal from "../../components/manager/project-edit/project-edit-snapshot-export-modal";
import ProjectEditSections from "../../components/manager/project-edit/project-edit-sections";
import ProjectEditSnapshots from "../../components/manager/project-edit/project-edit-snapshots";
import ProjectEditUploadModal from "../../components/manager/project-edit/project-edit-upload-modal";

type SnapshotExportUiStatus = "IDLE" | DatasetExportJobStatus;

const normalizeAvailableLabels = (value: unknown): AvailableLabel[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item): AvailableLabel | null => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const raw = item as {
        id?: unknown;
        name?: unknown;
        description?: unknown;
        color?: unknown;
      };

      if (typeof raw.id !== "string") {
        return null;
      }

      return {
        id: raw.id,
        name:
          typeof raw.name === "string" && raw.name.trim() ? raw.name : raw.id,
        description:
          typeof raw.description === "string" && raw.description.trim()
            ? raw.description
            : undefined,
        color:
          typeof raw.color === "string" && raw.color.trim()
            ? raw.color
            : undefined,
      };
    })
    .filter((item): item is AvailableLabel => item !== null);
};

const ADMIN_USERS_UPDATED_EVENT = "admin-users-updated";

const mapAccountsToMembers = (
  accounts: Account[],
  activeStatus: AccountStatus,
): TeamMember[] => {
  return accounts
    .filter((account) => account.status === activeStatus)
    .map((account) => ({
      id: account.id,
      name: account.username,
      email: account.email,
      workload: "0 tasks",
    }));
};

const unwrapApiResponse = <T,>(payload: unknown): T | null => {
  if (!payload || typeof payload !== "object") {
    return payload as T;
  }

  if ("data" in payload) {
    return (payload as ApiResponse<T>).data;
  }

  return payload as T;
};

const unwrapAxiosData = (payload: unknown): unknown => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
};

const formatDateLabel = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
};

const mapFilesById = (files: ApiFile[]) => {
  return new Map(files.map((file) => [file.id, file]));
};

const mapFileNameToId = (files: ApiFile[]) => {
  return new Map(files.map((file) => [file.fileName, file.id]));
};

const mergeUniqueIds = (...groups: string[][]) => {
  return Array.from(new Set(groups.flat()));
};

const buildAssignmentsFromTasks = (
  tasks: ProjectTask[],
  role: Role,
): Record<string, string[]> => {
  return tasks.reduce<Record<string, string[]>>((acc, task) => {
    if (task.assignedUserRole !== role) {
      return acc;
    }
    if (!Array.isArray(task.fileIds) || !task.assignedTo) {
      return acc;
    }
    task.fileIds.forEach((fileId) => {
      const existing = acc[fileId] ?? [];
      if (!existing.includes(task.assignedTo)) {
        acc[fileId] = [...existing, task.assignedTo];
      }
    });
    return acc;
  }, {});
};

const normalizeAssignments = (
  assignments: Record<string, string[]>,
  files: ApiFile[],
) => {
  const nameToId = mapFileNameToId(files);
  return Object.entries(assignments).reduce<Record<string, string[]>>(
    (acc, [key, value]) => {
      const resolved = nameToId.get(key) ?? key;
      acc[resolved] = value;
      return acc;
    },
    {},
  );
};
const extractArray = <T,>(payload: unknown): T[] => {
  const data = unwrapApiResponse<T[] | PaginationResult<T>>(
    unwrapAxiosData(payload),
  );
  if (Array.isArray(data)) {
    return data;
  }
  if (data && typeof data === "object") {
    const inner = data as PaginationResult<T>;
    if (Array.isArray(inner.data)) {
      return inner.data;
    }
  }
  return [];
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  const detail = error as {
    response?: { data?: { error?: { message?: unknown }; message?: unknown } };
    data?: { error?: { message?: unknown } };
    error?: { message?: unknown };
    message?: unknown;
  };

  const message =
    detail.response?.data?.error?.message ??
    detail.data?.error?.message ??
    detail.response?.data?.message ??
    detail.error?.message ??
    detail.message ??
    fallback;

  if (typeof message === "string" && message.trim()) {
    return message;
  }
  return error instanceof Error ? error.message : fallback;
};

const dataTypeEnumToLabel = (value: DataType): Project["dataType"] => {
  switch (value) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "text":
    default:
      return "Text";
  }
};

const dataTypeLabelToEnum = (value: Project["dataType"]): DataType => {
  switch (value) {
    case "Image":
      return "image";
    case "Video":
      return "video";
    case "Audio":
      return "audio";
    case "Text":
    default:
      return "text";
  }
};

const statusEnumToLabel = (value: ProjectStatus): Project["status"] => {
  switch (value) {
    case "active":
      return "Active";
    case "archived":
      return "Archived";
    case "completed":
      return "Completed";
    case "draft":
    default:
      return "Drafting";
  }
};

export default function ManagerProjectEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [completingProject, setCompletingProject] = useState(false);

  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectDataType, setEditProjectDataType] =
    useState<Project["dataType"]>("Image");

  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [labels, setLabels] = useState<AvailableLabel[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isAssigning, setIsAssigning] = useState(false);
  const [projectFiles, setProjectFiles] = useState<ApiFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [unassignedAnnotatorFiles, setUnassignedAnnotatorFiles] = useState<
    ApiFile[]
  >([]);
  const [unassignedReviewerFiles, setUnassignedReviewerFiles] = useState<
    ApiFile[]
  >([]);
  const [assignFilesLoading, setAssignFilesLoading] = useState(false);
  const [isAssignAnnotatorsOpen, setIsAssignAnnotatorsOpen] = useState(false);
  const [isAssignReviewersOpen, setIsAssignReviewersOpen] = useState(false);
  const [isSelectPresetOpen, setIsSelectPresetOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedAnnotatorId, setSelectedAnnotatorId] = useState<string | null>(
    null,
  );
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(
    null,
  );
  const [selectedAnnotatorFiles, setSelectedAnnotatorFiles] = useState<
    string[]
  >([]);
  const [selectedReviewerFiles, setSelectedReviewerFiles] = useState<string[]>(
    [],
  );
  const [annotatorFileAssignments, setAnnotatorFileAssignments] = useState<
    Record<string, string[]>
  >({});
  const [reviewerFileAssignments, setReviewerFileAssignments] = useState<
    Record<string, string[]>
  >({});
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [selectedConfigLabelIds, setSelectedConfigLabelIds] = useState<
    string[]
  >([]);
  const [availableLabels, setAvailableLabels] = useState<AvailableLabel[]>([]);
  const [labelSearch, setLabelSearch] = useState("");
  const [presetSearch, setPresetSearch] = useState("");
  const [configSaving, setConfigSaving] = useState(false);
  const [guidelineTitle, setGuidelineTitle] = useState("");
  const [guidelineFile, setGuidelineFile] = useState<File | null>(null);
  const [guidelineAttachmentUrl, setGuidelineAttachmentUrl] = useState<
    string | null
  >(null);
  const [guidelineSaving, setGuidelineSaving] = useState(false);
  const [hasProjectInstruction, setHasProjectInstruction] = useState(false);
  const [projectSnapshots, setProjectSnapshots] = useState<
    ProjectSnapshotListItem[]
  >([]);
  const [snapshotName, setSnapshotName] = useState("");
  const [snapshotDescription, setSnapshotDescription] = useState("");
  const [snapshotsLoading, setSnapshotsLoading] = useState(false);
  const [snapshotCreating, setSnapshotCreating] = useState(false);
  const [deletingSnapshotId, setDeletingSnapshotId] = useState<string | null>(
    null,
  );
  const [isSnapshotExportOpen, setIsSnapshotExportOpen] = useState(false);
  const [selectedSnapshotForExport, setSelectedSnapshotForExport] =
    useState<ProjectSnapshotListItem | null>(null);
  const [snapshotExportOptions, setSnapshotExportOptions] = useState<
    Required<ExportRequestDto>
  >({
    includeFileUrl: true,
    includeAnnotatorInfo: false,
    includeReviewerInfo: false,
    includeLabelColor: true,
  });
  const [snapshotExportJobId, setSnapshotExportJobId] = useState<string | null>(
    null,
  );
  const [snapshotExportStatus, setSnapshotExportStatus] =
    useState<SnapshotExportUiStatus>("IDLE");
  const [snapshotExportError, setSnapshotExportError] = useState<string | null>(
    null,
  );
  const [snapshotExporting, setSnapshotExporting] = useState(false);
  const [snapshotExportDownloading, setSnapshotExportDownloading] =
    useState(false);
  const snapshotExportPollingRef = useRef<number | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);
  const [deletingFileName, setDeletingFileName] = useState<string | null>(null);
  const [changingFileAssigneeKey, setChangingFileAssigneeKey] = useState<
    string | null
  >(null);
  const [unassigningMemberId, setUnassigningMemberId] = useState<string | null>(
    null,
  );
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [annotators, setAnnotators] = useState<TeamMember[]>([]);
  const [reviewers, setReviewers] = useState<TeamMember[]>([]);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const assignedAnnotatorIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(annotatorFileAssignments).forEach((assigned) => {
      assigned.forEach((id) => ids.add(id));
    });
    if (selectedAnnotatorId) {
      ids.add(selectedAnnotatorId);
    }
    return Array.from(ids);
  }, [annotatorFileAssignments, selectedAnnotatorId]);

  const assignedReviewerIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(reviewerFileAssignments).forEach((assigned) => {
      assigned.forEach((id) => ids.add(id));
    });
    if (selectedReviewerId) {
      ids.add(selectedReviewerId);
    }
    return Array.from(ids);
  }, [reviewerFileAssignments, selectedReviewerId]);

  const annotatorTaskAssigneeIds = useMemo(() => {
    return Array.from(
      new Set(
        projectTasks
          .filter(
            (task) =>
              task.assignedUserRole === "annotator" &&
              typeof task.assignedTo === "string" &&
              task.assignedTo.trim().length > 0,
          )
          .map((task) => task.assignedTo),
      ),
    );
  }, [projectTasks]);

  const reviewerTaskAssigneeIds = useMemo(() => {
    return Array.from(
      new Set(
        projectTasks
          .filter(
            (task) =>
              task.assignedUserRole === "reviewer" &&
              typeof task.assignedTo === "string" &&
              task.assignedTo.trim().length > 0,
          )
          .map((task) => task.assignedTo),
      ),
    );
  }, [projectTasks]);

  const selectedPresets = useMemo(() => {
    if (selectedPresetIds.length === 0) {
      return [];
    }
    return presets.filter((preset) => selectedPresetIds.includes(preset.id));
  }, [presets, selectedPresetIds]);

  const selectedPresetLabelIds = useMemo(() => {
    return mergeUniqueIds(selectedPresets.flatMap((preset) => preset.labelIds));
  }, [selectedPresets]);

  const computedConfigLabelIds = useMemo(() => {
    return mergeUniqueIds(selectedConfigLabelIds, selectedPresetLabelIds);
  }, [selectedConfigLabelIds, selectedPresetLabelIds]);

  const labelLookup = useMemo(() => {
    const map = new Map<string, AvailableLabel>();

    availableLabels.forEach((label) => {
      map.set(label.id, label);
    });

    labels.forEach((label) => {
      map.set(label.id, label);
    });

    return map;
  }, [availableLabels, labels]);

  const configuredLabels = useMemo(() => {
    return computedConfigLabelIds.map((id) => {
      return (
        labelLookup.get(id) ?? {
          id,
          name: id,
          description: undefined,
          color: undefined,
        }
      );
    });
  }, [computedConfigLabelIds, labelLookup]);

  const isProjectCompleted = useMemo(() => {
    return project?.status === "Completed";
  }, [project]);

  const isReadyToComplete = useMemo(() => {
    return (
      projectFiles.length > 0 &&
      projectFiles.every((file) => file.status === "approved")
    );
  }, [projectFiles]);

  const mapLabelPreset = (preset: ApiLabelPreset): Preset => {
    const labelRefs = Array.isArray(preset.labels)
      ? (preset.labels as Array<{ id: string; name?: string }>).filter(
          (label) => Boolean(label?.id),
        )
      : [];

    return {
      id: preset.id,
      name: preset.name,
      description: preset.description ?? undefined,
      labelIds: labelRefs.map((label) => label.id),
      createdAt: preset.createdAt,
    };
  };

  const mapApiLabel = (label: ApiLabel): AvailableLabel => {
    const rawColor = (label as { color?: unknown }).color;

    return {
      id: label.id,
      name: label.name,
      description: label.description,
      color: typeof rawColor === "string" ? rawColor : undefined,
    };
  };

  const loadProjectFiles = async (projectId: string) => {
    setFilesLoading(true);
    try {
      const response = await getFilesPaginated({
        projectId,
        orderBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 50,
      });
      const fetched = extractArray<ApiFile>(response);
      setProjectFiles(fetched);
      setUploadedFiles(fetched.map((file) => file.fileName));
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load project files."));
      setProjectFiles([]);
      setUploadedFiles([]);
    } finally {
      setFilesLoading(false);
    }
  };

  const loadUnassignedFiles = async (projectId: string, role: Role) => {
    setAssignFilesLoading(true);
    try {
      const response = await getUnassignedFiles(projectId, role, false);
      const fetched = extractArray<ApiFile>(response);
      if (role === "annotator") {
        setUnassignedAnnotatorFiles(fetched);
      } else if (role === "reviewer") {
        setUnassignedReviewerFiles(fetched);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load unassigned files."));
      if (role === "annotator") {
        setUnassignedAnnotatorFiles([]);
      } else if (role === "reviewer") {
        setUnassignedReviewerFiles([]);
      }
    } finally {
      setAssignFilesLoading(false);
    }
  };

  const loadMembersByRole = async (
    role: Role,
    setMembers: Dispatch<SetStateAction<TeamMember[]>>,
  ) => {
    try {
      const response = await getAllAccounts({
        search: role,
        searchBy: "role",
        orderBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 200,
      });
      const accounts = extractArray<Account>(response);
      const members = mapAccountsToMembers(accounts, "active");
      setMembers(members);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load team members."));
      setMembers([]);
    }
  };

  const loadAssignmentsFromTasks = async (projectId: string) => {
    try {
      const response = await getManagerProjectTasks({
        projectId,
        orderBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 200,
      });
      const tasks = extractArray<ProjectTask>(response);
      setProjectTasks(tasks);
      setAnnotatorFileAssignments(
        buildAssignmentsFromTasks(tasks, "annotator"),
      );
      setReviewerFileAssignments(buildAssignmentsFromTasks(tasks, "reviewer"));
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load assignments."));
      setAnnotatorFileAssignments({});
      setReviewerFileAssignments({});
    }
  };

  const loadPresets = async (searchTerm = "") => {
    setPresetsLoading(true);

    try {
      const response = await getLabelPresetsPaginated({
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        orderBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 50,
      });

      const fetched =
        extractArray<ApiLabelPreset>(response).map(mapLabelPreset);
      setPresets(fetched);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load label presets."));
      setPresets([]);
    } finally {
      setPresetsLoading(false);
    }
  };

  const loadLabels = async () => {
    setLabelsLoading(true);
    try {
      const response = await getAllLabels({
        orderBy: "name",
        order: "ASC",
      });
      const fetched = extractArray<ApiLabel>(response).map(mapApiLabel);
      setLabels(fetched);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to load labels."));
      setLabels([]);
    } finally {
      setLabelsLoading(false);
    }
  };

  const loadProjectConfiguration = async (projectId: string) => {
    try {
      const response = await getProjectConfigurationByProjectId(projectId);
      const config = unwrapApiResponse<
        ProjectConfiguration & { availableLabels?: unknown }
      >(response);
      if (config && Array.isArray(config.availableLabelIds)) {
        setSelectedConfigLabelIds(config.availableLabelIds);
      } else {
        setSelectedConfigLabelIds([]);
      }

      setAvailableLabels(normalizeAvailableLabels(config?.availableLabels));
      setSelectedPresetIds([]);
    } catch (err) {
      toast.error(
        extractErrorMessage(err, "Failed to load project configuration."),
      );
      setSelectedConfigLabelIds([]);
      setAvailableLabels([]);
      setSelectedPresetIds([]);
    }
  };

  const loadProjectInstruction = async (projectId: string) => {
    try {
      const response = await getProjectInstructionByProjectId(projectId);
      const instruction = unwrapApiResponse<ProjectInstruction>(response);

      if (!instruction) {
        setGuidelineTitle("");
        setGuidelineAttachmentUrl(null);
        setHasProjectInstruction(false);
        return;
      }

      setGuidelineTitle(instruction.title ?? "");
      setGuidelineAttachmentUrl(instruction.attachmentUrl ?? null);
      setHasProjectInstruction(true);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response
        ?.status;

      if (status === 404) {
        setGuidelineTitle("");
        setGuidelineAttachmentUrl(null);
        setHasProjectInstruction(false);
        return;
      }

      toast.error(extractErrorMessage(err, "Failed to load guideline."));
    }
  };

  const loadProjectSnapshots = async (projectId: string) => {
    setSnapshotsLoading(true);
    try {
      const response = await getProjectSnapshots(projectId, {
        page: 1,
        limit: 50,
      });
      const snapshots = extractArray<ProjectSnapshotListItem>(response);
      setProjectSnapshots(snapshots);
    } catch (err) {
      toast.error(
        extractErrorMessage(err, "Failed to load project snapshots."),
      );
      setProjectSnapshots([]);
    } finally {
      setSnapshotsLoading(false);
    }
  };

  useEffect(() => {
    void loadPresets();
    void loadLabels();
  }, []);

  useEffect(() => {
    const refreshMembers = () => {
      void loadMembersByRole("annotator", setAnnotators);
      void loadMembersByRole("reviewer", setReviewers);
    };

    refreshMembers();
    window.addEventListener(ADMIN_USERS_UPDATED_EVENT, refreshMembers);

    return () => {
      window.removeEventListener(ADMIN_USERS_UPDATED_EVENT, refreshMembers);
    };
  }, []);

  useEffect(() => {
    if (isSelectPresetOpen) {
      void loadPresets(presetSearch);
    }
  }, [presetSearch, isSelectPresetOpen]);

  useEffect(() => {
    if (!id) {
      return;
    }
    if (isAssignAnnotatorsOpen) {
      void loadUnassignedFiles(id, "annotator");
    }
  }, [id, isAssignAnnotatorsOpen]);

  useEffect(() => {
    if (!id) {
      return;
    }
    if (isAssignReviewersOpen) {
      void loadUnassignedFiles(id, "reviewer");
    }
  }, [id, isAssignReviewersOpen]);

  useEffect(() => {
    if (!id) {
      toast.error("Missing project id.");
      setLoading(false);
      return;
    }

    const loadProject = async () => {
      setLoading(true);

      try {
        const resp = await getProjectById(id);
        const data = unwrapApiResponse<ApiProject>(resp);
        if (!data) {
          throw new Error("Invalid project response.");
        }

        const uiProject: Project = {
          id: data.id,
          name: data.name,
          description: data.description ?? undefined,
          status: statusEnumToLabel(data.projectStatus),
          dataType: dataTypeEnumToLabel(data.dataType),
          createdAt: data.createdAt,
          imageUrl:
            (data as { imageUrl?: string | null }).imageUrl ?? undefined,
        };

        setProject(uiProject);
        setEditProjectName(uiProject.name);
        setEditProjectDescription(uiProject.description ?? "");
        setEditProjectDataType(uiProject.dataType);
        setThumbnailPreview(uiProject.imageUrl ?? null);
        setThumbnailFile(null);
        setUploadedFiles(uiProject.uploadedFiles ?? []);
        setAnnotatorFileAssignments(uiProject.annotatorFileAssignments ?? {});
        setReviewerFileAssignments(uiProject.reviewerFileAssignments ?? {});
        const annotatorIds = uiProject.assignedAnnotatorIds ?? [];
        const reviewerIds = uiProject.assignedReviewerIds ?? [];
        setSelectedAnnotatorId(
          annotatorIds.length === 1 ? annotatorIds[0] : null,
        );
        setSelectedReviewerId(reviewerIds.length === 1 ? reviewerIds[0] : null);
      } catch (err) {
        toast.error(extractErrorMessage(err, "Failed to load project."));
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
    void loadProjectFiles(id);
    void loadAssignmentsFromTasks(id);
    void loadProjectConfiguration(id);
    void loadProjectInstruction(id);
    void loadProjectSnapshots(id);
  }, [id]);

  useEffect(() => {
    if (projectFiles.length === 0) {
      return;
    }
    setAnnotatorFileAssignments((prev) =>
      normalizeAssignments(prev, projectFiles),
    );
    setReviewerFileAssignments((prev) =>
      normalizeAssignments(prev, projectFiles),
    );
  }, [projectFiles]);

  const stopSnapshotExportPolling = () => {
    if (snapshotExportPollingRef.current !== null) {
      window.clearInterval(snapshotExportPollingRef.current);
      snapshotExportPollingRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopSnapshotExportPolling();
    };
  }, []);

  const handleRemoveConfiguredLabel = (labelId: string) => {
    setSelectedConfigLabelIds((prev) => prev.filter((id) => id !== labelId));
    setSelectedPresetIds((prev) =>
      prev.filter((presetId) => {
        const preset = presets.find((item) => item.id === presetId);
        return preset ? !preset.labelIds.includes(labelId) : true;
      }),
    );
  };

  const closeWithAnimation = (
    key: string,
    closeFn: Dispatch<SetStateAction<boolean>>,
  ) => {
    setClosingModals((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      closeFn(false);
      setClosingModals((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 200);
  };

  const handleOpenSnapshotExportModal = (snapshotId: string) => {
    const target = projectSnapshots.find(
      (snapshot) => snapshot.id === snapshotId,
    );
    if (!target) {
      toast.error("Snapshot not found.");
      return;
    }

    stopSnapshotExportPolling();
    setSelectedSnapshotForExport(target);
    setSnapshotExportOptions({
      includeFileUrl: true,
      includeAnnotatorInfo: false,
      includeReviewerInfo: false,
      includeLabelColor: true,
    });
    setSnapshotExportStatus("IDLE");
    setSnapshotExportError(null);
    setSnapshotExportJobId(null);
    setSnapshotExportDownloading(false);
    setSnapshotExporting(false);
    setIsSnapshotExportOpen(true);
  };

  const handleCloseSnapshotExportModal = () => {
    stopSnapshotExportPolling();
    closeWithAnimation("snapshotExport", setIsSnapshotExportOpen);
  };

  const pollSnapshotExportStatus = async (exportId: string) => {
    try {
      const response = await getDatasetExportStatus(exportId);
      const statusPayload =
        unwrapApiResponse<DatasetExportStatusResponse>(response) ??
        (response as DatasetExportStatusResponse);

      setSnapshotExportStatus(statusPayload.status);

      if (statusPayload.status === "FAILED") {
        stopSnapshotExportPolling();
        setSnapshotExportError(statusPayload.error ?? "Export failed.");
        setSnapshotExporting(false);
      }

      if (statusPayload.status === "DONE") {
        stopSnapshotExportPolling();
        setSnapshotExportError(null);
        setSnapshotExporting(false);
      }
    } catch (err) {
      stopSnapshotExportPolling();
      setSnapshotExportStatus("FAILED");
      setSnapshotExportError(
        extractErrorMessage(err, "Failed to poll export status."),
      );
      setSnapshotExporting(false);
    }
  };

  const startSnapshotExportPolling = (exportId: string) => {
    stopSnapshotExportPolling();
    snapshotExportPollingRef.current = window.setInterval(() => {
      void pollSnapshotExportStatus(exportId);
    }, 1500);
  };

  const toggleSelection = (
    id: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const resolveNames = (list: TeamMember[], ids: string[]) => {
    return ids.map((id) => list.find((item) => item.id === id)?.name || id);
  };

  const resolveMemberName = (list: TeamMember[], id: string) => {
    return list.find((item) => item.id === id)?.name || id;
  };

  const resolveFileName = (fileId: string) => {
    const fileMap = mapFilesById(projectFiles);
    return fileMap.get(fileId)?.fileName || fileId;
  };

  const applyAssignments = (
    selectedFiles: string[],
    selectedMembers: string[],
    setAssignments: Dispatch<SetStateAction<Record<string, string[]>>>,
  ) => {
    if (selectedFiles.length === 0 || selectedMembers.length === 0) {
      return;
    }
    setAssignments((prev) => {
      const next = { ...prev };
      selectedFiles.forEach((file) => {
        const existing = next[file] ?? [];
        next[file] = Array.from(new Set([...existing, ...selectedMembers]));
      });
      return next;
    });
  };

  const removeMemberAssignments = (
    memberId: string,
    setAssignments: Dispatch<SetStateAction<Record<string, string[]>>>,
  ) => {
    setAssignments((prev) => {
      const next: Record<string, string[]> = {};
      Object.entries(prev).forEach(([fileId, ids]) => {
        const filtered = ids.filter((id) => id !== memberId);
        if (filtered.length > 0) {
          next[fileId] = filtered;
        }
      });
      return next;
    });
  };

  const handleClearAssignedMember = async (
    role: "annotator" | "reviewer",
    memberId: string,
  ) => {
    const tasksToDelete = projectTasks.filter(
      (task) => task.assignedTo === memberId && task.assignedUserRole === role,
    );

    setUnassigningMemberId(memberId);
    try {
      await Promise.all(
        tasksToDelete.map((task) => deleteProjectTask(task.id)),
      );
      if (id) {
        await loadAssignmentsFromTasks(id);
      }
      if (role === "annotator" && selectedAnnotatorId === memberId) {
        setSelectedAnnotatorId(null);
      } else if (role === "reviewer" && selectedReviewerId === memberId) {
        setSelectedReviewerId(null);
      }
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to unassign member."));
      throw err;
    } finally {
      setUnassigningMemberId(null);
    }
  };

  const submitAssignment = async (
    role: Role,
    assignedUserId: string | null,
    selectedFileIds: string[],
    closeModal: Dispatch<SetStateAction<boolean>>,
    setAssignments: Dispatch<SetStateAction<Record<string, string[]>>>,
    clearSelectedFiles: Dispatch<SetStateAction<string[]>>,
  ) => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }
    if (!assignedUserId) {
      toast.error("Select a user to assign.");
      return;
    }
    if (selectedFileIds.length === 0) {
      toast.error("Select at least one file to assign.");
      return;
    }

    setIsAssigning(true);
    try {
      await createProjectTask({
        projectId: id,
        assignedUserId,
        fileIds: selectedFileIds,
      });
      applyAssignments(selectedFileIds, [assignedUserId], setAssignments);
      await loadProjectFiles(id);
      await loadUnassignedFiles(id, role);
      toast.success("Assignment created successfully.");
      clearSelectedFiles([]);
      closeModal(false);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create assignment."));
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUploadFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedUploadFiles(files);
  };

  const handleConfirmUpload = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    setIsUploading(true);
    try {
      if (selectedUploadFiles.length > 0) {
        const uploadedNames = selectedUploadFiles.map((file) => file.name);

        let uploadSucceeded = false;
        try {
          await Promise.all(
            selectedUploadFiles.map((file) =>
              createFile({ projectId: id }, file),
            ),
          );
          await loadProjectFiles(id);
          uploadSucceeded = true;
          toast.success("Files uploaded successfully.");
        } catch (err) {
          toast.error(extractErrorMessage(err, "Failed to upload files."));
        }

        if (!uploadSucceeded) {
          setUploadedFiles((prev) => [...prev, ...uploadedNames]);
        }
      }
      setIsUploadOpen(false);
      setSelectedUploadFiles([]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteUploadedFile = async (fileName: string) => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }
    const idByName = mapFileNameToId(projectFiles).get(fileName);
    if (!idByName) {
      toast.error("Unable to find file id for deletion.");
      return;
    }
    setDeletingFileName(fileName);
    try {
      await deleteFile(idByName);
      await loadProjectFiles(id);
      toast.success("File deleted.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete file."));
      throw err;
    } finally {
      setDeletingFileName(null);
    }
  };

  const handleChangeFileAssignee = async (
    fileId: string,
    role: "annotator" | "reviewer",
    assigneeId: string,
  ) => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    const key = `${fileId}:${role}`;
    setChangingFileAssigneeKey(key);
    try {
      if (role === "annotator") {
        await updateFile(fileId, { annotatorId: assigneeId });
      } else {
        await updateFile(fileId, { reviewerId: assigneeId });
      }
      await loadProjectFiles(id);
      toast.success(
        `${role === "annotator" ? "Annotator" : "Reviewer"} updated.`,
      );
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update assignee."));
      throw err;
    } finally {
      setChangingFileAssigneeKey(null);
    }
  };

  const handleGuidelineFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setGuidelineFile(file);
  };

  const handleThumbnailFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setThumbnailFile(file);
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setThumbnailPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setThumbnailPreview(null);
    }
  };

  const handleSaveGuideline = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    const nextTitle = guidelineTitle.trim();

    if (!nextTitle) {
      toast.error("Guideline title is required.");
      return;
    }

    setGuidelineSaving(true);

    try {
      const response = hasProjectInstruction
        ? await updateProjectInstruction(
            id,
            {
              title: nextTitle,
              content: "some-content",
            },
            guidelineFile ?? undefined,
          )
        : await createProjectInstruction(
            {
              projectId: id,
              title: nextTitle,
              content: "",
            },
            guidelineFile ?? undefined,
          );

      const updated = unwrapApiResponse<ProjectInstruction>(response);
      setGuidelineTitle(updated?.title ?? nextTitle);
      setGuidelineAttachmentUrl(updated?.attachmentUrl ?? null);
      setHasProjectInstruction(true);
      setGuidelineFile(null);

      toast.success("Guideline saved successfully.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to save guideline."));
    } finally {
      setGuidelineSaving(false);
    }
  };

  const handleCreateSnapshot = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    const nextName = snapshotName.trim();
    const nextDescription = snapshotDescription.trim();

    if (!nextName) {
      toast.error("Snapshot name is required.");
      return;
    }

    setSnapshotCreating(true);
    try {
      await createProjectSnapshot(id, {
        name: nextName,
        ...(nextDescription && { description: nextDescription }),
      });
      toast.success("Snapshot created successfully.");
      setSnapshotName("");
      setSnapshotDescription("");
      await loadProjectSnapshots(id);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to create snapshot."));
    } finally {
      setSnapshotCreating(false);
    }
  };

  const handleDeleteSnapshot = async (snapshotId: string) => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this snapshot? This action cannot be undone.",
    );

    if (!confirmed) {
      return;
    }

    setDeletingSnapshotId(snapshotId);
    try {
      await deleteProjectSnapshot(snapshotId);
      toast.success("Snapshot deleted successfully.");
      await loadProjectSnapshots(id);
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete snapshot."));
    } finally {
      setDeletingSnapshotId(null);
    }
  };

  const handleStartSnapshotExport = async () => {
    if (!selectedSnapshotForExport) {
      toast.error("Missing snapshot selection.");
      return;
    }

    setSnapshotExporting(true);
    setSnapshotExportError(null);
    setSnapshotExportStatus("PENDING");

    try {
      const response = await initiateDatasetExport(
        selectedSnapshotForExport.id,
        snapshotExportOptions,
      );
      const payload =
        unwrapApiResponse<DatasetExportInitiateResponse>(response) ??
        (response as DatasetExportInitiateResponse);

      setSnapshotExportJobId(payload.exportId);
      setSnapshotExportStatus(payload.status);

      if (payload.status === "PENDING") {
        startSnapshotExportPolling(payload.exportId);
      } else if (payload.status === "DONE") {
        setSnapshotExporting(false);
      } else {
        setSnapshotExporting(false);
        setSnapshotExportError("Export failed.");
      }
    } catch (err) {
      setSnapshotExportStatus("FAILED");
      setSnapshotExportError(
        extractErrorMessage(err, "Failed to start export."),
      );
      setSnapshotExporting(false);
    }
  };

  const handleDownloadSnapshotExport = async () => {
    if (!snapshotExportJobId) {
      toast.error("No export job available for download.");
      return;
    }

    setSnapshotExportDownloading(true);
    try {
      const { blob, fileName } =
        await downloadDatasetExport(snapshotExportJobId);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName || "dataset.zip";
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      toast.success("Dataset download started.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to download export."));
    } finally {
      setSnapshotExportDownloading(false);
    }
  };

  const saveProjectChanges = async () => {
    if (!project || !id) {
      return false;
    }

    setSaving(true);

    try {
      const resp = await updateProject(
        id,
        {
          name: editProjectName.trim() || project.name,
          ...(editProjectDescription.trim() && {
            description: editProjectDescription.trim(),
          }),
          dataType: dataTypeLabelToEnum(editProjectDataType),
        },
        thumbnailFile ?? undefined,
      );

      const updated = unwrapApiResponse<ApiProject>(resp);
      if (!updated) {
        throw new Error("Invalid update project response.");
      }

      setProject((prev) =>
        prev
          ? {
              ...prev,
              name: updated.name,
              description: updated.description ?? undefined,
              dataType: dataTypeEnumToLabel(updated.dataType),
              status: statusEnumToLabel(updated.projectStatus),
              createdAt: updated.createdAt,
              imageUrl:
                (updated as { imageUrl?: string | null }).imageUrl ??
                prev.imageUrl,
            }
          : prev,
      );

      setEditProjectName(updated.name);
      setEditProjectDescription(updated.description ?? "");
      setEditProjectDataType(dataTypeEnumToLabel(updated.dataType));
      setThumbnailPreview(
        (updated as { imageUrl?: string | null }).imageUrl ?? thumbnailPreview,
      );
      setThumbnailFile(null);
      return true;
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update project."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const saveProjectConfigurationChanges = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return false;
    }

    setConfigSaving(true);

    try {
      await updateProjectConfiguration(id, {
        availableLabelIds: computedConfigLabelIds,
      });

      setSelectedConfigLabelIds(computedConfigLabelIds);
      setSelectedPresetIds([]);
      await loadProjectConfiguration(id);
      toast.success("Project label configuration saved.");
      return true;
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to update configuration."));
      return false;
    } finally {
      setConfigSaving(false);
    }
  };

  const handleSaveProjectInfo = async () => {
    const saved = await saveProjectChanges();
    if (saved) {
      toast.success("Project updated successfully.");
    }
  };

  const handleDeleteProject = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    try {
      await deleteProject(id);
      toast.success("Project deleted.");
      navigate("/manager/projects");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete project."));
      throw err;
    }
  };

  const handleCompleteProject = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    setCompletingProject(true);
    try {
      await completeProject({ projectId: id });
      setProject((prev) =>
        prev
          ? {
              ...prev,
              status: "Completed",
            }
          : prev,
      );
      toast.success("Project completed successfully.");
      navigate("/manager/projects");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to complete project."));
    } finally {
      setCompletingProject(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full bg-gray-50 px-6 py-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500 shadow-sm">
            Loading project...
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="w-full bg-gray-50 px-6 py-6">
        <div className="mx-auto w-full max-w-4xl">
          <div className="rounded-lg border border-red-200 bg-red-50 px-5 py-6 text-sm text-red-700 shadow-sm">
            {"Project not found."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 px-6 py-6">
      <div className="mx-auto w-full max-w-6xl">
        <ProjectEditHeader
          status={project.status}
          createdAtLabel={formatDateLabel(project.createdAt)}
          onBackToProjects={() => navigate("/manager/projects")}
        />

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <ProjectEditInfoForm
            project={project}
            editProjectName={editProjectName}
            editProjectDescription={editProjectDescription}
            editProjectDataType={editProjectDataType}
            thumbnailFile={thumbnailFile}
            thumbnailPreview={thumbnailPreview}
            saving={saving}
            isProjectCompleted={isProjectCompleted}
            onEditProjectNameChange={setEditProjectName}
            onEditProjectDescriptionChange={setEditProjectDescription}
            onEditProjectDataTypeChange={setEditProjectDataType}
            onThumbnailFileChange={handleThumbnailFileChange}
            onSaveProjectInfo={handleSaveProjectInfo}
          />

          <ProjectEditSnapshots
            snapshots={projectSnapshots}
            loading={snapshotsLoading}
            creating={snapshotCreating}
            deletingSnapshotId={deletingSnapshotId}
            snapshotName={snapshotName}
            snapshotDescription={snapshotDescription}
            onSnapshotNameChange={setSnapshotName}
            onSnapshotDescriptionChange={setSnapshotDescription}
            onCreateSnapshot={() => void handleCreateSnapshot()}
            onDeleteSnapshot={(snapshotId) =>
              void handleDeleteSnapshot(snapshotId)
            }
            onExportSnapshot={handleOpenSnapshotExportModal}
          />

          <ProjectEditSections
            uploadedFiles={uploadedFiles}
            filesLoading={filesLoading}
            projectFiles={projectFiles}
            assignedAnnotatorIds={assignedAnnotatorIds}
            assignedReviewerIds={assignedReviewerIds}
            annotatorTaskAssigneeIds={annotatorTaskAssigneeIds}
            reviewerTaskAssigneeIds={reviewerTaskAssigneeIds}
            configuredLabels={configuredLabels}
            annotatorFileAssignments={annotatorFileAssignments}
            reviewerFileAssignments={reviewerFileAssignments}
            annotators={annotators}
            reviewers={reviewers}
            guidelineTitle={guidelineTitle}
            guidelineFile={guidelineFile}
            guidelineAttachmentUrl={guidelineAttachmentUrl}
            hasProjectInstruction={hasProjectInstruction}
            guidelineSaving={guidelineSaving}
            configSaving={configSaving}
            saving={saving}
            onOpenUpload={() => setIsUploadOpen(true)}
            onOpenAssignAnnotators={() => {
              setAssignSearch("");
              setSelectedAnnotatorFiles([]);
              setIsAssignAnnotatorsOpen(true);
            }}
            onOpenAssignReviewers={() => {
              setAssignSearch("");
              setSelectedReviewerFiles([]);
              setIsAssignReviewersOpen(true);
            }}
            onOpenLabelConfig={() => {
              setLabelSearch("");
              setPresetSearch("");
              setIsSelectPresetOpen(true);
            }}
            onDeleteUploadedFile={handleDeleteUploadedFile}
            deletingFileName={deletingFileName}
            changingFileAssigneeKey={changingFileAssigneeKey}
            onChangeFileAssignee={handleChangeFileAssignee}
            onClearAssignedMember={(role, memberId) =>
              void handleClearAssignedMember(role, memberId)
            }
            unassigningMemberId={unassigningMemberId}
            onRemoveConfiguredLabel={handleRemoveConfiguredLabel}
            onSaveLabelConfiguration={() =>
              void saveProjectConfigurationChanges()
            }
            onGuidelineTitleChange={setGuidelineTitle}
            onGuidelineFileChange={handleGuidelineFileChange}
            onSaveGuideline={() => void handleSaveGuideline()}
            onDeleteProject={handleDeleteProject}
            onCancel={() => navigate("/manager/projects")}
            onCompleteProject={() => void handleCompleteProject()}
            isReadyToComplete={isReadyToComplete}
            isProjectCompleted={isProjectCompleted}
            completingProject={completingProject}
            resolveMemberName={resolveMemberName}
            resolveFileName={resolveFileName}
            resolveNames={resolveNames}
          />
        </div>
      </div>

      <ProjectEditUploadModal
        open={isUploadOpen}
        closing={Boolean(closingModals.upload)}
        selectedUploadFiles={selectedUploadFiles}
        isUploading={isUploading}
        onClose={() => closeWithAnimation("upload", setIsUploadOpen)}
        onUploadFileChange={handleUploadFileChange}
        onConfirmUpload={() => void handleConfirmUpload()}
      />

      <ProjectEditAssignModal
        open={isAssignAnnotatorsOpen}
        closing={Boolean(closingModals.assignAnnotators)}
        title="Assign annotators"
        searchPlaceholder="Search annotators"
        search={assignSearch}
        onSearchChange={setAssignSearch}
        members={annotators}
        selectedMemberId={selectedAnnotatorId}
        onSelectMember={setSelectedAnnotatorId}
        selectedFiles={selectedAnnotatorFiles}
        onClearFiles={() => setSelectedAnnotatorFiles([])}
        filesLoading={assignFilesLoading}
        unassignedFiles={unassignedAnnotatorFiles}
        onToggleFile={(fileId) =>
          toggleSelection(fileId, setSelectedAnnotatorFiles)
        }
        isAssigning={isAssigning}
        onConfirm={() =>
          void submitAssignment(
            "annotator",
            selectedAnnotatorId,
            selectedAnnotatorFiles,
            setIsAssignAnnotatorsOpen,
            setAnnotatorFileAssignments,
            setSelectedAnnotatorFiles,
          )
        }
        onClose={() =>
          closeWithAnimation("assignAnnotators", setIsAssignAnnotatorsOpen)
        }
      />

      <ProjectEditAssignModal
        open={isAssignReviewersOpen}
        closing={Boolean(closingModals.assignReviewers)}
        title="Assign reviewers"
        searchPlaceholder="Search reviewers"
        search={assignSearch}
        onSearchChange={setAssignSearch}
        members={reviewers}
        selectedMemberId={selectedReviewerId}
        onSelectMember={setSelectedReviewerId}
        selectedFiles={selectedReviewerFiles}
        onClearFiles={() => setSelectedReviewerFiles([])}
        filesLoading={assignFilesLoading}
        unassignedFiles={unassignedReviewerFiles}
        onToggleFile={(fileId) =>
          toggleSelection(fileId, setSelectedReviewerFiles)
        }
        isAssigning={isAssigning}
        onConfirm={() =>
          void submitAssignment(
            "reviewer",
            selectedReviewerId,
            selectedReviewerFiles,
            setIsAssignReviewersOpen,
            setReviewerFileAssignments,
            setSelectedReviewerFiles,
          )
        }
        onClose={() =>
          closeWithAnimation("assignReviewers", setIsAssignReviewersOpen)
        }
      />

      <ProjectEditLabelConfigModal
        open={isSelectPresetOpen}
        closing={Boolean(closingModals.selectPreset)}
        labelSearch={labelSearch}
        presetSearch={presetSearch}
        labelsLoading={labelsLoading}
        labels={labels}
        selectedConfigLabelIds={selectedConfigLabelIds}
        presetsLoading={presetsLoading}
        presets={presets}
        selectedPresetIds={selectedPresetIds}
        onLabelSearchChange={setLabelSearch}
        onPresetSearchChange={setPresetSearch}
        onToggleConfigLabel={(labelId) =>
          toggleSelection(labelId, setSelectedConfigLabelIds)
        }
        onTogglePreset={(presetId) =>
          toggleSelection(presetId, setSelectedPresetIds)
        }
        onClose={() =>
          closeWithAnimation("selectPreset", setIsSelectPresetOpen)
        }
      />

      <ProjectEditSnapshotExportModal
        open={isSnapshotExportOpen}
        closing={Boolean(closingModals.snapshotExport)}
        snapshotName={selectedSnapshotForExport?.name ?? null}
        options={snapshotExportOptions}
        status={snapshotExportStatus}
        statusError={snapshotExportError}
        exporting={snapshotExporting}
        downloading={snapshotExportDownloading}
        canDownload={snapshotExportStatus === "DONE"}
        onOptionChange={(key, value) =>
          setSnapshotExportOptions((prev) => ({ ...prev, [key]: value }))
        }
        onStartExport={() => void handleStartSnapshotExport()}
        onDownload={() => void handleDownloadSnapshotExport()}
        onClose={handleCloseSnapshotExportModal}
      />
    </div>
  );
}
