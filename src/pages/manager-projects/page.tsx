import { useEffect, useMemo, useState, type FormEvent } from "react";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { DataType } from "../../interface/enums/domain.enums";
import type { LabelPreset as ApiLabelPreset } from "../../interface/label-preset/label-preset.interface";
import type {
  ManagerLabelPresetOption,
  ManagerProjectItem,
  ManagerProjectOrder,
  ManagerProjectOrderBy,
  ManagerProjectStatusFilter,
  PaginationResult,
} from "../../interface/project/manager-projects.interface";
import type { Project as ApiProject } from "../../interface/project/project.interface";
import {
  createProject,
  getProjectStatistics,
  getProjectsPaginated,
} from "../../services/project-service.service";
import { getLabelPresetsPaginated } from "../../services/label-preset-service.service";
import Pagination from "../../components/common/pagination";
import StatisticsSummary from "../../components/common/statistics-summary";
import CreateProjectModal from "../../components/manager/project/create-project-modal";
import ProjectFilters from "../../components/manager/project/project-filters";
import ProjectTable from "../../components/manager/project/project-table";
import ProjectsHeader from "../../components/manager/project/projects-header";
import { useAuth } from "../../context/auth-context.context";

const PAGE_LIMIT = 5;

const unwrapAxiosData = (payload: unknown): unknown => {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data: unknown }).data;
  }
  return payload;
};

const unwrapApiResponse = <T,>(payload: unknown): T | null => {
  const unwrapped = unwrapAxiosData(payload);
  if (!unwrapped || typeof unwrapped !== "object") {
    return unwrapped as T;
  }

  if ("success" in unwrapped && "data" in unwrapped) {
    return (unwrapped as ApiResponse<T>).data;
  }

  return unwrapped as T;
};

const extractArray = <T,>(payload: unknown): T[] => {
  const data = unwrapApiResponse<T[] | PaginationResult<T>>(payload);
  if (Array.isArray(data)) {
    return data;
  }

  if (data && typeof data === "object" && Array.isArray(data.data)) {
    return data.data;
  }

  return [];
};

const extractTotalPages = (payload: unknown): number => {
  const data = unwrapApiResponse<PaginationResult<unknown>>(payload);
  if (!data || typeof data !== "object") {
    return 1;
  }

  return data.totalPages ?? data.pageCount ?? 1;
};

const extractErrorMessage = (error: unknown, fallback: string) => {
  const message = (error as { response?: { data?: { message?: unknown } } })
    ?.response?.data?.message;

  if (typeof message === "string" && message.trim()) {
    return message;
  }

  return error instanceof Error ? error.message : fallback;
};

const normalizeProject = (project: ApiProject): ManagerProjectItem => {
  return {
    id: project.id,
    name: project.name,
    description: project.description ?? null,
    projectStatus: project.projectStatus,
    dataType: project.dataType,
    createdAt: project.createdAt,
    imageUrl: project.imageUrl ?? null,
  };
};

const mapLabelPreset = (preset: ApiLabelPreset): ManagerLabelPresetOption => {
  const labelIds = Array.isArray(preset.labels)
    ? preset.labels
        .filter((label) => Boolean(label?.id))
        .map((label) => label.id)
    : [];

  return {
    id: preset.id,
    name: preset.name,
    description: preset.description ?? null,
    createdAt: preset.createdAt,
    labelIds,
  };
};

const toUniqueLabelIds = (presets: ManagerLabelPresetOption[]) => {
  return Array.from(new Set(presets.flatMap((preset) => preset.labelIds)));
};

