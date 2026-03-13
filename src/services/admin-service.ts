import {
  getAllAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
} from "./account-service.service";
import {
  createProject,
  deleteProject,
  getProjectsPaginated,
  updateProject,
} from "./project-service.service";
import {
  createLabel,
  deleteLabel,
  getAllLabels,
  updateLabel,
} from "./label-service.service";
import {
  createLabelPreset,
  deleteLabelPreset,
  getAllLabelPresets,
  updateLabelPreset,
} from "./label-preset-service.service";

type RoleUi = "Admin" | "Manager" | "Reviewer" | "Annotator";
type StatusUi = "Active" | "Suspended";

type ProjectStatusUi = "Drafting" | "Active" | "Archived";
type ProjectTypeUi = "Image" | "Video" | "Text" | "Audio";

type LabelTypeUi = "Bounding Box" | "Polygon" | "Classification";

export type AdminAccountUi = {
  id: string;
  name: string;
  email: string;
  role: RoleUi;
  status: StatusUi;
};

export type AdminProjectUi = {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatusUi;
  dataType: ProjectTypeUi;
  createdAt: string;
};

export type AdminLabelUi = {
  id: string;
  name: string;
  description?: string;
  type: LabelTypeUi;
  totalClasses: number;
  classes?: string[];
  createdAt: string;
};

export type AdminPresetUi = {
  id: string;
  name: string;
  description?: string;
  labels: string[];
  createdAt: string;
};

export type AdminDashboardStats = {
  totalUsers: number;
  totalProjects: number;
  totalLabels: number;
  totalPresets: number;
};

const ensureArray = (value: unknown): Record<string, unknown>[] => {
  if (Array.isArray(value)) {
    return value as Record<string, unknown>[];
  }
  if (value && typeof value === "object") {
    const obj = value as Record<string, unknown>;
    const candidates = [obj.items, obj.data, obj.results, obj.rows];
    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate as Record<string, unknown>[];
      }
      // Handle nested paginated shape: { data: { data: [...] } }
      if (
        candidate &&
        typeof candidate === "object" &&
        !Array.isArray(candidate)
      ) {
        const nested = candidate as Record<string, unknown>;
        const inner = [nested.items, nested.data, nested.results, nested.rows];
        for (const innerCandidate of inner) {
          if (Array.isArray(innerCandidate)) {
            return innerCandidate as Record<string, unknown>[];
          }
        }
      }
    }
  }
  return [];
};

const roleToUi = (role: unknown): RoleUi => {
  const normalized = String(role ?? "annotator").toLowerCase();
  if (normalized === "admin") return "Admin";
  if (normalized === "manager") return "Manager";
  if (normalized === "reviewer") return "Reviewer";
  return "Annotator";
};

const roleToApi = (role: RoleUi) =>
  role.toLowerCase() as "admin" | "manager" | "reviewer" | "annotator";

const statusToUi = (status: unknown): StatusUi => {
  const normalized = String(status ?? "active").toLowerCase();
  return normalized === "inactive" ? "Suspended" : "Active";
};

const statusToApi = (status: StatusUi) =>
  (status === "Active" ? "active" : "inactive") as "active" | "inactive";

const projectStatusToUi = (status: unknown): ProjectStatusUi => {
  const normalized = String(status ?? "draft").toLowerCase();
  if (normalized === "active") return "Active";
  if (normalized === "archived") return "Archived";
  return "Drafting";
};

const projectStatusToApi = (status: ProjectStatusUi) => {
  if (status === "Active") return "active" as const;
  if (status === "Archived") return "archived" as const;
  return "draft" as const;
};

const projectTypeToUi = (type: unknown): ProjectTypeUi => {
  const normalized = String(type ?? "image").toLowerCase();
  if (normalized === "video") return "Video";
  if (normalized === "text") return "Text";
  if (normalized === "audio") return "Audio";
  return "Image";
};

const projectTypeToApi = (type: ProjectTypeUi) =>
  type.toLowerCase() as "image" | "video" | "text" | "audio";

const mapAccount = (item: Record<string, unknown>): AdminAccountUi => ({
  id: String(item.id ?? crypto.randomUUID()),
  name: String(item.username ?? item.name ?? "Unknown"),
  email: String(item.email ?? ""),
  role: roleToUi(item.role),
  status: statusToUi(item.status),
});

const mapProject = (item: Record<string, unknown>): AdminProjectUi => ({
  id: String(item.id ?? crypto.randomUUID()),
  name: String(item.name ?? "Untitled Project"),
  description: String(item.description ?? ""),
  status: projectStatusToUi(item.status),
  dataType: projectTypeToUi(item.dataType),
  createdAt: String(item.createdAt ?? new Date().toISOString().slice(0, 10)),
});

const mapLabel = (item: Record<string, unknown>): AdminLabelUi => ({
  id: String(item.id ?? crypto.randomUUID()),
  name: String(item.name ?? "Untitled Label"),
  description: String(item.description ?? ""),
  type: "Classification",
  totalClasses: Array.isArray(item.classes)
    ? (item.classes as unknown[]).length
    : Number(item.totalClasses ?? 0),
  classes: Array.isArray(item.classes) ? (item.classes as string[]) : [],
  createdAt: String(item.createdAt ?? new Date().toISOString().slice(0, 10)),
});

const mapPreset = (item: Record<string, unknown>): AdminPresetUi => ({
  id: String(item.id ?? crypto.randomUUID()),
  name: String(item.name ?? "Untitled Preset"),
  description: String(item.description ?? ""),
  labels: Array.isArray(item.labels)
    ? (item.labels as string[])
    : Array.isArray(item.labelIds)
      ? (item.labelIds as string[])
      : [],
  createdAt: String(item.createdAt ?? new Date().toISOString().slice(0, 10)),
});

