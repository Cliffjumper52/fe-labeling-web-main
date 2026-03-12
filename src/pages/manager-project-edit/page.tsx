import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type MouseEvent,
  type SetStateAction,
  type Dispatch,
} from "react";
import { createPortal } from "react-dom";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  saveFilesToImageStore,
  type StoredImageRef,
} from "../../utils/image-store";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type {
  AccountStatus,
  DataType,
  ProjectStatus,
  Role,
} from "../../interface/enums/domain.enums";
import type { Account } from "../../interface/account/account.interface";
import type { Project as ApiProject } from "../../interface/project/project.interface";
import type { LabelPreset as ApiLabelPreset } from "../../interface/label-preset/label-preset.interface";
import type { File as ApiFile } from "../../interface/file/file.interface";
import {
  getProjectById,
  updateProject,
  deleteProject,
} from "../../services/project-service.service";
import { getLabelPresetsPaginated } from "../../services/label-preset-service.service";
import {
  createFile,
  getFilesPaginated,
  getUnassignedFiles,
  deleteFile,
} from "../../services/file-service.service";
import { getAllAccounts } from "../../services/account-service.service";
import {
  createProjectTask,
  getManagerProjectTasks,
} from "../../services/project-task-service.service";
import type { ProjectTask } from "../../interface/project-task/project-task.interface";
import {
  getProjectConfigurationByProjectId,
  updateProjectConfiguration,
} from "../../services/project-configuration-service.service";
import type { ProjectConfiguration } from "../../interface/project-configuration/project-configuration.interface";

type Project = {
  id: string;
  name: string;
  description?: string;
  status: "Drafting" | "Active" | "Archived" | "Completed";
  dataType: "Image" | "Video" | "Text" | "Audio";
  createdAt: string;
  uploadedFiles?: string[];
  selectedPreset?: Preset | null;
  assignedAnnotatorIds?: string[];
  assignedReviewerIds?: string[];
  annotatorFileAssignments?: Record<string, string[]>;
  reviewerFileAssignments?: Record<string, string[]>;
};

type Preset = {
  id: string;
  name: string;
  description?: string;
  labelIds: string[];
  labelNames: string[];
  createdAt: string;
};

type TeamMember = {
  id: string;
  name: string;
  email: string;
  workload: string;
};

type UploadedImage = {
  name: string;
  dataUrl: string;
};

type UploadImageFile = {
  name: string;
  file: File;
};