export default function ManagerProjectsPage() {
  const { getUserInfo } = useAuth();
  const [projects, setProjects] = useState<ManagerProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectsError, setProjectsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [projectSearch, setProjectSearch] = useState("");
  const [projectStatusFilter, setProjectStatusFilter] =
    useState<ManagerProjectStatusFilter>("all");
  const [projectOrderBy, setProjectOrderBy] =
    useState<ManagerProjectOrderBy>("createdAt");
  const [projectOrder, setProjectOrder] = useState<ManagerProjectOrder>("DESC");

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectDescription, setProjectDescription] = useState("");
  const [projectDataType, setProjectDataType] = useState<DataType>("image");
  const [createThumbnailFile, setCreateThumbnailFile] = useState<File | null>(
    null,
  );
  const [createThumbnailPreview, setCreateThumbnailPreview] = useState<
    string | null
  >(null);
  const [createPresetSearch, setCreatePresetSearch] = useState("");
  const [presets, setPresets] = useState<ManagerLabelPresetOption[]>([]);
  const [presetsLoading, setPresetsLoading] = useState(false);
  const [selectedPresetIds, setSelectedPresetIds] = useState<string[]>([]);
  const [isCreating, setIsCreating] = useState(false);

  const user = getUserInfo();
  const visibleProjects = useMemo(() => {
    if (projectStatusFilter === "all") {
      return projects;
    }

    return projects.filter(
      (project) => project.projectStatus === projectStatusFilter,
    );
  }, [projectStatusFilter, projects]);

  const selectedPresets = useMemo(() => {
    if (selectedPresetIds.length === 0) {
      return [];
    }

    return presets.filter((preset) => selectedPresetIds.includes(preset.id));
  }, [presets, selectedPresetIds]);

  const resetCreateForm = () => {
    setProjectName("");
    setProjectDescription("");
    setProjectDataType("image");
    setCreateThumbnailFile(null);
    setCreateThumbnailPreview(null);
    setCreatePresetSearch("");
    setSelectedPresetIds([]);
  };

  const openCreateModal = () => {
    setProjectsError(null);
    setIsCreateOpen(true);
  };

  const closeCreateModal = () => {
    setIsCreateOpen(false);
    resetCreateForm();
  };

  const togglePresetSelection = (presetId: string) => {
    setSelectedPresetIds((prev) =>
      prev.includes(presetId)
        ? prev.filter((id) => id !== presetId)
        : [...prev, presetId],
    );
  };

  const handleCreateThumbnailFileChange = (file: File | null) => {
    setCreateThumbnailFile(file);

    if (!file) {
      setCreateThumbnailPreview(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setCreateThumbnailPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const loadProjects = async () => {
    setProjectsLoading(true);
    setProjectsError(null);

    try {
      const response = await getProjectsPaginated({
        ...(projectSearch.trim() && { search: projectSearch.trim() }),
        orderBy: projectOrderBy,
        order: projectOrder,
        page: currentPage,

        limit: PAGE_LIMIT,
        createdById: user?.id,
      });

      const fetched = extractArray<ApiProject>(response).map(normalizeProject);
      const pages = extractTotalPages(response);

      setProjects(fetched);
      setTotalPages(pages || 1);
    } catch (error) {
      setProjectsError(extractErrorMessage(error, "Failed to load projects."));
      setProjects([]);
      setTotalPages(1);
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadPresets = async (searchTerm: string) => {
    setPresetsLoading(true);

    try {
      const response = await getLabelPresetsPaginated({
        ...(searchTerm.trim() && { search: searchTerm.trim() }),
        orderBy: "createdAt",
        order: "DESC",
        page: 1,
        limit: 50,
      });

      setPresets(extractArray<ApiLabelPreset>(response).map(mapLabelPreset));
    } catch (error) {
      setProjectsError(
        extractErrorMessage(error, "Failed to load label presets."),
      );
      setPresets([]);
    } finally {
      setPresetsLoading(false);
    }
  };

  const handleCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setProjectsError(null);

    if (selectedPresets.length === 0) {
      setProjectsError("Select at least one label preset.");
      return;
    }

    const availableLabelIds = toUniqueLabelIds(selectedPresets);
    if (availableLabelIds.length === 0) {
      setProjectsError("Selected presets have no labels.");
      return;
    }

    setIsCreating(true);
    try {
      const createdResponse = await createProject(
        {
          name: projectName.trim() || "Untitled Project",
          ...(projectDescription.trim() && {
            description: projectDescription.trim(),
          }),
          dataType: projectDataType,
          availableLabelIds,
        },
        createThumbnailFile ?? undefined,
      );

      const created = unwrapApiResponse<ApiProject>(createdResponse);
      if (!created) {
        throw new Error("Invalid create project response.");
      }

      setProjects((prev) => [normalizeProject(created), ...prev]);
      closeCreateModal();
    } catch (error) {
      setProjectsError(extractErrorMessage(error, "Failed to create project."));
    } finally {
      setIsCreating(false);
    }
  };

  useEffect(() => {
    void loadProjects();
  }, [currentPage, projectOrder, projectOrderBy, projectSearch]);

  useEffect(() => {
    setCurrentPage(1);
  }, [projectOrder, projectOrderBy, projectSearch]);

  useEffect(() => {
    if (!isCreateOpen) {
      return;
    }

    void loadPresets(createPresetSearch);
  }, [createPresetSearch, isCreateOpen]);

  return (
    <div className="w-full bg-white px-6 py-5">
      <ProjectsHeader onCreateClick={openCreateModal} />

      {projectsError && (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {projectsError}
        </div>
      )}

      <StatisticsSummary
        className="mt-4"
        fetchStatistics={() => getProjectStatistics(user?.id)}
        cards={[
          { key: "totalCount", label: "Total projects" },
          { key: "activeCount", label: "Active" },
          { key: "completedCount", label: "Completed" },
          { key: "archivedCount", label: "Archived" },
        ]}
      />

      <ProjectFilters
        projectSearch={projectSearch}
        onProjectSearchChange={setProjectSearch}
        projectStatusFilter={projectStatusFilter}
        onProjectStatusFilterChange={setProjectStatusFilter}
        projectOrderBy={projectOrderBy}
        onProjectOrderByChange={setProjectOrderBy}
        projectOrder={projectOrder}
        onProjectOrderChange={setProjectOrder}
      />

      <ProjectTable
        projects={visibleProjects}
        loading={projectsLoading}
        onCreateClick={openCreateModal}
      />

      {!projectsLoading && visibleProjects.length > 0 && totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => setCurrentPage(page)}
            size="md"
          />
        </div>
      )}

      <CreateProjectModal
        open={isCreateOpen}
        onClose={closeCreateModal}
        onSubmit={handleCreate}
        isCreating={isCreating}
        projectName={projectName}
        projectDescription={projectDescription}
        projectDataType={projectDataType}
        onProjectNameChange={setProjectName}
        onProjectDescriptionChange={setProjectDescription}
        onProjectDataTypeChange={setProjectDataType}
        createThumbnailPreview={createThumbnailPreview}
        createThumbnailFile={createThumbnailFile}
        onCreateThumbnailFileChange={handleCreateThumbnailFileChange}
        createPresetSearch={createPresetSearch}
        onCreatePresetSearchChange={setCreatePresetSearch}
        presets={presets}
        presetsLoading={presetsLoading}
        selectedPresetIds={selectedPresetIds}
        onTogglePreset={togglePresetSelection}
      />
    </div>
  );
}
