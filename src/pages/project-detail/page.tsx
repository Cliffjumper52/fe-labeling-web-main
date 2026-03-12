import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import {
  saveFilesToImageStore,
  type StoredImageRef,
} from "../../utils/image-store";

type Project = {
  id: string;
  name: string;
  description?: string;
  status: "Drafting" | "Active" | "Archived";
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
  labels: string[];
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

type AdminStorageUser = {
  id: string;
  name: string;
  email: string;
  role: "Admin" | "Manager" | "Reviewer" | "Annotator";
  status: "Active" | "Suspended";
  phone: string;
};

const MANAGER_PROJECTS_STORAGE_KEY = "manager-projects";
const MANAGER_PRESETS_STORAGE_KEY = "manager-presets";
const ANNOTATOR_TASKS_STORAGE_KEY = "annotator-assigned-tasks";
const ANNOTATOR_TASKS_UPDATED_EVENT = "annotator-tasks-updated";
const ADMIN_USERS_STORAGE_KEY = "admin-users";

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
    workload: "18 tasks",
  },
  {
    id: "rev-2",
    name: "Reviewer B",
    email: "reviewer.b@labeling.io",
    workload: "11 tasks",
  },
];

const fallbackPresets: Preset[] = [
  {
    id: "preset-1",
    name: "Retail SKU V2",
    description: "Bounding boxes for shelf-facing SKUs.",
    labels: ["Cereal", "Snack", "Soda"],
    createdAt: "2026-02-10",
  },
  {
    id: "preset-2",
    name: "Vehicle Boxes",
    description: "Cars, buses, bikes, and trucks.",
    labels: ["Car", "Bus", "Bike", "Truck"],
    createdAt: "2026-02-12",
  },
];

