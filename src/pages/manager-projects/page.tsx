import {
  useRef,
  useState,
  type ChangeEvent,
  type Dispatch,
  type FormEvent,
  type MouseEvent,
  type SetStateAction,
} from "react";

type Project = {
  id: string;
  name: string;
  description?: string;
  status: "Drafting" | "Active" | "Archived";
  dataType: "Image" | "Video" | "Text" | "Audio";
  createdAt: string;
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

type ManagerProjectsPageProps = {
  mode?: "manager" | "admin";
  initialProjects?: Project[];
};

export default function ManagerProjectsPage({
  mode = "manager",
  initialProjects,
}: ManagerProjectsPageProps) {
  const isAdmin = mode === "admin";
  const [projects, setProjects] = useState<Project[]>(
    () => initialProjects ?? [],
  );
  const hasProjects = projects.length > 0;
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDataType, setProjectDataType] = useState<Project["dataType"]>(
    "Image",
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [presets] = useState<Preset[]>([
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
  ]);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [selectedUploadFiles, setSelectedUploadFiles] = useState<File[]>([]);
  const [uploadName, setUploadName] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailProject, setDetailProject] = useState<Project | null>(null);
  const [isAssignAnnotatorsOpen, setIsAssignAnnotatorsOpen] = useState(false);
  const [isAssignReviewersOpen, setIsAssignReviewersOpen] = useState(false);
  const [isSelectPresetOpen, setIsSelectPresetOpen] = useState(false);
  const [assignSearch, setAssignSearch] = useState("");
  const [selectedAnnotators, setSelectedAnnotators] = useState<string[]>([]);
  const [selectedReviewers, setSelectedReviewers] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<Preset | null>(null);
  const annotators: TeamMember[] = [
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
  const reviewers: TeamMember[] = [
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
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const handleCreate = (event: FormEvent) => {
    event.preventDefault();
    const now = new Date();
    const createdAt = now.toISOString().slice(0, 10);
    setProjects((prev) => [
      {
        id: crypto.randomUUID(),
        name: projectName.trim() || "Untitled Project",
        description: projectDescription.trim(),
        status: "Drafting",
        dataType: projectDataType,
        createdAt,
      },
      ...prev,
    ]);
    setIsCreateOpen(false);
    setProjectName("");
    setProjectDescription("");
    setProjectDataType("Image");
  };

  const handleOpenEdit = (project: Project) => {
    setActiveProject(project);
    setIsEditOpen(true);
  };

  const handleOpenDetails = (project: Project) => {
    setDetailProject(project);
    setIsDetailOpen(true);
  };

  const handleUploadFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    setSelectedUploadFiles(files);
  };

  const handleConfirmUpload = () => {
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
      setUploadedFiles((prev) => [...prev, ...updatedNames]);
    }
    setIsUploadOpen(false);
    setSelectedUploadFiles([]);
    setUploadName("");
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
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

  const handleDeleteProject = (projectId: string) => {
    setProjects((prev) => prev.filter((project) => project.id !== projectId));
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

  const toggleSelection = (
    id: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]));
  };

  const resolveNames = (list: TeamMember[], ids: string[]) => {
    return ids.map((id) => list.find((item) => item.id === id)?.name || id);
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Projects</h2>
        {!isAdmin && (
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            New Project
          </button>
        )}
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Search</label>
          <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 shadow-sm">
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-gray-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              className="w-full text-sm outline-none placeholder:text-gray-400"
              placeholder="Search projects..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>All</option>
            <option>Active</option>
            <option>Archived</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order by</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>Name</option>
            <option>Date created</option>
            <option>Updated</option>
          </select>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order</label>
          <select className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
            <option>All</option>
            <option>Ascending</option>
            <option>Descending</option>
          </select>
        </div>
      </div>

      {!hasProjects ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
            <svg
              viewBox="0 0 24 24"
              className="h-8 w-8 text-gray-500"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-800">
            No Projects Yet
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {isAdmin
              ? "No projects are available right now."
              : "Get started by creating your first data labeling project"}
          </p>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => setIsCreateOpen(true)}
              className="mt-5 flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <span className="text-base leading-none">+</span>
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.6fr_2.2fr_1fr_1fr_1fr_0.8fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
            <span>Name</span>
            <span>Description</span>
            <span>Status</span>
            <span>Data type</span>
            <span>Date created</span>
            <span>Action</span>
          </div>

          {projects.map((project) => (
            <div
              key={project.id}
              className="grid grid-cols-[1.6fr_2.2fr_1fr_1fr_1fr_0.8fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-800">{project.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {project.description || "No description"}
                </p>
              </div>
              <div>
                <span className="rounded-md bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                  {project.status}
                </span>
              </div>
              <span className="text-gray-700">{project.dataType}</span>
              <span className="text-gray-700">{project.createdAt}</span>
              <div className="flex items-center gap-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => handleOpenDetails(project)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Details
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteProject(project.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(project)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isAdmin && isCreateOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
          onClick={(event) =>
            handleOverlayClick(event, "createProject", setIsCreateOpen)
          }
        >
          <div
            className={`max-h-[85vh] w-full max-w-md overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.createProject ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">
                Create new project
              </h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("createProject", setIsCreateOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M6 6l12 12" />
                  <path d="M18 6l-12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleCreate} className="flex flex-col gap-4 p-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Project name
                </label>
                <input
                  value={projectName}
                  onChange={(event) => setProjectName(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example name"
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Project description
                </label>
                <textarea
                  value={projectDescription}
                  onChange={(event) => setProjectDescription(event.target.value)}
                  className="min-h-[120px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example description"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Data type
                </label>
                <select
                  value={projectDataType}
                  onChange={(event) =>
                    setProjectDataType(event.target.value as Project["dataType"])
                  }
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="Image">Image</option>
                  <option value="Video">Video</option>
                  <option value="Text">Text</option>
                  <option value="Audio">Audio</option>
                </select>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  <span className="text-base leading-none">+</span>
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && detailProject && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center bg-black/30 px-4"
          onClick={(event) =>
            handleOverlayClick(event, "projectDetails", setIsDetailOpen)
          }
        >
          <div
            className={`max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.projectDetails ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-base font-semibold text-gray-800">
                Project details
              </h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("projectDetails", setIsDetailOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-4">
              <div className="rounded-md border border-gray-200 p-3 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {detailProject.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {detailProject.description || "No description provided"}
                    </p>
                  </div>
                  <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {detailProject.status}
                  </span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Assigned Annotator
                  </p>
                  <p className="mt-2 text-sm text-gray-800">
                    {selectedAnnotators.length === 0
                      ? "Unassigned"
                      : resolveNames(annotators, selectedAnnotators).join(", ")}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Assigned Reviewer
                  </p>
                  <p className="mt-2 text-sm text-gray-800">
                    {selectedReviewers.length === 0
                      ? "Unassigned"
                      : resolveNames(reviewers, selectedReviewers).join(", ")}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Selected Preset
                  </p>
                  <p className="mt-2 text-sm text-gray-800">
                    {selectedPreset?.name || "No preset selected"}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">Uploaded files</p>
                  {uploadedFiles.length === 0 ? (
                    <p className="mt-2 text-xs text-gray-400">No images uploaded</p>
                  ) : (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {uploadedFiles.map((file) => (
                        <span
                          key={file}
                          className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                        >
                          {file}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() => closeWithAnimation("projectDetails", setIsDetailOpen)}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isEditOpen && activeProject && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/30 px-3"
          onClick={(event) =>
            handleOverlayClick(event, "editProject", setIsEditOpen)
          }
        >
          <div
            className={`max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-md border border-gray-300 bg-white shadow-xl ${
              closingModals.editProject ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="relative flex items-center justify-between border-b px-3 py-2">
              <button
                type="button"
                onClick={() => closeWithAnimation("editProject", setIsEditOpen)}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                ← Go back
              </button>
              <h3 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-800">
                Edit project
              </h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("editProject", setIsEditOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="p-2">
              <div className="rounded-md border border-gray-200 px-2 py-2 shadow-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-base font-semibold text-gray-900">
                      {activeProject.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {activeProject.description ||
                        "Example Image Classification Example"}
                    </p>
                  </div>
                  <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {activeProject.status}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-2">
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
                    className="rounded-md border border-gray-200 px-2 py-2 shadow-sm"
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
                            setIsAssignAnnotatorsOpen(true);
                            return;
                          }
                          if (section.id === "reviewers") {
                            setAssignSearch("");
                            setIsAssignReviewersOpen(true);
                            return;
                          }
                          if (section.id === "presets") {
                            setIsSelectPresetOpen(true);
                          }
                        }}
                        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                      >
                        {section.action}
                      </button>
                    </div>
                    {section.id === "uploads" ? (
                      uploadedFiles.length === 0 ? (
                        <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                          {section.empty}
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {uploadedFiles.map((file) => (
                            <span
                              key={file}
                              className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                            >
                              {file}
                            </span>
                          ))}
                        </div>
                      )
                    ) : section.id === "annotators" ? (
                      selectedAnnotators.length === 0 ? (
                        <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                          {section.empty}
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {resolveNames(annotators, selectedAnnotators).map(
                            (name) => (
                              <span
                                key={name}
                                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                              >
                                {name}
                              </span>
                            ),
                          )}
                        </div>
                      )
                    ) : section.id === "reviewers" ? (
                      selectedReviewers.length === 0 ? (
                        <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                          {section.empty}
                        </div>
                      ) : (
                        <div className="mt-2 flex flex-wrap gap-2">
                          {resolveNames(reviewers, selectedReviewers).map((name) => (
                            <span
                              key={name}
                              className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      )
                    ) : section.id === "presets" ? (
                      selectedPreset ? (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700">
                            {selectedPreset.name}
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
                  </div>
                ))}

                <div className="rounded-md border border-gray-200 px-2 py-2 shadow-sm">
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

              <div className="mt-3 flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => closeWithAnimation("editProject", setIsEditOpen)}
                  className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                >
                  Safe as drafted
                </button>
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Confirm as assigned
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isUploadOpen && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/30 px-4"
          onClick={(event) => handleOverlayClick(event, "upload", setIsUploadOpen)}
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
        </div>
      )}

      {isAssignAnnotatorsOpen && (
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
                    onClick={() => setSelectedAnnotators([])}
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
                            type="checkbox"
                            checked={selectedAnnotators.includes(member.id)}
                            onChange={() =>
                              toggleSelection(member.id, setSelectedAnnotators)
                            }
                          />
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    closeWithAnimation("assignAnnotators", setIsAssignAnnotatorsOpen)
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Confirm assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAssignReviewersOpen && (
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
                    onClick={() => setSelectedReviewers([])}
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
                            type="checkbox"
                            checked={selectedReviewers.includes(member.id)}
                            onChange={() =>
                              toggleSelection(member.id, setSelectedReviewers)
                            }
                          />
                        </div>
                      </label>
                    ))}
                </div>
              </div>

              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={() =>
                    closeWithAnimation("assignReviewers", setIsAssignReviewersOpen)
                  }
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  Confirm assign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isSelectPresetOpen && (
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
                  {presets.length === 0 ? (
                    <span className="text-xs text-gray-400">No presets available</span>
                  ) : (
                    presets.map((preset) => (
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
        </div>
      )}
    </div>
  );
}