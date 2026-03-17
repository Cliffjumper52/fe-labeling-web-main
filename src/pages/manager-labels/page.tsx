import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { Link } from "react-router-dom";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { Role } from "../../interface/enums/domain.enums";
import type { Label as ApiLabel } from "../../interface/label/label.interface";
import type { CreateLabelDto } from "../../interface/label/dtos/create-label.dto";
import type { UpdateLabelDto } from "../../interface/label/dtos/update-label.dto";
import type { LabelCategory } from "../../interface/label-category/label-category.interface";
import type { LabelChecklistQuestion } from "../../interface/label-checklist-question/label-checklist-question.interface";
import {
  createLabel,
  deleteLabel,
  getLabelStatistics,
  getLabelPaginated,
  updateLabel,
} from "../../services/label-service.service";
import {
  createLabelChecklistQuestion,
  deleteLabelChecklistQuestion,
  getAllLabelChecklistQuestions,
  updateLabelChecklistQuestion,
} from "../../services/label-checklist-question-service.service";
import { getAllCategories } from "../../services/label-category-service.service";
import { ConfirmButton } from "../../components/common/confirm-modal";
import Pagination from "../../components/common/pagination";
import StatisticsSummary from "../../components/common/statistics-summary";
import { useAuth } from "../../context/auth-context.context";

type UiLabelCategory = {
  id: string;
  name: string;
};

type Label = {
  id: string;
  name: string;
  description?: string;
  questions?: ChecklistQuestion[];
  color?: string;
  categories?: UiLabelCategory[];
  createdAt: string;
  updatedAt: string;
};

type ChecklistQuestion = {
  id: string;
  text: string;
  description?: string;
  role: "Annotator" | "Reviewer";
  required: boolean;
  isDraft?: boolean;
};

type CreateLabelPayload = {
  name: string;
  description?: string;
  categoryIds: string[];
  color?: string;
};

type UpdateLabelPayload = {
  name?: string;
  description?: string;
  categoryIds?: string[];
  color?: string;
};

type ManagerLabelsPageProps = {
  mode?: "manager" | "admin";
  initialLabels?: Label[];
};

const LABEL_COLORS = [
  "#f05252",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
  "#6b7280",
  "#111827",
];

const PAGE_LIMIT = 10;
const DEFAULT_LABEL_COLOR = "#3b82f6";
const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;

type PaginationResult<T> = {
  data: T[];
  totalPages?: number;
  pageCount?: number;
};

const truncateText = (value: string, maxLength: number) => {
  if (value.length <= maxLength) {
    return value;
  }
  return `${value.slice(0, maxLength)}...`;
};

const normalizeHexColor = (value: unknown): string | undefined => {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value.trim().toLowerCase();
  return HEX_COLOR_REGEX.test(normalized) ? normalized : undefined;
};

const getColorOrDefault = (value: unknown): string => {
  return normalizeHexColor(value) ?? DEFAULT_LABEL_COLOR;
};