const readManagerProjects = (): Project[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(MANAGER_PROJECTS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Project[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const readManagerPresets = (): Preset[] => {
  if (typeof window === "undefined") {
    return fallbackPresets;
  }

  const raw = localStorage.getItem(MANAGER_PRESETS_STORAGE_KEY);
  if (!raw) {
    return fallbackPresets;
  }

  try {
    const parsed = JSON.parse(raw) as Preset[];
    return Array.isArray(parsed) && parsed.length > 0
      ? parsed
      : fallbackPresets;
  } catch {
    return fallbackPresets;
  }
};

const readTeamMembersByRole = (
  role: "Annotator" | "Reviewer",
  fallback: TeamMember[],
): TeamMember[] => {
  if (typeof window === "undefined") {
    return fallback;
  }
  const raw = localStorage.getItem(ADMIN_USERS_STORAGE_KEY);
  if (!raw) {
    return fallback;
  }
  try {
    const users = JSON.parse(raw) as AdminStorageUser[];
    const members = users
      .filter((user) => user.role === role && user.status === "Active")
      .map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        workload: "0 tasks",
      }));
    return members.length > 0 ? members : fallback;
  } catch {
    return fallback;
  }
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

const readFileAsDataUrl = (file: File) => {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [projects, setProjects] = useState<Project[]>(() =>
    readManagerProjects(),
  );
  const project = useMemo(
    () => projects.find((item) => item.id === id) ?? null,
    [projects, id],
  );
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectDescription, setEditProjectDescription] = useState("");
  const [editProjectDataType, setEditProjectDataType] =
    useState<Project["dataType"]>("Image");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const [uploadedImages, setUploadedImages] = useState<UploadedImage[]>([]);
  const [uploadedImageFiles, setUploadedImageFiles] = useState<
    UploadImageFile[]
  >([]);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const [presetSearch, setPresetSearch] = useState("");
  const [presets, setPresets] = useState<Preset[]>(() => readManagerPresets());
  const [annotators, setAnnotators] = useState<TeamMember[]>(() =>
    readTeamMembersByRole("Annotator", fallbackAnnotators),
  );
  const [reviewers, setReviewers] = useState<TeamMember[]>(() =>
    readTeamMembersByRole("Reviewer", fallbackReviewers),
  );
  const [assignedAnnotatorIds, setAssignedAnnotatorIds] = useState<string[]>(
    [],
  );
  const [assignedReviewerIds, setAssignedReviewerIds] = useState<string[]>([]);
  const [annotatorFileAssignments, setAnnotatorFileAssignments] = useState<
    Record<string, string[]>
  >({});
  const [reviewerFileAssignments, setReviewerFileAssignments] = useState<
    Record<string, string[]>
  >({});
  const [annotatorSearch, setAnnotatorSearch] = useState("");
  const [reviewerSearch, setReviewerSearch] = useState("");
  const [selectedAnnotatorId, setSelectedAnnotatorId] = useState<string | null>(
    null,
  );
  const [selectedReviewerId, setSelectedReviewerId] = useState<string | null>(
    null,
  );
  const [isAnnotatorAssignOpen, setIsAnnotatorAssignOpen] = useState(false);
  const [isReviewerAssignOpen, setIsReviewerAssignOpen] = useState(false);
  const [selectedAnnotatorFiles, setSelectedAnnotatorFiles] = useState<
    string[]
  >([]);
  const [selectedReviewerFiles, setSelectedReviewerFiles] = useState<string[]>(
    [],
  );
  const derivedAnnotatorIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(annotatorFileAssignments).forEach((assigned) => {
      assigned.forEach((id) => ids.add(id));
    });
    if (ids.size === 0) {
      assignedAnnotatorIds.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [annotatorFileAssignments, assignedAnnotatorIds]);
  const derivedReviewerIds = useMemo(() => {
    const ids = new Set<string>();
    Object.values(reviewerFileAssignments).forEach((assigned) => {
      assigned.forEach((id) => ids.add(id));
    });
    if (ids.size === 0) {
      assignedReviewerIds.forEach((id) => ids.add(id));
    }
    return Array.from(ids);
  }, [reviewerFileAssignments, assignedReviewerIds]);

  useEffect(() => {
    if (!project) {
      return;
    }

    setEditProjectName(project.name);
    setEditProjectDescription(project.description ?? "");
    setEditProjectDataType(project.dataType);
    setUploadedFiles(project.uploadedFiles ?? []);
    setUploadedImages(
      (project.uploadedFiles ?? []).map((file) => ({
        name: file,
        dataUrl: createImagePlaceholderDataUrl(file),
      })),
    );
    setUploadedImageFiles([]);
    setSelectedPreset(project.selectedPreset ?? null);
    setAssignedAnnotatorIds(project.assignedAnnotatorIds ?? []);
    setAssignedReviewerIds(project.assignedReviewerIds ?? []);
    setAnnotatorFileAssignments(project.annotatorFileAssignments ?? {});
    setReviewerFileAssignments(project.reviewerFileAssignments ?? {});
  }, [project]);

  useEffect(() => {
    const refreshPresets = () => {
      setPresets(readManagerPresets());
    };
    const refreshMembers = () => {
      setAnnotators(readTeamMembersByRole("Annotator", fallbackAnnotators));
      setReviewers(readTeamMembersByRole("Reviewer", fallbackReviewers));
    };
    window.addEventListener("storage", refreshPresets);
    window.addEventListener("storage", refreshMembers);
    return () => {
      window.removeEventListener("storage", refreshPresets);
      window.removeEventListener("storage", refreshMembers);
    };
  }, []);

  if (!project) {
    return (
      <div className="w-full bg-white px-6 py-5">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-800">
            Project not found
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            The project you are trying to edit does not exist.
          </p>
          <Link
            to="/manager/projects"
            className="mt-4 inline-flex rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to projects
          </Link>
        </div>
      </div>
    );
  }

  const resolveNames = (list: TeamMember[], ids: string[]) => {
    return ids.map(
      (item) => list.find((entry) => entry.id === item)?.name || item,
    );
  };

  const toggleSelection = (
    id: string,
    setter: (updater: (prev: string[]) => string[]) => void,
  ) => {
    setter((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const applyMemberAssignments = (
    selectedFiles: string[],
    memberId: string,
    setAssignments: (
      updater: (prev: Record<string, string[]>) => Record<string, string[]>,
    ) => void,
  ) => {
    setAssignments((prev) => {
      const next = { ...prev };
      uploadedFiles.forEach((file) => {
        const current = next[file] ?? [];
        const shouldAssign = selectedFiles.includes(file);
        const hasMember = current.includes(memberId);
        if (shouldAssign && !hasMember) {
          next[file] = [...current, memberId];
        } else if (!shouldAssign && hasMember) {
          const updated = current.filter((id) => id !== memberId);
          if (updated.length === 0) {
            delete next[file];
          } else {
            next[file] = updated;
          }
        }
      });
      return next;
    });
  };

  const handleUploadFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) {
      return;
    }

    const imagePayload = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        dataUrl: await readFileAsDataUrl(file),
      })),
    );

    const filePayload = files.map((file) => ({ name: file.name, file }));

    setUploadedFiles((prev) => [...prev, ...files.map((file) => file.name)]);
    setUploadedImages((prev) => [...prev, ...imagePayload]);
    setUploadedImageFiles((prev) => [...prev, ...filePayload]);
  };

  const handleRemoveFile = (fileName: string) => {
    setUploadedFiles((prev) => prev.filter((file) => file !== fileName));
    setUploadedImages((prev) => prev.filter((file) => file.name !== fileName));
    setUploadedImageFiles((prev) =>
      prev.filter((file) => file.name !== fileName),
    );
    setAnnotatorFileAssignments((prev) => {
      if (!prev[fileName]) {
        return prev;
      }
      const next = { ...prev };
      delete next[fileName];
      return next;
    });
    setReviewerFileAssignments((prev) => {
      if (!prev[fileName]) {
        return prev;
      }
      const next = { ...prev };
      delete next[fileName];
      return next;
    });
  };

  const saveProject = (status: Project["status"]) => {
    const updated = projects.map((item) =>
      item.id === project.id
        ? {
            ...item,
            name: editProjectName.trim() || project.name,
            description: editProjectDescription.trim(),
            dataType: editProjectDataType,
            status,
            uploadedFiles,
            selectedPreset,
            assignedAnnotatorIds: derivedAnnotatorIds,
            assignedReviewerIds: derivedReviewerIds,
            annotatorFileAssignments,
            reviewerFileAssignments,
          }
        : item,
    );
    setProjects(updated);
    localStorage.setItem(MANAGER_PROJECTS_STORAGE_KEY, JSON.stringify(updated));
  };

  const pushTaskToAnnotatorQueue = async () => {
    const assignedAnnotatorNames = resolveNames(
      annotators,
      derivedAnnotatorIds,
    );
    const assignedReviewerNames = resolveNames(reviewers, derivedReviewerIds);
    const today = new Date();
    const dueDate = new Date(today);
    dueDate.setDate(today.getDate() + 7);

    let uploadedImageRefs: StoredImageRef[] = [];
    if (uploadedImageFiles.length > 0) {
      uploadedImageRefs = await saveFilesToImageStore(uploadedImageFiles);
    }

    const imagesForPayload =
      uploadedImages.length > 0
        ? uploadedImages
        : uploadedFiles.map((file) => ({
            name: file,
            dataUrl: createImagePlaceholderDataUrl(file),
          }));

    const basePayload = {
      id: `task-${project.id}`,
      projectName: editProjectName.trim() || project.name,
      dataset:
        uploadedFiles.length > 0
          ? `${uploadedFiles.length} uploaded file(s)`
          : "Manager uploaded dataset",
      priority: "Normal" as const,
      status: "In Progress" as const,
      assignedAt: today.toISOString().slice(0, 10),
      dueAt: dueDate.toISOString().slice(0, 10),
      aiPrelabel:
        uploadedFiles.length > 0 ? ("Ready" as const) : ("Off" as const),
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
      labels: selectedPreset?.labels ?? ["Label A", "Label B"],
      assignedAnnotators: assignedAnnotatorNames,
      assignedReviewers: assignedReviewerNames,
      assignedAnnotatorIds: derivedAnnotatorIds,
      assignedReviewerIds: derivedReviewerIds,
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
      const next = buildNext(toLightweightImages(imagesForPayload));
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
          uploadedImages: toLightweightImages(imagesForPayload),
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

  const handleSaveDraft = (event: FormEvent) => {
    event.preventDefault();
    saveProject("Drafting");
    toast.success("Project saved as draft.");
  };

  const handleConfirmAssigned = async () => {
    saveProject("Active");
    const queued = await pushTaskToAnnotatorQueue();
    if (!queued) {
      toast.error("Assign failed: storage is full or project data is invalid.");
      return;
    }
    toast.success("Project assigned successfully.");
    navigate("/manager/projects");
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Edit Project</h2>
          <p className="text-sm text-gray-500">
            Update project details, assignments, and preset selections.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to="/manager/projects"
            className="rounded-md border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700"
          >
            Back to projects
          </Link>
        </div>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <form onSubmit={handleSaveDraft} className="space-y-4">
        <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">
                Project name
              </label>
              <input
                value={editProjectName}
                onChange={(event) => setEditProjectName(event.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Project name"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-semibold text-gray-700">
                Project description
              </label>
              <textarea
                value={editProjectDescription}
                onChange={(event) =>
                  setEditProjectDescription(event.target.value)
                }
                className="min-h-[90px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Project description"
              />
            </div>
            <div className="flex flex-col gap-1 max-w-xs">
              <label className="text-xs font-semibold text-gray-700">
                Data type
              </label>
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
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_1fr]">
          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Uploaded files
                </p>
                <label className="rounded-md bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700">
                  Add files
                  <input
                    type="file"
                    className="hidden"
                    multiple
                    onChange={handleUploadFileChange}
                    accept="image/*"
                  />
                </label>
              </div>
              {uploadedFiles.length === 0 ? (
                <p className="mt-2 text-xs text-gray-400">
                  No files uploaded yet.
                </p>
              ) : (
                <div className="mt-3 flex flex-wrap gap-2">
                  {uploadedFiles.map((file) => (
                    <span
                      key={file}
                      className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                    >
                      {file}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(file)}
                        className="text-red-500 hover:text-red-600"
                        aria-label={`Remove ${file}`}
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Assign annotators
              </p>
              {uploadedFiles.length === 0 ? (
                <p className="mt-2 text-xs text-gray-400">
                  Upload files first.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <input
                    value={annotatorSearch}
                    onChange={(event) => setAnnotatorSearch(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Search annotators"
                  />
                  <div className="space-y-2 rounded-md border border-gray-200 p-3">
                    {annotators
                      .filter((member) =>
                        `${member.name} ${member.email}`
                          .toLowerCase()
                          .includes(annotatorSearch.toLowerCase()),
                      )
                      .map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedAnnotatorId(member.id)}
                          className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                            selectedAnnotatorId === member.id
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-xs text-gray-500">
                              {member.email}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {member.workload}
                          </span>
                        </button>
                      ))}
                  </div>
                  {selectedAnnotatorId ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      <span className="text-xs font-semibold text-gray-700">
                        Selected:{" "}
                        {resolveNames(annotators, [selectedAnnotatorId]).join(
                          ", ",
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedAnnotatorFiles([]);
                          setIsAnnotatorAssignOpen(true);
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Assign files
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Select an annotator to assign.
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">
                Assign reviewers
              </p>
              {uploadedFiles.length === 0 ? (
                <p className="mt-2 text-xs text-gray-400">
                  Upload files first.
                </p>
              ) : (
                <div className="mt-3 space-y-3">
                  <input
                    value={reviewerSearch}
                    onChange={(event) => setReviewerSearch(event.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Search reviewers"
                  />
                  <div className="space-y-2 rounded-md border border-gray-200 p-3">
                    {reviewers
                      .filter((member) =>
                        `${member.name} ${member.email}`
                          .toLowerCase()
                          .includes(reviewerSearch.toLowerCase()),
                      )
                      .map((member) => (
                        <button
                          key={member.id}
                          type="button"
                          onClick={() => setSelectedReviewerId(member.id)}
                          className={`flex w-full items-center justify-between rounded-md border px-3 py-2 text-left text-sm ${
                            selectedReviewerId === member.id
                              ? "border-blue-500 bg-blue-50 text-blue-700"
                              : "border-gray-200 bg-white text-gray-700"
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{member.name}</p>
                            <p className="text-xs text-gray-500">
                              {member.email}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {member.workload}
                          </span>
                        </button>
                      ))}
                  </div>
                  {selectedReviewerId ? (
                    <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                      <span className="text-xs font-semibold text-gray-700">
                        Selected:{" "}
                        {resolveNames(reviewers, [selectedReviewerId]).join(
                          ", ",
                        )}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedReviewerFiles([]);
                          setIsReviewerAssignOpen(true);
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        Assign files
                      </button>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">
                      Select a reviewer to assign.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  Select preset
                </p>
                {selectedPreset && (
                  <span className="text-xs text-gray-500">Selected</span>
                )}
              </div>
              <input
                value={presetSearch}
                onChange={(event) => setPresetSearch(event.target.value)}
                className="mt-3 w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
                placeholder="Search presets"
              />
              <div className="mt-3 space-y-2">
                {presets
                  .filter((preset) =>
                    `${preset.name} ${preset.description ?? ""}`
                      .toLowerCase()
                      .includes(presetSearch.toLowerCase()),
                  )
                  .map((preset) => (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() => setSelectedPreset(preset)}
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
                  ))}
                {presets.length === 0 && (
                  <p className="text-xs text-gray-400">No presets available</p>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-gray-700">Summary</p>
              <div className="mt-3 space-y-2 text-sm text-gray-600">
                <p>
                  Annotators:{" "}
                  {resolveNames(annotators, derivedAnnotatorIds).join(", ") ||
                    "Unassigned"}
                </p>
                <p>
                  Reviewers:{" "}
                  {resolveNames(reviewers, derivedReviewerIds).join(", ") ||
                    "Unassigned"}
                </p>
                <p>Preset: {selectedPreset?.name || "Custom preset"}</p>
                <p>Files: {uploadedFiles.length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate("/manager/projects")}
            className="rounded-md bg-red-500 px-4 py-2 text-sm font-semibold text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
          >
            Save as drafted
          </button>
          <button
            type="button"
            onClick={handleConfirmAssigned}
            className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Confirm as assigned
          </button>
        </div>
      </form>
      {isAnnotatorAssignOpen && selectedAnnotatorId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Assign files
              </h3>
              <button
                type="button"
                onClick={() => setIsAnnotatorAssignOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500">
                Annotator:{" "}
                {resolveNames(annotators, [selectedAnnotatorId]).join(", ")}
              </p>
              <div className="mt-3 space-y-2 rounded-md border border-gray-200 p-3">
                {uploadedFiles.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No files uploaded yet.
                  </p>
                ) : (
                  uploadedFiles
                    .filter(
                      (file) =>
                        (annotatorFileAssignments[file] ?? []).length === 0,
                    )
                    .map((file) => (
                      <label
                        key={file}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        <span className="truncate">{file}</span>
                        <input
                          type="checkbox"
                          checked={selectedAnnotatorFiles.includes(file)}
                          onChange={() =>
                            toggleSelection(file, setSelectedAnnotatorFiles)
                          }
                        />
                      </label>
                    ))
                )}
                {uploadedFiles.length > 0 &&
                  uploadedFiles.filter(
                    (file) =>
                      (annotatorFileAssignments[file] ?? []).length === 0,
                  ).length === 0 && (
                    <p className="text-xs text-gray-400">
                      All files are already assigned to an annotator.
                    </p>
                  )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnotatorAssignOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyMemberAssignments(
                      selectedAnnotatorFiles,
                      selectedAnnotatorId,
                      setAnnotatorFileAssignments,
                    );
                    setIsAnnotatorAssignOpen(false);
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {isReviewerAssignOpen && selectedReviewerId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 px-4">
          <div className="w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl">
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Assign files
              </h3>
              <button
                type="button"
                onClick={() => setIsReviewerAssignOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-4">
              <p className="text-xs text-gray-500">
                Reviewer:{" "}
                {resolveNames(reviewers, [selectedReviewerId]).join(", ")}
              </p>
              <div className="mt-3 space-y-2 rounded-md border border-gray-200 p-3">
                {uploadedFiles.length === 0 ? (
                  <p className="text-xs text-gray-400">
                    No files uploaded yet.
                  </p>
                ) : (
                  uploadedFiles
                    .filter(
                      (file) =>
                        !(reviewerFileAssignments[file] ?? []).includes(
                          selectedReviewerId,
                        ),
                    )
                    .map((file) => (
                      <label
                        key={file}
                        className="flex items-center justify-between gap-3 rounded-md border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700"
                      >
                        <span className="truncate">{file}</span>
                        <input
                          type="checkbox"
                          checked={selectedReviewerFiles.includes(file)}
                          onChange={() =>
                            toggleSelection(file, setSelectedReviewerFiles)
                          }
                        />
                      </label>
                    ))
                )}
                {uploadedFiles.length > 0 &&
                  uploadedFiles.filter(
                    (file) =>
                      !(reviewerFileAssignments[file] ?? []).includes(
                        selectedReviewerId,
                      ),
                  ).length === 0 && (
                    <p className="text-xs text-gray-400">
                      All files are already assigned to this reviewer.
                    </p>
                  )}
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsReviewerAssignOpen(false)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    applyMemberAssignments(
                      selectedReviewerFiles,
                      selectedReviewerId,
                      setReviewerFileAssignments,
                    );
                    setIsReviewerAssignOpen(false);
                  }}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