export const hasBackendConfig = () =>
  Boolean(import.meta.env.VITE_PUBLIC_BACKEND_URL);

// Unwrap backend envelope: { success, data: ... } or Axios response { data: { success, data: ... } }
const unwrap = (value: unknown): unknown => {
  if (!value || typeof value !== "object") return value;
  const obj = value as Record<string, unknown>;
  // Axios response object has .data
  const inner = obj.data ?? obj;
  if (
    inner &&
    typeof inner === "object" &&
    "success" in (inner as Record<string, unknown>)
  ) {
    return (inner as Record<string, unknown>).data;
  }
  return inner;
};

const unwrapRecord = (value: unknown): Record<string, unknown> => {
  const result = unwrap(value);
  return (result && typeof result === "object" ? result : {}) as Record<
    string,
    unknown
  >;
};

export const fetchAdminAccounts = async (): Promise<AdminAccountUi[]> => {
  const response = await getAllAccounts({}, false);
  const items = ensureArray(unwrap(response));
  return items.map(mapAccount);
};

export const createAdminAccount = async (
  payload: Omit<AdminAccountUi, "id">,
): Promise<AdminAccountUi> => {
  const response = await createAccount({
    email: payload.email,
    username: payload.name,
    role: roleToApi(payload.role),
    status: statusToApi(payload.status),
  });
  return mapAccount(unwrapRecord(response));
};

export const updateAdminAccount = async (
  id: string,
  payload: Partial<Omit<AdminAccountUi, "id">>,
): Promise<AdminAccountUi> => {
  const response = await updateAccount(id, {
    email: payload.email,
    username: payload.name,
    role: payload.role ? roleToApi(payload.role) : undefined,
    status: payload.status ? statusToApi(payload.status) : undefined,
  });
  return mapAccount(unwrapRecord(response));
};

export const deleteAdminAccount = async (id: string): Promise<void> => {
  await deleteAccount(id);
};

export const fetchAdminProjects = async (): Promise<AdminProjectUi[]> => {
  const response = await getProjectsPaginated({ page: 1, limit: 100 });
  const items = ensureArray(unwrap(response));
  return items.map(mapProject);
};

export const createAdminProject = async (
  payload: Omit<AdminProjectUi, "id" | "createdAt" | "status">,
): Promise<AdminProjectUi> => {
  const response = await createProject({
    name: payload.name,
    description: payload.description,
    dataType: projectTypeToApi(payload.dataType),
    availableLabelIds: [],
  });

  return mapProject({ ...unwrapRecord(response), status: "draft" });
};

export const updateAdminProject = async (
  id: string,
  payload: Partial<Omit<AdminProjectUi, "id" | "createdAt">>,
): Promise<AdminProjectUi> => {
  const response = unwrapRecord(
    await updateProject(id, {
      name: payload.name ?? "",
      description: payload.description,
      dataType: projectTypeToApi(payload.dataType ?? "Image"),
    }),
  );

  return mapProject({
    ...response,
    status: payload.status
      ? projectStatusToApi(payload.status)
      : response.status,
  });
};

export const deleteAdminProject = async (id: string): Promise<void> => {
  await deleteProject(id);
};

export const fetchAdminLabels = async (): Promise<AdminLabelUi[]> => {
  const response = await getAllLabels({}, false);
  const items = ensureArray(unwrap(response));
  return items.map(mapLabel);
};

export const createAdminLabel = async (
  payload: Omit<AdminLabelUi, "id" | "createdAt" | "totalClasses">,
): Promise<AdminLabelUi> => {
  const response = unwrapRecord(
    await createLabel({
      name: payload.name,
      description: payload.description,
      categoryIds: [],
    }),
  );

  return mapLabel({ ...response, classes: payload.classes ?? [] });
};

export const updateAdminLabel = async (
  id: string,
  payload: Partial<Omit<AdminLabelUi, "id" | "createdAt">>,
): Promise<AdminLabelUi> => {
  const response = unwrapRecord(
    await updateLabel(id, {
      name: payload.name,
      description: payload.description,
    }),
  );

  return mapLabel({ ...response, classes: payload.classes ?? [] });
};

export const deleteAdminLabel = async (id: string): Promise<void> => {
  await deleteLabel(id);
};

export const fetchAdminPresets = async (): Promise<AdminPresetUi[]> => {
  const response = await getAllLabelPresets({}, false);
  const items = ensureArray(unwrap(response));
  return items.map(mapPreset);
};

export const createAdminPreset = async (
  payload: Omit<AdminPresetUi, "id" | "createdAt">,
): Promise<AdminPresetUi> => {
  const response = unwrapRecord(
    await createLabelPreset({
      name: payload.name,
      description: payload.description,
      labelIds: payload.labels,
    }),
  );

  return mapPreset(response);
};

export const updateAdminPreset = async (
  id: string,
  payload: Partial<Omit<AdminPresetUi, "id" | "createdAt">>,
): Promise<AdminPresetUi> => {
  const response = unwrapRecord(
    await updateLabelPreset(id, {
      name: payload.name,
      description: payload.description,
      labelIds: payload.labels,
    }),
  );

  return mapPreset(response);
};

export const deleteAdminPreset = async (id: string): Promise<void> => {
  await deleteLabelPreset(id);
};

export const fetchAdminDashboardStats =
  async (): Promise<AdminDashboardStats> => {
    const [accounts, projects, labels, presets] = await Promise.all([
      fetchAdminAccounts(),
      fetchAdminProjects(),
      fetchAdminLabels(),
      fetchAdminPresets(),
    ]);

    return {
      totalUsers: accounts.length,
      totalProjects: projects.length,
      totalLabels: labels.length,
      totalPresets: presets.length,
    };
  };