export default function ManagerLabelsPage({
  mode = "manager",
  initialLabels,
}: ManagerLabelsPageProps) {
  const isAdmin = mode === "admin";
  const { getUserInfo } = useAuth();
  const user = getUserInfo();

  const [labels, setLabels] = useState<Label[]>(() => {
    return (initialLabels ?? []).map((label) => ({
      ...label,
      color: getColorOrDefault(label.color),
    }));
  });
  const hasLabels = labels.length > 0;
  const [labelCategories, setLabelCategories] = useState<LabelCategory[]>([]);
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelsError, setLabelsError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isCreateLabelOpen, setIsCreateLabelOpen] = useState(false);
  const [creatingLabel, setCreatingLabel] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [labelDescription, setLabelDescription] = useState("");
  const [labelColors, setLabelColors] = useState<string[]>([
    DEFAULT_LABEL_COLOR,
  ]);
  const [customColorOptions, setCustomColorOptions] = useState<string[]>([]);
  const [showCreateColorPicker, setShowCreateColorPicker] = useState(false);
  const [showEditColorPicker, setShowEditColorPicker] = useState(false);
  const [createCustomColor, setCreateCustomColor] =
    useState(DEFAULT_LABEL_COLOR);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [orderBy, setOrderBy] = useState<"Name" | "Date created">(
    "Date created",
  );
  const [order, setOrder] = useState<"Ascending" | "Descending">("Descending");
  const [isEditLabelOpen, setIsEditLabelOpen] = useState(false);
  const [updatingLabel, setUpdatingLabel] = useState(false);
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColors, setEditColors] = useState<string[]>([DEFAULT_LABEL_COLOR]);
  const [editCustomColor, setEditCustomColor] = useState(DEFAULT_LABEL_COLOR);
  const [editCategories, setEditCategories] = useState<string[]>([]);
  const [isAddQuestionOpen, setIsAddQuestionOpen] = useState(false);
  const [questionText, setQuestionText] = useState("");
  const [questionDescription, setQuestionDescription] = useState("");
  const [questionRole, setQuestionRole] = useState<"Annotator" | "Reviewer">(
    "Annotator",
  );
  const [isQuestionRequired, setIsQuestionRequired] = useState(false);
  const [questionTarget, setQuestionTarget] = useState<"create" | "edit">(
    "create",
  );
  const [questionMode, setQuestionMode] = useState<"add" | "edit">("add");
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(
    null,
  );
  const [createQuestions, setCreateQuestions] = useState<ChecklistQuestion[]>(
    [],
  );
  const [editQuestions, setEditQuestions] = useState<ChecklistQuestion[]>([]);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  const unwrapApiResponse = <T,>(payload: unknown): T | null => {
    if (!payload || typeof payload !== "object") {
      return payload as T;
    }

    if ("data" in payload) {
      return (payload as ApiResponse<T>).data;
    }

    return payload as T;
  };

  const extractArray = <T,>(payload: unknown): T[] => {
    const data = unwrapApiResponse<T[] | PaginationResult<T>>(payload);
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

  const extractTotalPages = (payload: unknown): number => {
    const data = unwrapApiResponse<PaginationResult<unknown>>(payload);
    if (data && typeof data === "object") {
      return data.totalPages ?? data.pageCount ?? 1;
    }
    return 1;
  };

  const extractErrorMessage = (error: unknown, fallback: string) => {
    const message = (error as { response?: { data?: { message?: unknown } } })
      ?.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    return error instanceof Error ? error.message : fallback;
  };

  const roleLabelToEnum = (role: ChecklistQuestion["role"]): Role =>
    role === "Reviewer" ? "reviewer" : "annotator";

  const roleEnumToLabel = (role: Role): ChecklistQuestion["role"] =>
    role === "reviewer" ? "Reviewer" : "Annotator";

  const mapCategories = (
    categoryRefs: Array<{ id: string; name?: string }> | undefined,
    categoryMap: Map<string, string>,
  ): UiLabelCategory[] => {
    if (!Array.isArray(categoryRefs)) {
      return [];
    }

    return categoryRefs
      .filter((category) => Boolean(category?.id))
      .map((category) => ({
        id: category.id,
        name: category.name ?? categoryMap.get(category.id) ?? "Unknown",
      }));
  };

  const mapQuestions = (
    questions: LabelChecklistQuestion[],
  ): ChecklistQuestion[] => {
    return questions
      .filter((question) =>
        ["annotator", "reviewer"].includes(question.roleEnum),
      )
      .map((question) => ({
        id: question.id,
        text: question.name,
        description: question.description ?? undefined,
        role: roleEnumToLabel(question.roleEnum),
        required: question.isRequired,
        isDraft: false,
      }));
  };

  const normalizeLabels = (
    apiLabels: ApiLabel[],
    categories: LabelCategory[],
    questionMap: Record<string, ChecklistQuestion[]>,
  ): Label[] => {
    const categoryMap = new Map(
      categories.map((category) => [category.id, category.name]),
    );

    return apiLabels.map((label) => {
      const rawCategories = Array.isArray(label.categories)
        ? (label.categories as Array<{ id: string; name?: string }>)
        : [];
      const color = getColorOrDefault((label as { color?: unknown }).color);

      return {
        id: label.id,
        name: label.name,
        description: label.description ?? undefined,
        questions: questionMap[label.id] ?? [],
        color,
        categories: mapCategories(rawCategories, categoryMap),
        createdAt: label.createdAt,
        updatedAt: label.updatedAt,
      };
    });
  };

  const loadLabels = async () => {
    setLabelsLoading(true);
    setLabelsError(null);

    try {
      const [labelsResp, categoriesResp, questionsResp] = await Promise.all([
        getLabelPaginated({
          ...(search.trim() && { search: search.trim() }),
          ...(orderBy === "Name" && { orderBy: "name" }),
          ...(orderBy === "Date created" && { orderBy: "createdAt" }),
          ...(order === "Ascending" && { order: "ASC" }),
          ...(order === "Descending" && { order: "DESC" }),
          page: currentPage,
          limit: PAGE_LIMIT,
        }),
        getAllCategories({
          orderBy: "name",
          order: "ASC",
        }),
        getAllLabelChecklistQuestions({
          orderBy: "createdAt",
          order: "DESC",
        }),
      ]);

      const fetchedLabels = extractArray<ApiLabel>(labelsResp);
      const fetchedCategories = extractArray<LabelCategory>(categoriesResp);
      const fetchedQuestions =
        extractArray<LabelChecklistQuestion>(questionsResp);
      const pages = extractTotalPages(labelsResp);

      const questionsByLabel = fetchedQuestions.reduce(
        (acc, question) => {
          const mapped = mapQuestions([question]);
          if (mapped.length === 0) {
            return acc;
          }
          const next = acc[question.labelId] ?? [];
          acc[question.labelId] = [...next, ...mapped];
          return acc;
        },
        {} as Record<string, ChecklistQuestion[]>,
      );

      setLabelCategories(fetchedCategories);
      setLabels(
        normalizeLabels(fetchedLabels, fetchedCategories, questionsByLabel),
      );
      setTotalPages(pages || 1);
    } catch (error) {
      setLabelsError(
        extractErrorMessage(error, "Failed to load manager labels."),
      );
      setLabels([]);
      setLabelCategories([]);
      setTotalPages(1);
    } finally {
      setLabelsLoading(false);
    }
  };

  useEffect(() => {
    void loadLabels();
  }, [currentPage, order, orderBy, search]);

  useEffect(() => {
    setCurrentPage(1);
  }, [order, orderBy, search]);

  const visibleLabels = useMemo(() => {
    const filtered = labels.filter((label) => {
      const bySearch =
        label.name.toLowerCase().includes(search.toLowerCase()) ||
        (label.description ?? "").toLowerCase().includes(search.toLowerCase());
      return bySearch;
    });

    const sorted = [...filtered].sort((a, b) => {
      if (orderBy === "Name") {
        const compareName = a.name.localeCompare(b.name);
        return order === "Ascending" ? compareName : -compareName;
      }

      const compareDate = a.createdAt.localeCompare(b.createdAt);
      return order === "Ascending" ? compareDate : -compareDate;
    });

    return sorted;
  }, [labels, order, orderBy, search]);

  const resetCreateLabelForm = () => {
    setLabelName("");
    setLabelDescription("");
    setLabelColors([DEFAULT_LABEL_COLOR]);
    setCreateCustomColor(DEFAULT_LABEL_COLOR);
    setShowCreateColorPicker(false);
    setSelectedCategoryIds([]);
    setCreateQuestions([]);
  };

  const colorOptions = useMemo(() => {
    return Array.from(
      new Set(
        [...LABEL_COLORS, ...customColorOptions]
          .map((color) => normalizeHexColor(color))
          .filter((color): color is string => Boolean(color)),
      ),
    );
  }, [customColorOptions]);

  const setCreateSelectedColor = (value: string) => {
    const normalized = getColorOrDefault(value);
    setLabelColors([normalized]);
    setCreateCustomColor(normalized);
  };

  const setEditSelectedColor = (value: string) => {
    const normalized = getColorOrDefault(value);
    setEditColors([normalized]);
    setEditCustomColor(normalized);
  };

  const addCustomColorOption = (value: string) => {
    const normalized = normalizeHexColor(value);
    if (!normalized) {
      return;
    }

    setCustomColorOptions((prev) =>
      prev.includes(normalized) ? prev : [...prev, normalized],
    );
  };

  const toggleSelection = (
    value: string,
    setter: Dispatch<SetStateAction<string[]>>,
  ) => {
    setter((prev) =>
      prev.includes(value)
        ? prev.filter((item) => item !== value)
        : [...prev, value],
    );
  };

  const handleCreateLabel = async (event: FormEvent) => {
    event.preventDefault();

    setLabelsError(null);
    setCreatingLabel(true);

    try {
      const createColor = getColorOrDefault(labelColors[0] as unknown);
      const createPayload: CreateLabelPayload = {
        name: labelName.trim() || "Untitled Label",
        description: labelDescription.trim() || undefined,
        categoryIds: selectedCategoryIds,
        color: createColor,
      };

      const createdLabelResp = await createLabel(
        createPayload as unknown as CreateLabelDto,
      );

      const createdLabel = unwrapApiResponse<ApiLabel>(createdLabelResp);
      if (!createdLabel) {
        throw new Error("Invalid create label response.");
      }

      const questionResults = await Promise.all(
        createQuestions.map((question) =>
          createLabelChecklistQuestion({
            name: question.text,
            description: question.description,
            labelId: createdLabel.id,
            roleEnum: roleLabelToEnum(question.role),
            isRequired: question.required,
          }),
        ),
      );

      const createdQuestions = questionResults
        .map((resp) => unwrapApiResponse<LabelChecklistQuestion>(resp))
        .filter((question): question is LabelChecklistQuestion =>
          Boolean(question),
        );

      const categoryMap = new Map(
        labelCategories.map((category) => [category.id, category.name]),
      );

      const categoryRefs = Array.isArray(createdLabel.categories)
        ? (createdLabel.categories as Array<{ id: string; name?: string }>)
        : selectedCategoryIds.map((id) => ({ id }));

      const createdColor = normalizeHexColor(
        (createdLabel as { color?: unknown }).color,
      );

      const nextLabel: Label = {
        id: createdLabel.id,
        name: createdLabel.name,
        description: createdLabel.description ?? undefined,
        questions: mapQuestions(createdQuestions),
        color: createdColor ?? createColor,
        categories: mapCategories(categoryRefs, categoryMap),
        createdAt: createdLabel.createdAt,
        updatedAt: createdLabel.updatedAt ?? createdLabel.createdAt,
      };

      setLabels((prev) => [nextLabel, ...prev]);
      setIsCreateLabelOpen(false);
      resetCreateLabelForm();
    } catch (error) {
      setLabelsError(extractErrorMessage(error, "Failed to create label."));
    } finally {
      setCreatingLabel(false);
    }
  };

  const handleOpenLabelEdit = (label: Label) => {
    const labelColor = getColorOrDefault(label.color);
    setActiveLabel(label);
    setEditName(label.name);
    setEditDescription(label.description ?? "");
    setEditColors([labelColor]);
    setEditCustomColor(labelColor);
    addCustomColorOption(labelColor);
    setShowEditColorPicker(false);
    setEditCategories((label.categories ?? []).map((category) => category.id));
    setEditQuestions(label.questions ?? []);
    setIsEditLabelOpen(true);
  };

  const handleDeleteLabel = async (labelId: string) => {
    setLabelsError(null);

    try {
      await deleteLabel(labelId);
      setLabels((prev) => prev.filter((label) => label.id !== labelId));
    } catch (error) {
      const message = extractErrorMessage(error, "Failed to delete label.");
      setLabelsError(message);
      throw error;
    }
  };

  const handleConfirmEdit = async () => {
    if (!activeLabel) {
      return;
    }

    setLabelsError(null);
    setUpdatingLabel(true);

    try {
      const updateColor = getColorOrDefault(editColors[0] as unknown);
      const updatePayload: UpdateLabelPayload = {
        name: editName.trim() || activeLabel.name,
        description: editDescription.trim() || undefined,
        categoryIds: editCategories,
        color: updateColor,
      };

      const updatedResp = await updateLabel(
        activeLabel.id,
        updatePayload as unknown as UpdateLabelDto,
      );

      const updatedLabel = unwrapApiResponse<ApiLabel>(updatedResp);
      if (!updatedLabel) {
        throw new Error("Invalid update label response.");
      }

      const pendingQuestions = (editQuestions ?? []).filter(
        (question) => question.isDraft,
      );
      const persistedQuestions = (editQuestions ?? []).filter(
        (question) => !question.isDraft,
      );

      const createdQuestionsResp = await Promise.all(
        pendingQuestions.map((question) =>
          createLabelChecklistQuestion({
            name: question.text,
            description: question.description,
            labelId: updatedLabel.id,
            roleEnum: roleLabelToEnum(question.role),
            isRequired: question.required,
          }),
        ),
      );

      const createdQuestions = createdQuestionsResp
        .map((resp) => unwrapApiResponse<LabelChecklistQuestion>(resp))
        .filter((question): question is LabelChecklistQuestion =>
          Boolean(question),
        );

      const mergedQuestions = [
        ...persistedQuestions,
        ...mapQuestions(createdQuestions),
      ];

      const categoryMap = new Map(
        labelCategories.map((category) => [category.id, category.name]),
      );

      const updatedCategoryRefs = Array.isArray(updatedLabel.categories)
        ? (updatedLabel.categories as Array<{ id: string; name?: string }>)
        : editCategories.map((id) => ({ id }));

      const updatedColor = normalizeHexColor(
        (updatedLabel as { color?: unknown }).color,
      );

      const nextLabel: Label = {
        ...activeLabel,
        name: updatedLabel.name,
        description: updatedLabel.description ?? undefined,
        questions: mergedQuestions,
        color: updatedColor ?? updateColor,
        categories: mapCategories(updatedCategoryRefs, categoryMap),
        updatedAt: updatedLabel.updatedAt ?? activeLabel.updatedAt,
      };

      setEditQuestions(mergedQuestions);
      setLabels((prev) =>
        prev.map((label) => (label.id === activeLabel.id ? nextLabel : label)),
      );
      setActiveLabel(nextLabel);
      closeWithAnimation("editLabel", setIsEditLabelOpen);
    } catch (error) {
      setLabelsError(extractErrorMessage(error, "Failed to update label."));
    } finally {
      setUpdatingLabel(false);
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

  const resetQuestionForm = () => {
    setQuestionText("");
    setQuestionDescription("");
    setQuestionRole("Annotator");
    setIsQuestionRequired(false);
  };

  const updateLabelQuestions = (
    labelId: string,
    nextQuestions: ChecklistQuestion[],
  ) => {
    setLabels((prev) =>
      prev.map((label) =>
        label.id === labelId ? { ...label, questions: nextQuestions } : label,
      ),
    );
    setActiveLabel((prev) =>
      prev && prev.id === labelId
        ? { ...prev, questions: nextQuestions }
        : prev,
    );
  };

  const openQuestionEditor = (
    question: ChecklistQuestion | null,
    target: "create" | "edit",
  ) => {
    if (question) {
      setQuestionMode("edit");
      setEditingQuestionId(question.id);
      setQuestionText(question.text);
      setQuestionDescription(question.description ?? "");
      setQuestionRole(question.role);
      setIsQuestionRequired(question.required);
    } else {
      setQuestionMode("add");
      setEditingQuestionId(null);
      resetQuestionForm();
    }

    setQuestionTarget(target);
    setIsAddQuestionOpen(true);
  };

  const handleQuestionDelete = async (
    question: ChecklistQuestion,
    target: "create" | "edit",
  ) => {
    if (target === "create") {
      setCreateQuestions((prev) =>
        prev.filter((item) => item.id !== question.id),
      );
      return;
    }

    if (question.isDraft) {
      setEditQuestions((prev) =>
        prev.filter((item) => item.id !== question.id),
      );
      return;
    }

    if (!activeLabel) {
      return;
    }

    setLabelsError(null);

    try {
      await deleteLabelChecklistQuestion(question.id);
      const nextQuestions = editQuestions.filter(
        (item) => item.id !== question.id,
      );
      setEditQuestions(nextQuestions);
      updateLabelQuestions(activeLabel.id, nextQuestions);
    } catch (error) {
      setLabelsError(
        extractErrorMessage(error, "Failed to delete checklist question."),
      );
    }
  };

  const handleQuestionSubmit = async (event: FormEvent) => {
    event.preventDefault();

    const baseQuestion = {
      text: questionText.trim(),
      description: questionDescription.trim() || undefined,
      role: questionRole,
      required: isQuestionRequired,
    };

    if (questionMode === "add") {
      const nextQuestion: ChecklistQuestion = {
        id: crypto.randomUUID(),
        ...baseQuestion,
        isDraft: questionTarget === "edit",
      };

      if (questionTarget === "create") {
        setCreateQuestions((prev) => [nextQuestion, ...prev]);
      } else {
        setEditQuestions((prev) => [nextQuestion, ...prev]);
      }

      setIsAddQuestionOpen(false);
      resetQuestionForm();
      return;
    }

    if (!editingQuestionId) {
      return;
    }

    if (questionTarget === "create") {
      setCreateQuestions((prev) =>
        prev.map((item) =>
          item.id === editingQuestionId ? { ...item, ...baseQuestion } : item,
        ),
      );
      setIsAddQuestionOpen(false);
      resetQuestionForm();
      return;
    }

    const existingQuestion = editQuestions.find(
      (item) => item.id === editingQuestionId,
    );
    if (!existingQuestion) {
      return;
    }

    if (existingQuestion.isDraft) {
      setEditQuestions((prev) =>
        prev.map((item) =>
          item.id === editingQuestionId ? { ...item, ...baseQuestion } : item,
        ),
      );
      setIsAddQuestionOpen(false);
      resetQuestionForm();
      return;
    }

    setLabelsError(null);

    try {
      const updatedResp = await updateLabelChecklistQuestion(
        editingQuestionId,
        {
          name: baseQuestion.text,
          description: baseQuestion.description,
          roleEnum: roleLabelToEnum(baseQuestion.role),
          isRequired: baseQuestion.required,
        },
      );

      const updatedApiQuestion =
        unwrapApiResponse<LabelChecklistQuestion>(updatedResp);

      const updatedQuestion = updatedApiQuestion
        ? mapQuestions([updatedApiQuestion])[0]
        : { ...existingQuestion, ...baseQuestion };

      const nextQuestions = editQuestions.map((item) =>
        item.id === editingQuestionId ? updatedQuestion : item,
      );

      setEditQuestions(nextQuestions);
      if (activeLabel) {
        updateLabelQuestions(activeLabel.id, nextQuestions);
      }
      setIsAddQuestionOpen(false);
      resetQuestionForm();
    } catch (error) {
      setLabelsError(
        extractErrorMessage(error, "Failed to update checklist question."),
      );
    }
  };

  const categoryOptions = useMemo(() => {
    return labelCategories.map((category) => ({
      id: category.id,
      name: category.name,
    }));
  }, [labelCategories]);

  const fetchLabelStatistics = useCallback(
    () => getLabelStatistics(undefined),
    [],
  );

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-gray-800">Labels</h2>
          {!isAdmin && (
            <button
              type="button"
              onClick={() => {
                resetCreateLabelForm();
                setIsCreateLabelOpen(true);
              }}
              className="flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <span className="text-lg leading-none">+</span>
              New label
            </button>
          )}
        </div>

        <div className="h-px w-full bg-gray-200" />

        <StatisticsSummary
          fetchStatistics={fetchLabelStatistics}
          cards={[
            { key: "totalLabels", label: "Total labels" },
            { key: "labelsWithQuestions", label: "With questions" },
            { key: "annotatorQuestions", label: "Annotator qs" },
            { key: "reviewerQuestions", label: "Reviewer qs" },
          ]}
        />

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr_1fr]">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Search
            </label>
            <div className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm">
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
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="w-full text-sm outline-none placeholder:text-gray-400"
                placeholder="Search labels..."
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">
              Order by
            </label>
            <select
              title="Order by"
              value={orderBy}
              onChange={(event) =>
                setOrderBy(event.target.value as "Name" | "Date created")
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <option value="Name">Name</option>
              <option value="Date created">Date created</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Order</label>
            <select
              title="Sort order"
              value={order}
              onChange={(event) =>
                setOrder(event.target.value as "Ascending" | "Descending")
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <option value="Ascending">Ascending</option>
              <option value="Descending">Descending</option>
            </select>
          </div>
        </div>

        {labelsError && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {labelsError}
          </div>
        )}

        {labelsLoading ? (
          <div className="rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
            Loading labels...
          </div>
        ) : !hasLabels ? (
          <div className="rounded-lg bg-white py-16 text-center">
            <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <svg
                viewBox="0 0 24 24"
                className="h-8 w-8 text-gray-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-800">
              No labels yet
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              {isAdmin
                ? "No labels are available right now."
                : "Create your first label configuration for upcoming projects"}
            </p>
            {!isAdmin && (
              <button
                type="button"
                onClick={() => {
                  resetCreateLabelForm();
                  setIsCreateLabelOpen(true);
                }}
                className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
              >
                <span className="text-base leading-none">+</span>
                Create label
              </button>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1.4fr_2fr_1.2fr_1fr_1fr_1fr_0.9fr] items-center gap-2 border-b border-gray-200 px-5 py-4 text-xs font-semibold uppercase text-gray-600">
              <span>Label</span>
              <span>Description</span>
              <span className="flex justify-start">Categories</span>
              <span>Checklist</span>
              <span>Created</span>
              <span>Updated</span>
              <span>Actions</span>
            </div>

            {visibleLabels.map((label) => (
              <div
                key={label.id}
                className="grid grid-cols-[1.4fr_2fr_1.2fr_1fr_1fr_1fr_0.9fr] items-center gap-2 border-b border-gray-100 px-5 py-4 text-sm last:border-b-0"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="flex h-6 w-6 items-center justify-center rounded-md border border-gray-200"
                    style={{ backgroundColor: getColorOrDefault(label.color) }}
                  >
                    <span className="h-2.5 w-2.5 rounded-full bg-white/80" />
                  </span>
                  <p className="font-semibold text-gray-900">{label.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {truncateText(label.description || "No description", 20)}
                  </p>
                </div>
                <div>
                  <div className="flex w-full flex-col items-start gap-2">
                    {(label.categories ?? []).length === 0 ? (
                      <span className="text-xs text-gray-400">No category</span>
                    ) : (
                      (label.categories ?? []).map((category) => (
                        <span
                          key={category.id}
                          className="w-[90px] rounded-full bg-gray-100 px-3 py-1 text-center text-xs font-semibold text-gray-700"
                        >
                          {category.name}
                        </span>
                      ))
                    )}
                  </div>
                </div>
                <div>
                  <div className="flex flex-wrap gap-2">
                    {(label.questions ?? []).filter(
                      (question) => question.role === "Annotator",
                    ).length > 0 && (
                      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                        {
                          (label.questions ?? []).filter(
                            (question) => question.role === "Annotator",
                          ).length
                        }{" "}
                        Annotator
                      </span>
                    )}
                    {(label.questions ?? []).filter(
                      (question) => question.role === "Reviewer",
                    ).length > 0 && (
                      <span className="rounded-full bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
                        {
                          (label.questions ?? []).filter(
                            (question) => question.role === "Reviewer",
                          ).length
                        }{" "}
                        Reviewer
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-sm text-gray-600">{label.createdAt}</span>
                <span className="text-sm text-gray-600">{label.updatedAt}</span>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <Link
                    to={`/manager/labels/${label.id}`}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Details
                  </Link>
                  {isAdmin ? (
                    <ConfirmButton
                      label="Delete"
                      variant="danger"
                      size="sm"
                      className="!h-auto !border-0 !bg-transparent !p-0 text-red-500 hover:text-red-600 hover:!bg-transparent"
                      modalHeader="Delete this label?"
                      modalBody={`Are you sure you want to delete ${label.name}? This action cannot be undone.`}
                      confirmLabel="Delete"
                      onConfirm={() => handleDeleteLabel(label.id)}
                    />
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => handleOpenLabelEdit(label)}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        Edit
                      </button>
                      <ConfirmButton
                        label="Delete"
                        variant="danger"
                        size="sm"
                        className="!h-auto !border-0 !bg-transparent !p-0 text-red-500 hover:text-red-600 hover:!bg-transparent"
                        modalHeader="Delete this label?"
                        modalBody={`Are you sure you want to delete ${label.name}? This action cannot be undone.`}
                        confirmLabel="Delete"
                        onConfirm={() => handleDeleteLabel(label.id)}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}

            {visibleLabels.length === 0 && (
              <div className="px-5 py-12 text-center text-sm text-gray-500">
                No labels found for current filters.
              </div>
            )}
          </div>
        )}

        {hasLabels && !labelsLoading && totalPages > 1 && (
          <div className="flex justify-center">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={(page) => setCurrentPage(page)}
              size="md"
            />
          </div>
        )}

        {isCreateLabelOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 sm:items-center">
            <div
              className={`w-full max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl ${
                closingModals.createLabel ? "modal-pop-out" : "modal-pop"
              }`}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Create label
                </h3>
                <button
                  type="button"
                  disabled={creatingLabel}
                  onClick={() => {
                    closeWithAnimation("createLabel", setIsCreateLabelOpen);
                    resetCreateLabelForm();
                  }}
                  className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
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

              <form
                onSubmit={handleCreateLabel}
                className="max-h-[calc(90vh-72px)] space-y-5 overflow-y-auto px-5 py-5"
              >
                <div className="rounded-lg border border-gray-200">
                  <div className="border-b px-4 py-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Label details
                    </h4>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={labelName}
                        onChange={(event) => setLabelName(event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Example name"
                        required
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={labelDescription}
                        onChange={(event) =>
                          setLabelDescription(event.target.value)
                        }
                        className="min-h-[96px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Example description"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Color
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setCreateSelectedColor(color)}
                            className={`h-6 w-6 rounded-full border ${
                              labelColors[0] === color
                                ? "border-gray-900 ring-2 ring-gray-900/20"
                                : "border-gray-200"
                            }`}
                            style={{ backgroundColor: color }}
                            aria-pressed={labelColors[0] === color}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setShowCreateColorPicker((prev) => !prev)
                          }
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {showCreateColorPicker
                            ? "Hide picker"
                            : "More colors"}
                        </button>
                      </div>
                      {showCreateColorPicker && (
                        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                          <input
                            type="color"
                            value={createCustomColor}
                            onChange={(event) =>
                              setCreateCustomColor(
                                getColorOrDefault(event.target.value),
                              )
                            }
                            className="h-8 w-11 cursor-pointer rounded border border-gray-300 bg-white p-1"
                          />
                          <span className="text-xs font-semibold text-gray-700">
                            {createCustomColor.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              addCustomColorOption(createCustomColor);
                              setCreateSelectedColor(createCustomColor);
                            }}
                            className="rounded-md bg-gray-800 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-900"
                          >
                            Use color
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Categories
                      </label>
                      {categoryOptions.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          No categories yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {categoryOptions.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                toggleSelection(
                                  category.id,
                                  setSelectedCategoryIds,
                                )
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                                selectedCategoryIds.includes(category.id)
                                  ? "border-gray-900 bg-gray-900 text-white"
                                  : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Checklist questions
                      </h4>
                      <p className="text-xs text-gray-500">
                        {createQuestions.length} questions total
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => {
                        openQuestionEditor(null, "create");
                      }}
                    >
                      + Add Question
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
                    {(createQuestions.filter(
                      (question) => question.role === "Annotator",
                    ).length > 0 ||
                      createQuestions.filter(
                        (question) => question.role === "Reviewer",
                      ).length === 0) && (
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
                          <span>Annotator</span>
                          <span>
                            {
                              createQuestions.filter(
                                (question) => question.role === "Annotator",
                              ).length
                            }
                          </span>
                        </div>
                        <div className="mt-2 min-h-[72px] rounded-md border border-dashed border-blue-200 p-3 text-xs text-blue-300">
                          {createQuestions.filter(
                            (question) => question.role === "Annotator",
                          ).length === 0 ? (
                            <div className="flex min-h-[48px] items-center justify-center">
                              No annotator questions yet
                            </div>
                          ) : (
                            <div className="space-y-2 text-blue-600">
                              {createQuestions
                                .filter(
                                  (question) => question.role === "Annotator",
                                )
                                .map((question) => (
                                  <div
                                    key={question.id}
                                    className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs text-blue-700"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-blue-700">
                                        {question.text}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openQuestionEditor(
                                              question,
                                              "create",
                                            )
                                          }
                                          className="text-[10px] font-semibold text-blue-500 hover:text-blue-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleQuestionDelete(
                                              question,
                                              "create",
                                            )
                                          }
                                          className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                      {question.required && (
                                        <span className="rounded-full border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                    {question.description && (
                                      <p className="mt-1 text-[11px] text-blue-500">
                                        {question.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {(createQuestions.filter(
                      (question) => question.role === "Reviewer",
                    ).length > 0 ||
                      createQuestions.filter(
                        (question) => question.role === "Annotator",
                      ).length === 0) && (
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-600">
                          <span>Reviewer</span>
                          <span>
                            {
                              createQuestions.filter(
                                (question) => question.role === "Reviewer",
                              ).length
                            }
                          </span>
                        </div>
                        <div className="mt-2 min-h-[72px] rounded-md border border-dashed border-purple-200 p-3 text-xs text-purple-300">
                          {createQuestions.filter(
                            (question) => question.role === "Reviewer",
                          ).length === 0 ? (
                            <div className="flex min-h-[48px] items-center justify-center">
                              No reviewer questions yet
                            </div>
                          ) : (
                            <div className="space-y-2 text-purple-600">
                              {createQuestions
                                .filter(
                                  (question) => question.role === "Reviewer",
                                )
                                .map((question) => (
                                  <div
                                    key={question.id}
                                    className="rounded-md border border-purple-100 bg-white px-3 py-2 text-xs text-purple-700"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-purple-700">
                                        {question.text}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openQuestionEditor(
                                              question,
                                              "create",
                                            )
                                          }
                                          className="text-[10px] font-semibold text-purple-500 hover:text-purple-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleQuestionDelete(
                                              question,
                                              "create",
                                            )
                                          }
                                          className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                      {question.required && (
                                        <span className="rounded-full border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                    {question.description && (
                                      <p className="mt-1 text-[11px] text-purple-500">
                                        {question.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    disabled={creatingLabel}
                    onClick={() => {
                      closeWithAnimation("createLabel", setIsCreateLabelOpen);
                      resetCreateLabelForm();
                    }}
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingLabel}
                    className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {creatingLabel ? (
                      "Creating..."
                    ) : (
                      <>
                        <span className="text-base leading-none">+</span>
                        Create label
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {isEditLabelOpen && activeLabel && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-3">
            <div
              className={`w-full max-w-4xl rounded-lg border border-gray-200 bg-white shadow-xl ${
                closingModals.editLabel ? "modal-pop-out" : "modal-pop"
              }`}
            >
              <div className="flex items-center justify-between border-b px-5 py-4">
                <h3 className="text-base font-semibold text-gray-900">
                  Edit label
                </h3>
                <button
                  type="button"
                  disabled={updatingLabel}
                  onClick={() =>
                    closeWithAnimation("editLabel", setIsEditLabelOpen)
                  }
                  className="text-gray-500 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <div className="max-h-[calc(90vh-72px)] space-y-5 overflow-y-auto px-5 py-5">
                <div className="rounded-lg border border-gray-200">
                  <div className="border-b px-4 py-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Label details
                    </h4>
                  </div>
                  <div className="space-y-4 px-4 py-4">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        value={editName}
                        onChange={(event) => setEditName(event.target.value)}
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Description
                      </label>
                      <textarea
                        value={editDescription}
                        onChange={(event) =>
                          setEditDescription(event.target.value)
                        }
                        className="min-h-[96px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Color
                      </label>
                      <div className="flex flex-wrap items-center gap-2">
                        {colorOptions.map((color) => (
                          <button
                            key={color}
                            type="button"
                            onClick={() => setEditSelectedColor(color)}
                            className={`h-6 w-6 rounded-full border ${
                              editColors[0] === color
                                ? "border-gray-900 ring-2 ring-gray-900/20"
                                : "border-gray-200"
                            }`}
                            style={{ backgroundColor: color }}
                            aria-pressed={editColors[0] === color}
                          />
                        ))}
                        <button
                          type="button"
                          onClick={() =>
                            setShowEditColorPicker((prev) => !prev)
                          }
                          className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {showEditColorPicker ? "Hide picker" : "More colors"}
                        </button>
                      </div>
                      {showEditColorPicker && (
                        <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 px-3 py-2">
                          <input
                            type="color"
                            value={editCustomColor}
                            onChange={(event) =>
                              setEditCustomColor(
                                getColorOrDefault(event.target.value),
                              )
                            }
                            className="h-8 w-11 cursor-pointer rounded border border-gray-300 bg-white p-1"
                          />
                          <span className="text-xs font-semibold text-gray-700">
                            {editCustomColor.toUpperCase()}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              addCustomColorOption(editCustomColor);
                              setEditSelectedColor(editCustomColor);
                            }}
                            className="rounded-md bg-gray-800 px-2 py-1 text-xs font-semibold text-white hover:bg-gray-900"
                          >
                            Use color
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Categories
                      </label>
                      {categoryOptions.length === 0 ? (
                        <p className="text-xs text-gray-400">
                          No categories yet.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {categoryOptions.map((category) => (
                            <button
                              key={category.id}
                              type="button"
                              onClick={() =>
                                toggleSelection(category.id, setEditCategories)
                              }
                              className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                                editCategories.includes(category.id)
                                  ? "border-gray-900 bg-gray-900 text-white"
                                  : "border-gray-200 bg-white text-gray-700"
                              }`}
                            >
                              {category.name}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between border-b px-4 py-3">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">
                        Checklist questions
                      </h4>
                      <p className="text-xs text-gray-500">
                        {editQuestions.length} questions total
                      </p>
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                      onClick={() => {
                        openQuestionEditor(null, "edit");
                      }}
                    >
                      + Add Question
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-4 px-4 py-4 sm:grid-cols-2">
                    {(editQuestions.filter(
                      (question) => question.role === "Annotator",
                    ).length > 0 ||
                      editQuestions.filter(
                        (question) => question.role === "Reviewer",
                      ).length === 0) && (
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-blue-600">
                          <span>Annotator</span>
                          <span>
                            {
                              editQuestions.filter(
                                (question) => question.role === "Annotator",
                              ).length
                            }
                          </span>
                        </div>
                        <div className="mt-2 min-h-[72px] rounded-md border border-dashed border-blue-200 p-3 text-xs text-blue-300">
                          {editQuestions.filter(
                            (question) => question.role === "Annotator",
                          ).length === 0 ? (
                            <div className="flex min-h-[48px] items-center justify-center">
                              No annotator questions yet
                            </div>
                          ) : (
                            <div className="space-y-2 text-blue-600">
                              {editQuestions
                                .filter(
                                  (question) => question.role === "Annotator",
                                )
                                .map((question) => (
                                  <div
                                    key={question.id}
                                    className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs text-blue-700"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-blue-700">
                                        {question.text}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openQuestionEditor(question, "edit")
                                          }
                                          className="text-[10px] font-semibold text-blue-500 hover:text-blue-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleQuestionDelete(
                                              question,
                                              "edit",
                                            )
                                          }
                                          className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                      {question.required && (
                                        <span className="rounded-full border border-blue-200 px-2 py-0.5 text-[10px] font-semibold text-blue-600">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                    {question.description && (
                                      <p className="mt-1 text-[11px] text-blue-500">
                                        {question.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {(editQuestions.filter(
                      (question) => question.role === "Reviewer",
                    ).length > 0 ||
                      editQuestions.filter(
                        (question) => question.role === "Annotator",
                      ).length === 0) && (
                      <div>
                        <div className="flex items-center justify-between text-xs font-semibold text-purple-600">
                          <span>Reviewer</span>
                          <span>
                            {
                              editQuestions.filter(
                                (question) => question.role === "Reviewer",
                              ).length
                            }
                          </span>
                        </div>
                        <div className="mt-2 min-h-[72px] rounded-md border border-dashed border-purple-200 p-3 text-xs text-purple-300">
                          {editQuestions.filter(
                            (question) => question.role === "Reviewer",
                          ).length === 0 ? (
                            <div className="flex min-h-[48px] items-center justify-center">
                              No reviewer questions yet
                            </div>
                          ) : (
                            <div className="space-y-2 text-purple-600">
                              {editQuestions
                                .filter(
                                  (question) => question.role === "Reviewer",
                                )
                                .map((question) => (
                                  <div
                                    key={question.id}
                                    className="rounded-md border border-purple-100 bg-white px-3 py-2 text-xs text-purple-700"
                                  >
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="font-semibold text-purple-700">
                                        {question.text}
                                      </span>
                                      <div className="flex items-center gap-2">
                                        <button
                                          type="button"
                                          onClick={() =>
                                            openQuestionEditor(question, "edit")
                                          }
                                          className="text-[10px] font-semibold text-purple-500 hover:text-purple-700"
                                        >
                                          Edit
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleQuestionDelete(
                                              question,
                                              "edit",
                                            )
                                          }
                                          className="text-[10px] font-semibold text-red-500 hover:text-red-600"
                                        >
                                          Delete
                                        </button>
                                      </div>
                                      {question.required && (
                                        <span className="rounded-full border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-600">
                                          Required
                                        </span>
                                      )}
                                    </div>
                                    {question.description && (
                                      <p className="mt-1 text-[11px] text-purple-500">
                                        {question.description}
                                      </p>
                                    )}
                                  </div>
                                ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    disabled={updatingLabel}
                    onClick={() =>
                      closeWithAnimation("editLabel", setIsEditLabelOpen)
                    }
                    className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={updatingLabel}
                    onClick={handleConfirmEdit}
                    className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {updatingLabel ? "Updating..." : "Confirm"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {isAddQuestionOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 px-4">
            <div
              className={`w-full max-w-sm rounded-lg border border-gray-200 bg-white shadow-xl ${
                closingModals.addQuestion ? "modal-pop-out" : "modal-pop"
              }`}
            >
              <div className="flex items-center justify-between border-b px-4 py-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  {questionMode === "edit" ? "Edit Question" : "Add Question"}
                </h3>
                <button
                  type="button"
                  onClick={() =>
                    closeWithAnimation("addQuestion", setIsAddQuestionOpen)
                  }
                  className="text-gray-400 hover:text-gray-600"
                  aria-label="Close"
                >
                  ✕
                </button>
              </div>
              <form
                onSubmit={handleQuestionSubmit}
                className="space-y-4 px-4 py-4"
              >
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Question <span className="text-red-500">*</span>
                  </label>
                  <input
                    value={questionText}
                    onChange={(event) => setQuestionText(event.target.value)}
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="e.g. Has the issue been escalated?"
                    required
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Description
                  </label>
                  <textarea
                    value={questionDescription}
                    onChange={(event) =>
                      setQuestionDescription(event.target.value)
                    }
                    className="min-h-[72px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                    placeholder="Optional details..."
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <label className="text-xs font-semibold text-gray-700">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={questionRole}
                    onChange={(event) =>
                      setQuestionRole(
                        event.target.value as "Annotator" | "Reviewer",
                      )
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="Annotator">Annotator</option>
                    <option value="Reviewer">Reviewer</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 text-xs font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    checked={isQuestionRequired}
                    onChange={(event) =>
                      setIsQuestionRequired(event.target.checked)
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  Required question
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      closeWithAnimation("addQuestion", setIsAddQuestionOpen)
                    }
                    className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white"
                  >
                    {questionMode === "edit" ? "Save changes" : "Add Question"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