const createImagePlaceholderDataUrl = (label: string) => {
  const safe = encodeURIComponent(label);
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='640' height='360'><rect width='100%' height='100%' fill='#f3f4f6'/><text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='#374151' font-size='20' font-family='Arial, sans-serif'>${safe}</text></svg>`;
  return `data:image/svg+xml;utf8,${svg}`;
};

const toLightweightImages = (images: UploadedImage[]) => {
  return images.map((image) => ({
    name: image.name,
    dataUrl: createImagePlaceholderDataUrl(image.name),
  }));
};

const compactUnknownImages = (value: unknown): UploadedImage[] => {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => {
      if (typeof item !== "object" || item === null) {
        return null;
      }

      const raw = item as { name?: unknown };
      if (typeof raw.name !== "string") {
        return null;
      }

      return {
        name: raw.name,
        dataUrl: createImagePlaceholderDataUrl(raw.name),
      };
    })
    .filter((item): item is UploadedImage => item !== null);
};

type PaginationResult<T> = {
  data: T[];
  totalPages?: number;
  pageCount?: number;
};

const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";
const ANNOTATOR_TASKS_UPDATED_EVENT = "annotator-tasks-updated";
const ADMIN_USERS_UPDATED_EVENT = "admin-users-updated";

const fallbackAnnotators: TeamMember[] = [
  {
    id: "ann-1",
    name: "Annotator A",
    email: "annotator.a@labeling.io",
    workload: "12 tasks",
  },
  {
    id: "ann-2",
    name: "Annotator B",
    email: "annotator.b@labeling.io",
    workload: "8 tasks",
  },
  {
    id: "ann-3",
    name: "Annotator C",
    email: "annotator.c@labeling.io",
    workload: "5 tasks",
  },
];

const fallbackReviewers: TeamMember[] = [
  {
    id: "rev-1",
    name: "Reviewer A",
    email: "reviewer.a@labeling.io",
    workload: "10 tasks",
  },
  {
    id: "rev-2",
    name: "Reviewer B",
    email: "reviewer.b@labeling.io",
    workload: "6 tasks",
  },
  {
    id: "rev-3",
    name: "Reviewer C",
    email: "reviewer.c@labeling.io",
    workload: "4 tasks",
  },
];

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

const sortLabelIds = (value: string[]) => {
  return [...value].sort((left, right) => left.localeCompare(right));
};

const areSameLabelIds = (left: string[], right: string[]) => {
  if (left.length !== right.length) {
    return false;
  }
  const sortedLeft = sortLabelIds(left);
  const sortedRight = sortLabelIds(right);
  return sortedLeft.every((id, index) => id === sortedRight[index]);
};

const findPresetByLabelIds = (presets: Preset[], labelIds: string[]) => {
  return presets.find((preset) => areSameLabelIds(preset.labelIds, labelIds));
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
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;
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
  const [error, setError] = useState<string | null>(null);

  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectDataType, setEditProjectDataType] = useState<
    Project["dataType"]
  >("Image");

  const [presets, setPresets] = useState<Preset[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadName, setUploadName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedImageFiles, setUploadedImageFiles] = useState<
    UploadImageFile[]
  >([]);
  const [projectFiles, setProjectFiles] = useState<ApiFile[]>([]);
  const [filesLoading, setFilesLoading] = useState(false);
  const [unassignedAnnotatorFiles, setUnassignedAnnotatorFiles] = useState<
    ApiFile[]
  >([]);
  const [unassignedReviewerFiles, setUnassignedReviewerFiles] = useState<
    ApiFile[]
  >([]);
  const [assignFilesLoading, setAssignFilesLoading] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement>(null);
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
  const [selectedAnnotatorFiles, setSelectedAnnotatorFiles] = useState<string[]>(
    [],
  );
  const [selectedReviewerFiles, setSelectedReviewerFiles] = useState<string[]>(
    [],
  );
  const [annotatorFileAssignments, setAnnotatorFileAssignments] = useState<
    Record<string, string[]>
  >({});
  const [reviewerFileAssignments, setReviewerFileAssignments] = useState<
    Record<string, string[]>
  >({});
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [presetSearch, setPresetSearch] = useState("");
  const [projectConfigLabelIds, setProjectConfigLabelIds] = useState<
    string[] | null
  >(null);
  const [annotators, setAnnotators] = useState<TeamMember[]>(
    () => fallbackAnnotators,
  );
  const [reviewers, setReviewers] = useState<TeamMember[]>(
    () => fallbackReviewers,
  );
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
      labelNames: labelRefs.map((label) => label.name ?? label.id),
      createdAt: preset.createdAt,
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
      setError(extractErrorMessage(err, "Failed to load project files."));
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
      setError(extractErrorMessage(err, "Failed to load unassigned files."));
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
    fallback: TeamMember[],
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
      setMembers(members.length > 0 ? members : fallback);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load team members."));
      setMembers(fallback);
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
      setAnnotatorFileAssignments(buildAssignmentsFromTasks(tasks, "annotator"));
      setReviewerFileAssignments(buildAssignmentsFromTasks(tasks, "reviewer"));
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load assignments."));
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

      const fetched = extractArray<ApiLabelPreset>(response).map(mapLabelPreset);
      setPresets(fetched);
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load label presets."));
      setPresets([]);
    } finally {
      setPresetsLoading(false);
    }
  };

  const loadProjectConfiguration = async (projectId: string) => {
    try {
      const response = await getProjectConfigurationByProjectId(projectId);
      const config = unwrapApiResponse<ProjectConfiguration>(response);
      if (config && Array.isArray(config.availableLabelIds)) {
        setProjectConfigLabelIds(config.availableLabelIds);
      } else {
        setProjectConfigLabelIds(null);
      }
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to load project configuration."));
      setProjectConfigLabelIds(null);
    }
  };

  useEffect(() => {
    void loadPresets();
  }, []);

  useEffect(() => {
    if (!projectConfigLabelIds || presets.length === 0) {
      return;
    }
    const matched = findPresetByLabelIds(presets, projectConfigLabelIds);
    if (!matched) {
      setSelectedPreset(null);
      return;
    }
    if (!selectedPreset || selectedPreset.id !== matched.id) {
      setSelectedPreset(matched);
    }
  }, [presets, projectConfigLabelIds, selectedPreset]);

  useEffect(() => {
    const refreshMembers = () => {
      void loadMembersByRole("annotator", fallbackAnnotators, setAnnotators);
      void loadMembersByRole("reviewer", fallbackReviewers, setReviewers);
    };

    refreshMembers();
    window.addEventListener(ADMIN_USERS_UPDATED_EVENT, refreshMembers);

    return () => {
      window.removeEventListener(ADMIN_USERS_UPDATED_EVENT, refreshMembers);
    };
  }, []);

  useEffect(() => {
    if (!selectedPreset) {
      return;
    }

    const latest = presets.find((preset) => preset.id === selectedPreset.id);
    if (!latest) {
      setSelectedPreset(null);
      return;
    }

    if (
      latest.name !== selectedPreset.name ||
      latest.description !== selectedPreset.description ||
      latest.labelIds.join("|") !== selectedPreset.labelIds.join("|")
    ) {
      setSelectedPreset(latest);
    }
  }, [presets, selectedPreset]);

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
      setError("Missing project id.");
      setLoading(false);
      return;
    }

    const loadProject = async () => {
      setLoading(true);
      setError(null);

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
        };

        setProject(uiProject);
        setEditProjectName(uiProject.name);
        setEditProjectDescription(uiProject.description ?? "");
        setEditProjectDataType(uiProject.dataType);
        setUploadedFiles(uiProject.uploadedFiles ?? []);
        setUploadedImages([]);
        setUploadedImageFiles([]);
        setSelectedPreset(uiProject.selectedPreset ?? null);
        setAnnotatorFileAssignments(uiProject.annotatorFileAssignments ?? {});
        setReviewerFileAssignments(uiProject.reviewerFileAssignments ?? {});
        const annotatorIds = uiProject.assignedAnnotatorIds ?? [];
        const reviewerIds = uiProject.assignedReviewerIds ?? [];
        setSelectedAnnotatorId(annotatorIds.length === 1 ? annotatorIds[0] : null);
        setSelectedReviewerId(reviewerIds.length === 1 ? reviewerIds[0] : null);
      } catch (err) {
        setError(extractErrorMessage(err, "Failed to load project."));
      } finally {
        setLoading(false);
      }
    };

    void loadProject();
    void loadProjectFiles(id);
    void loadAssignmentsFromTasks(id);
    void loadProjectConfiguration(id);
  }, [id]);

  useEffect(() => {
    if (projectFiles.length === 0) {
      return;
    }
    setAnnotatorFileAssignments((prev) => normalizeAssignments(prev, projectFiles));
    setReviewerFileAssignments((prev) => normalizeAssignments(prev, projectFiles));
  }, [projectFiles]);

  const handleSelectPreset = async (preset: Preset) => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    const previousPreset = selectedPreset;
    const previousLabelIds = projectConfigLabelIds;
    setSelectedPreset(preset);
    setProjectConfigLabelIds(preset.labelIds);

    try {
      await updateProjectConfiguration(id, {
        availableLabelIds: preset.labelIds,
      });
      toast.success("Preset updated successfully.");
    } catch (err) {
      setSelectedPreset(previousPreset ?? null);
      setProjectConfigLabelIds(previousLabelIds ?? null);
      toast.error(extractErrorMessage(err, "Failed to update preset."));
    }
  };

  const handleOverlayClick = (
    event: MouseEvent<HTMLDivElement>,
    key: string,
    closeFn: Dispatch<SetStateAction<boolean>>,
  ) => {
    if (event.target !== event.currentTarget) {
      return;
    }
    closeWithAnimation(key, closeFn);
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

  const handleClearAssignedMember = (role: "annotator" | "reviewer", id: string) => {
    if (role === "annotator") {
      removeMemberAssignments(id, setAnnotatorFileAssignments);
      if (selectedAnnotatorId === id) {
        setSelectedAnnotatorId(null);
      }
      return;
    }

    removeMemberAssignments(id, setReviewerFileAssignments);
    if (selectedReviewerId === id) {
      setSelectedReviewerId(null);
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
    }
  };

  const handleUploadFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedUploadFiles(files);
  };

  const readFileAsDataUrl = (file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const handleConfirmUpload = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    if (selectedUploadFiles.length > 0) {
      const baseName = uploadName.trim();
      const updatedNames = selectedUploadFiles.map((file, index) => {
        if (!baseName) {
          return file.name;
        }
        if (selectedUploadFiles.length === 1) {
          return baseName;
        }
        return `${baseName}-${index + 1}`;
      });

      let uploadSucceeded = false;
      try {
        await Promise.all(
          selectedUploadFiles.map((file) => createFile({ projectId: id }, file)),
        );
        await loadProjectFiles(id);
        uploadSucceeded = true;
        toast.success("Files uploaded successfully.");
      } catch (err) {
        toast.error(extractErrorMessage(err, "Failed to upload files."));
      }

      const imagePayload = await Promise.all(
        selectedUploadFiles.map(async (file, index) => ({
          name: updatedNames[index],
          dataUrl: await readFileAsDataUrl(file),
        })),
      );

      const filePayload = selectedUploadFiles.map((file, index) => ({
        name: updatedNames[index],
        file,
      }));

      if (!uploadSucceeded) {
        setUploadedFiles((prev) => [...prev, ...updatedNames]);
      }
      setUploadedImages((prev) => [...prev, ...imagePayload]);
      setUploadedImageFiles((prev) => [...prev, ...filePayload]);
    }
    setIsUploadOpen(false);
    setSelectedUploadFiles([]);
    setUploadName("");
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
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
    try {
      await deleteFile(idByName);
      await loadProjectFiles(id);
      toast.success("File deleted.");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete file."));
    }
  };

  const saveProjectChanges = async () => {
    if (!project || !id) {
      return false;
    }

    setSaving(true);
    setError(null);

    try {
      const resp = await updateProject(id, {
        name: editProjectName.trim() || project.name,
        description: editProjectDescription.trim() || undefined,
        dataType: dataTypeLabelToEnum(editProjectDataType),
      });

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
            }
          : prev,
      );
      return true;
    } catch (err) {
      setError(extractErrorMessage(err, "Failed to update project."));
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!id) {
      toast.error("Missing project id.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this project? This action cannot be undone.",
    );
    if (!confirmed) {
      return;
    }

    try {
      await deleteProject(id);
      toast.success("Project deleted.");
      navigate("/manager/projects");
    } catch (err) {
      toast.error(extractErrorMessage(err, "Failed to delete project."));
    }
  };

  const pushTaskToAnnotatorQueue = async () => {
    if (!project) {
      return false;
    }
    const assignedNames = resolveNames(annotators, assignedAnnotatorIds);
    const reviewerNames = resolveNames(reviewers, assignedReviewerIds);
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7);

    let uploadedImageRefs: StoredImageRef[] = [];
    if (uploadedImageFiles.length > 0) {
      uploadedImageRefs = await saveFilesToImageStore(uploadedImageFiles);
    }

    const basePayload = {
      id: `task-${project.id}`,
      projectName: project.name,
      dataset:
        uploadedFiles.length > 0
          ? `${uploadedFiles.length} uploaded file(s)`
          : "Manager uploaded dataset",
      priority: "Normal" as const,
      status: "In Progress" as const,
      assignedAt: today.toISOString().slice(0, 10),
      dueAt: dueDate.toISOString().slice(0, 10),
      aiPrelabel: uploadedFiles.length > 0 ? ("Ready" as const) : ("Off" as const),
      preset: selectedPreset?.name || "Custom preset",
      progress: 0,
      instructions: [
        "Follow project guideline before labeling.",
        "Apply selected label preset consistently.",
      ],
      checklist: [
        "All required labels are added",
        "Quality self-check completed",
      ],
      labels: selectedPreset?.labelNames ?? ["Label A", "Label B"],
      assignedAnnotators: assignedNames,
      assignedReviewers: reviewerNames,
      assignedAnnotatorIds,
      assignedReviewerIds,
      annotatorAssignmentsByFile: annotatorFileAssignments,
      reviewerAssignmentsByFile: reviewerFileAssignments,
      uploadedImageRefs,
    };

    const raw = localStorage.getItem(ANNOTATOR_TASKS_STORAGE_KEY);
    let existing: Array<Record<string, unknown>> = [];

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Array<Record<string, unknown>>;
        existing = Array.isArray(parsed) ? parsed : [];
      } catch {
        existing = [];
      }
    }

    const buildNext = (images: UploadedImage[]) => {
      const payload = {
        ...basePayload,
        uploadedImages: images,
      };

      return [payload, ...existing.filter((item) => item.id !== payload.id)];
    };

    try {
      const next = buildNext(toLightweightImages(uploadedImages));
      localStorage.setItem(ANNOTATOR_TASKS_STORAGE_KEY, JSON.stringify(next));
      window.dispatchEvent(new CustomEvent(ANNOTATOR_TASKS_UPDATED_EVENT));
      return true;
    } catch {
      try {
        const compactExisting: Array<Record<string, unknown>> = existing.map(
          (item) => ({
            ...item,
            uploadedImages: compactUnknownImages(item.uploadedImages),
            submittedImages: compactUnknownImages(item.submittedImages),
          }),
        );

        const payload = {
          ...basePayload,
          uploadedImages: toLightweightImages(uploadedImages),
        };

        const next = [
          payload,
          ...compactExisting.filter((item) => item["id"] !== payload.id),
        ];
        localStorage.setItem(ANNOTATOR_TASKS_STORAGE_KEY, JSON.stringify(next));
        window.dispatchEvent(new CustomEvent(ANNOTATOR_TASKS_UPDATED_EVENT));
        toast.warning(
          "Images were optimized for storage limit. Assignment still succeeded.",
        );
        return true;
      } catch {
        return false;
      }
    }
  };

  const handleConfirmAssigned = async () => {
    try {
      const queued = await pushTaskToAnnotatorQueue();
      if (!queued) {
        toast.error("Assign failed: storage is full or project data is invalid.");
        return;
      }

      const saved = await saveProjectChanges();
      if (!saved) {
        return;
      }
      toast.success("Project assigned successfully.");
      navigate("/manager/projects");
    } catch {
      toast.error("Assign failed. Please try again.");
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
            {error || "Project not found."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-gray-50 px-6 py-6">
      <div className="mx-auto w-full max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <button
              type="button"
              onClick={() => navigate("/manager/projects")}
              className="rounded-md border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
            >
              &larr; Back to projects
            </button>
            <h1 className="mt-3 text-2xl font-semibold text-gray-900">
              Edit project
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Update metadata, uploads, assignments, and label presets.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-md bg-white px-3 py-1 text-sm font-semibold text-gray-700 shadow-sm ring-1 ring-gray-200">
              {project.status}
            </span>
            <span className="rounded-md bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">
              Created {formatDateLabel(project.createdAt)}
            </span>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-sm">
            {error}
          </div>
        )}

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="rounded-md border border-gray-200 px-3 py-3">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  {editProjectName || project.name}
                </h2>
                <p className="mt-1 text-xs text-gray-500">
                  {editProjectDescription ||
                    "Example Image Classification Example"}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 rounded-md border border-gray-200 p-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Project name</label>
              <input
                value={editProjectName}
                onChange={(event) => setEditProjectName(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Project name"
              />
            </div>
            <div className="flex flex-col gap-1 sm:col-span-2">
              <label className="text-xs font-semibold text-gray-700">Project description</label>
              <textarea
                value={editProjectDescription}
                onChange={(event) => setEditProjectDescription(event.target.value)}
                className="min-h-[96px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Project description"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">Data type</label>
              <select
                value={editProjectDataType}
                onChange={(event) =>
                  setEditProjectDataType(
                    event.target.value as Project["dataType"],
                  )
                }
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
              >
                <option value="Image">Image</option>
                <option value="Video">Video</option>
                <option value="Text">Text</option>
                <option value="Audio">Audio</option>
              </select>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-3">
              {[
                {
                  id: "uploads",
                  title: `Uploaded images (${uploadedFiles.length})`,
                  action: "Upload File",
                  empty: "No images uploaded",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 3v12" />
                      <path d="m7 8 5-5 5 5" />
                      <path d="M5 21h14" />
                    </svg>
                  ),
                },
                {
                  id: "annotators",
                  title: "Assign annotators",
                  action: "Assign annotators",
                  empty: "No annotator assigned",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="9" cy="7" r="3" />
                      <circle cx="17" cy="7" r="3" />
                      <path d="M2 21a7 7 0 0 1 14 0" />
                      <path d="M14 21a5 5 0 0 1 8 0" />
                    </svg>
                  ),
                },
                {
                  id: "reviewers",
                  title: "Assign reviewers",
                  action: "Assign reviewers",
                  empty: "No reviewer assigned",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <circle cx="9" cy="7" r="3" />
                      <circle cx="17" cy="7" r="3" />
                      <path d="M2 21a7 7 0 0 1 14 0" />
                      <path d="M14 21a5 5 0 0 1 8 0" />
                    </svg>
                  ),
                },
                {
                  id: "presets",
                  title: "Label Presets",
                  action: "Add Preset",
                  empty: "No label preset selected",
                  icon: (
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                      <path d="M16 3h5v5" />
                      <path d="M16 8 21 3" />
                    </svg>
                  ),
                },
              ].map((section) => (
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
                      onClick={() => {
                        if (section.id === "uploads") {
                          setIsUploadOpen(true);
                          return;
                        }
                        if (section.id === "annotators") {
                          setAssignSearch("");
                          setSelectedAnnotatorFiles([]);
                          setIsAssignAnnotatorsOpen(true);
                          return;
                        }
                        if (section.id === "reviewers") {
                          setAssignSearch("");
                          setSelectedReviewerFiles([]);
                          setIsAssignReviewersOpen(true);
                          return;
                        }
                        if (section.id === "presets") {
                          setPresetSearch("");
                          setIsSelectPresetOpen(true);
                        }
                      }}
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
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
                      <div className="mt-2 flex flex-wrap gap-2">
                        {uploadedFiles.map((file) => (
                          <span
                            key={file}
                            className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                          >
                            {file}
                            <button
                              type="button"
                              onClick={() => handleDeleteUploadedFile(file)}
                              className="rounded-sm px-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                              aria-label={`Delete ${file}`}
                            >
                              x
                            </button>
                          </span>
                        ))}
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
                              onClick={() => handleClearAssignedMember("annotator", id)}
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
                              onClick={() => handleClearAssignedMember("reviewer", id)}
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
                    selectedPreset ? (
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                          {selectedPreset.name}
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedPreset(null);
                              setProjectConfigLabelIds(null);
                            }}
                            className="rounded-sm px-1 text-xs text-gray-500 hover:bg-gray-200 hover:text-gray-700"
                            aria-label="Clear selected preset"
                          >
                            x
                          </button>
                        </span>
                      </div>
                    ) : (
                      <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                        {section.empty}
                      </div>
                    )
                  ) : (
                    <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                      {section.empty}
                    </div>
                  )}
                  {section.id === "annotators" &&
                    Object.keys(annotatorFileAssignments).length > 0 && (
                      <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700">
                        <p className="font-semibold text-gray-800">
                          Assigned files
                        </p>
                        <div className="mt-2 flex flex-col gap-1">
                          {Object.entries(annotatorFileAssignments).map(
                            ([fileId, ids]) => (
                              <span key={fileId}>
                                {resolveFileName(fileId)}: {resolveNames(annotators, ids).join(", ")}
                              </span>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  {section.id === "reviewers" &&
                    Object.keys(reviewerFileAssignments).length > 0 && (
                      <div className="mt-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-2 text-xs text-gray-700">
                        <p className="font-semibold text-gray-800">
                          Assigned files
                        </p>
                        <div className="mt-2 flex flex-col gap-1">
                          {Object.entries(reviewerFileAssignments).map(
                            ([fileId, ids]) => (
                              <span key={fileId}>
                                {resolveFileName(fileId)}: {resolveNames(reviewers, ids).join(", ")}
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
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <circle cx="3" cy="6" r="1" />
                      <circle cx="3" cy="12" r="1" />
                      <circle cx="3" cy="18" r="1" />
                    </svg>
                    Guideline
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-gray-300 px-3 py-1 text-xs font-semibold text-gray-700"
                  >
                    Select file
                  </button>
                </div>
                <div className="mt-2 flex flex-col gap-2">
                  <input
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="guideline name"
                  />
                  <textarea
                    className="min-h-[56px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="guideline description"
                  />
                </div>
              </div>
            </div>

          <div className="mt-5 flex flex-wrap justify-end gap-2 border-t border-gray-200 pt-4">
            <button
              type="button"
              onClick={handleDeleteProject}
              className="rounded-md border border-red-200 bg-white px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
            >
              Delete project
            </button>
            <button
              type="button"
              onClick={() => navigate("/manager/projects")}
              className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmAssigned}
              disabled={saving}
              className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              Confirm as assigned
            </button>
          </div>
        </div>
      </div>

      {isUploadOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4"
            onClick={(event) =>
              handleOverlayClick(event, "upload", setIsUploadOpen)
            }
          >
            <div
              className={`max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
                closingModals.upload ? "modal-pop-out" : "modal-pop"
              }`}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-base font-semibold text-gray-800">Upload Images</h3>
                <button
                  type="button"
                  onClick={() => closeWithAnimation("upload", setIsUploadOpen)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>

              <div className="p-4">
                <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-200 px-4 py-6 text-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-8 w-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M12 3v12" />
                    <path d="m7 8 5-5 5 5" />
                    <path d="M5 21h14" />
                  </svg>
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
                    onChange={handleUploadFileChange}
                    className="hidden"
                  />
                </div>

                <div className="mt-4">
                  <input
                    value={uploadName}
                    onChange={(event) => setUploadName(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="New file name(optional)"
                  />
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={handleConfirmUpload}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    Confirm upload
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isAssignAnnotatorsOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4"
            onClick={(event) =>
              handleOverlayClick(event, "assignAnnotators", setIsAssignAnnotatorsOpen)
            }
          >
            <div
              className={`max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
                closingModals.assignAnnotators ? "modal-pop-out" : "modal-pop"
              }`}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-800">Assign annotators</h3>
                <button
                  type="button"
                  onClick={() =>
                    closeWithAnimation("assignAnnotators", setIsAssignAnnotatorsOpen)
                  }
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <input
                  value={assignSearch}
                  onChange={(event) => setAssignSearch(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Search annotators"
                />

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      Assign Annotators
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedAnnotatorId(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
                    {annotators
                      .filter((member) =>
                        `${member.name} ${member.email}`
                          .toLowerCase()
                          .includes(assignSearch.toLowerCase()),
                      )
                      .map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                              {member.workload}
                            </span>
                            <input
                              type="radio"
                              name="selected-annotator"
                              checked={selectedAnnotatorId === member.id}
                              onChange={() => setSelectedAnnotatorId(member.id)}
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
                      onClick={() => setSelectedAnnotatorFiles([])}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Clear files
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
                    {assignFilesLoading ? (
                      <p className="text-xs text-gray-400">
                        Loading unassigned files...
                      </p>
                    ) : unassignedAnnotatorFiles.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        No unassigned files available.
                      </p>
                    ) : (
                      unassignedAnnotatorFiles.map((file) => (
                        <label
                          key={file.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          <span className="truncate">{file.fileName}</span>
                          <input
                            type="checkbox"
                            checked={selectedAnnotatorFiles.includes(file.id)}
                            onChange={() =>
                              toggleSelection(file.id, setSelectedAnnotatorFiles)
                            }
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      submitAssignment(
                        "annotator",
                        selectedAnnotatorId,
                        selectedAnnotatorFiles,
                        setIsAssignAnnotatorsOpen,
                        setAnnotatorFileAssignments,
                        setSelectedAnnotatorFiles,
                      )
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    Confirm assign
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isAssignReviewersOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4"
            onClick={(event) =>
              handleOverlayClick(event, "assignReviewers", setIsAssignReviewersOpen)
            }
          >
            <div
              className={`max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
                closingModals.assignReviewers ? "modal-pop-out" : "modal-pop"
              }`}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-800">Assign reviewers</h3>
                <button
                  type="button"
                  onClick={() =>
                    closeWithAnimation("assignReviewers", setIsAssignReviewersOpen)
                  }
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <input
                  value={assignSearch}
                  onChange={(event) => setAssignSearch(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Search reviewers"
                />

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">
                      Assign reviewers
                    </p>
                    <button
                      type="button"
                      onClick={() => setSelectedReviewerId(null)}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
                    {reviewers
                      .filter((member) =>
                        `${member.name} ${member.email}`
                          .toLowerCase()
                          .includes(assignSearch.toLowerCase()),
                      )
                      .map((member) => (
                        <label
                          key={member.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          <div>
                            <p className="font-semibold text-gray-800">
                              {member.name}
                            </p>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-gray-500">
                              {member.workload}
                            </span>
                            <input
                              type="radio"
                              name="selected-reviewer"
                              checked={selectedReviewerId === member.id}
                              onChange={() => setSelectedReviewerId(member.id)}
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
                      onClick={() => setSelectedReviewerFiles([])}
                      className="text-xs font-semibold text-gray-500 hover:text-gray-700"
                    >
                      Clear files
                    </button>
                  </div>
                  <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
                    {assignFilesLoading ? (
                      <p className="text-xs text-gray-400">
                        Loading unassigned files...
                      </p>
                    ) : unassignedReviewerFiles.length === 0 ? (
                      <p className="text-xs text-gray-400">
                        No unassigned files available.
                      </p>
                    ) : (
                      unassignedReviewerFiles.map((file) => (
                        <label
                          key={file.id}
                          className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                        >
                          <span className="truncate">{file.fileName}</span>
                          <input
                            type="checkbox"
                            checked={selectedReviewerFiles.includes(file.id)}
                            onChange={() =>
                              toggleSelection(file.id, setSelectedReviewerFiles)
                            }
                          />
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() =>
                      submitAssignment(
                        "reviewer",
                        selectedReviewerId,
                        selectedReviewerFiles,
                        setIsAssignReviewersOpen,
                        setReviewerFileAssignments,
                        setSelectedReviewerFiles,
                      )
                    }
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    Confirm assign
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}

      {isSelectPresetOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4"
            onClick={(event) =>
              handleOverlayClick(event, "selectPreset", setIsSelectPresetOpen)
            }
          >
            <div
              className={`max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
                closingModals.selectPreset ? "modal-pop-out" : "modal-pop"
              }`}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-lg font-semibold text-gray-800">Select preset</h3>
                <button
                  type="button"
                  onClick={() => closeWithAnimation("selectPreset", setIsSelectPresetOpen)}
                  className="text-gray-500 hover:text-gray-700"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="p-4">
                <input
                  value={presetSearch}
                  onChange={(event) => setPresetSearch(event.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Search presets"
                />

                <div className="mt-4">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800">Selected Preset</p>
                    <span className="text-xs text-gray-500">
                      Only created presets are listed
                    </span>
                  </div>
                  <div className="mt-2 space-y-2 rounded-md border border-gray-300 p-3">
                    {presetsLoading ? (
                      <span className="text-xs text-gray-400">Loading presets...</span>
                    ) : presets.length === 0 ? (
                      <span className="text-xs text-gray-400">No presets available</span>
                    ) : presets.filter((preset) =>
                        `${preset.name} ${preset.description ?? ""}`
                          .toLowerCase()
                          .includes(presetSearch.toLowerCase()),
                      ).length === 0 ? (
                      <span className="text-xs text-gray-400">No matching preset</span>
                    ) : (
                      presets
                        .filter((preset) =>
                          `${preset.name} ${preset.description ?? ""}`
                            .toLowerCase()
                            .includes(presetSearch.toLowerCase()),
                        )
                        .map((preset) => (
                          <button
                            key={preset.id}
                            type="button"
                            onClick={() => void handleSelectPreset(preset)}
                            className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                              selectedPreset?.id === preset.id
                                ? "border-blue-500 bg-blue-50 text-blue-700"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            <div>
                              <p className="font-semibold">{preset.name}</p>
                              <p className="text-xs text-gray-500">
                                {preset.description}
                              </p>
                            </div>
                            {selectedPreset?.id === preset.id && (
                              <span className="text-xs font-semibold">Selected</span>
                            )}
                          </button>
                        ))
                    )}
                  </div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => closeWithAnimation("selectPreset", setIsSelectPresetOpen)}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                  >
                    Confirm assign
                  </button>
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
