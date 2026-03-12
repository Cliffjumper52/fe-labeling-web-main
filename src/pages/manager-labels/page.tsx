import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";
import { toast } from "sonner";
import {
  createAdminLabel,
  deleteAdminLabel,
  fetchAdminLabels,
  hasBackendConfig,
  updateAdminLabel,
} from "../../services/admin-service";

type Label = {
  id: string;
  name: string;
  description?: string;
  type: "Bounding Box" | "Polygon" | "Classification";
  totalClasses: number;
  classes?: string[];
  questions?: ChecklistQuestion[];
  createdAt: string;
};

type ChecklistQuestion = {
  id: string;
  text: string;
  description?: string;
  role: "Annotator" | "Reviewer";
  required: boolean;
};

type ManagerLabelsPageProps = {
  mode?: "manager" | "admin";
  initialLabels?: Label[];
};

export default function ManagerLabelsPage({
  mode = "manager",
  initialLabels,
}: ManagerLabelsPageProps) {
  const isAdmin = mode === "admin";
  const shouldUseAdminApi = isAdmin && hasBackendConfig();
  const [labels, setLabels] = useState<Label[]>(() => {
    return initialLabels ?? [];
  });
  const [isLoading, setIsLoading] = useState(false);
  const hasLabels = labels.length > 0;
  const [isCreateLabelOpen, setIsCreateLabelOpen] = useState(false);
  const [labelName, setLabelName] = useState("");
  const [labelDescription, setLabelDescription] = useState("");
  const [labelType, setLabelType] = useState<Label["type"]>("Classification");
  const [labelClasses, setLabelClasses] = useState<string[]>([]);
  const [classInput, setClassInput] = useState("");
  const [classError, setClassError] = useState("");
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<Label["type"] | "All">("All");
  const [orderBy, setOrderBy] = useState<"Name" | "Date created">("Date created");
  const [order, setOrder] = useState<"Ascending" | "Descending">("Descending");
  const [isEditLabelOpen, setIsEditLabelOpen] = useState(false);
  const [activeLabel, setActiveLabel] = useState<Label | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editType, setEditType] = useState<Label["type"]>("Classification");
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLabel, setDetailLabel] = useState<Label | null>(null);
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
  const [createQuestions, setCreateQuestions] = useState<ChecklistQuestion[]>(
    [],
  );
  const [editQuestions, setEditQuestions] = useState<ChecklistQuestion[]>([]);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (isAdmin) {
      return;
    }
  }, [isAdmin, labels]);

  useEffect(() => {
    if (!shouldUseAdminApi) {
      return;
    }

    let mounted = true;
    setIsLoading(true);

    const loadLabels = async () => {
      try {
        const remoteLabels = await fetchAdminLabels();
        if (mounted) {
          setLabels(remoteLabels as Label[]);
        }
      } catch {
        if (mounted) {
          toast.error("Failed to load labels from API.");
        }
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    void loadLabels();

    return () => {
      mounted = false;
    };
  }, [shouldUseAdminApi]);

  const visibleLabels = useMemo(() => {
    const filtered = labels.filter((label) => {
      const bySearch =
        label.name.toLowerCase().includes(search.toLowerCase()) ||
        (label.description ?? "").toLowerCase().includes(search.toLowerCase());
      const byType = typeFilter === "All" || label.type === typeFilter;
      return bySearch && byType;
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
  }, [labels, order, orderBy, search, typeFilter]);

  const labelStats = useMemo(() => {
    return labels.reduce(
      (acc, label) => {
        acc.total += 1;
        const questions = label.questions ?? [];
        if (questions.length > 0) {
          acc.withQuestions += 1;
        }
        for (const question of questions) {
          if (question.role === "Annotator") {
            acc.annotator += 1;
          } else {
            acc.reviewer += 1;
          }
        }
        return acc;
      },
      { total: 0, withQuestions: 0, annotator: 0, reviewer: 0 },
    );
  }, [labels]);


  const resetCreateLabelForm = () => {
    setLabelName("");
    setLabelDescription("");
    setLabelType("Classification");
    setLabelClasses([]);
    setClassInput("");
    setClassError("");
    setCreateQuestions([]);
  };

  const handleAddClass = () => {
    const normalizedClass = classInput.trim();
    if (!normalizedClass) {
      return;
    }

    const exists = labelClasses.some(
      (existingClass) => existingClass.toLowerCase() === normalizedClass.toLowerCase(),
    );

    if (exists) {
      setClassError("Class already exists.");
      return;
    }

    setLabelClasses((prev) => [...prev, normalizedClass]);
    setClassInput("");
    setClassError("");
  };

  const handleRemoveClass = (className: string) => {
    setLabelClasses((prev) => prev.filter((item) => item !== className));
  };

  const handleCreateLabel = async (event: FormEvent) => {
    event.preventDefault();
    if (labelClasses.length === 0) {
      setClassError("Please add at least one class.");
      return;
    }

    const now = new Date();
    const createdAt = now.toISOString().slice(0, 10);
    try {
      if (shouldUseAdminApi) {
        const created = await createAdminLabel({
          name: labelName.trim() || "Untitled Label",
          description: labelDescription.trim(),
          type: labelType,
          classes: labelClasses,
        });
        setLabels((prev) => [
          {
            ...(created as Label),
            type: labelType,
            classes: labelClasses,
            totalClasses: labelClasses.length,
            questions: createQuestions,
          },
          ...prev,
        ]);
      } else {
        setLabels((prev) => [
          {
            id: crypto.randomUUID(),
            name: labelName.trim() || "Untitled Label",
            description: labelDescription.trim(),
            type: labelType,
            totalClasses: labelClasses.length,
            classes: labelClasses,
            questions: createQuestions,
            createdAt,
          },
          ...prev,
        ]);
      }
      toast.success("Label created.");
    } catch {
      toast.error("Create label failed.");
      return;
    }

    setIsCreateLabelOpen(false);
    resetCreateLabelForm();
  };

  const handleOpenLabelEdit = (label: Label) => {
    setActiveLabel(label);
    setEditName(label.name);
    setEditDescription(label.description ?? "");
    setEditType(label.type);
    setEditQuestions(label.questions ?? []);
    setIsEditLabelOpen(true);
  };

  const handleOpenLabelDetails = (label: Label) => {
    setDetailLabel(label);
    setIsDetailOpen(true);
  };

  const handleDeleteLabel = async (labelId: string) => {
    try {
      if (shouldUseAdminApi) {
        await deleteAdminLabel(labelId);
      }
      setLabels((prev) => prev.filter((label) => label.id !== labelId));
      toast.success("Label deleted.");
    } catch {
      toast.error("Delete label failed.");
    }
  };

  const handleConfirmEdit = async () => {
    if (!activeLabel) {
      return;
    }

    const nextName = editName.trim() || activeLabel.name;
    const nextDescription = editDescription.trim();
    const nextLabel: Label = {
      ...activeLabel,
      name: nextName,
      description: nextDescription,
      type: editType,
      questions: editQuestions,
    };

    try {
      if (shouldUseAdminApi) {
        const updated = await updateAdminLabel(activeLabel.id, {
          name: nextName,
          description: nextDescription,
          type: editType,
          classes: nextLabel.classes,
        });
        const normalizedUpdated = {
          ...(updated as Label),
          type: editType,
          classes: nextLabel.classes,
          questions: editQuestions,
          totalClasses: (nextLabel.classes ?? []).length,
        };
        setLabels((prev) =>
          prev.map((label) =>
            label.id === activeLabel.id ? normalizedUpdated : label,
          ),
        );
        setActiveLabel(normalizedUpdated);
      } else {
        setLabels((prev) =>
          prev.map((label) => (label.id === activeLabel.id ? nextLabel : label)),
        );
        setActiveLabel(nextLabel);
      }
      toast.success("Label updated.");
    } catch {
      toast.error("Update label failed.");
      return;
    }

    closeWithAnimation("editLabel", setIsEditLabelOpen);
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

  const handleAddQuestionSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextQuestion: ChecklistQuestion = {
      id: crypto.randomUUID(),
      text: questionText.trim(),
      description: questionDescription.trim(),
      role: questionRole,
      required: isQuestionRequired,
    };

    if (questionTarget === "create") {
      setCreateQuestions((prev) => [nextQuestion, ...prev]);
    } else {
      setEditQuestions((prev) => [nextQuestion, ...prev]);
    }

    setIsAddQuestionOpen(false);
    resetQuestionForm();
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-2xl font-semibold text-gray-800">Labels</h2>
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
        </div>

        <div className="h-px w-full bg-gray-200" />

        {isLoading && (
          <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-700">
            Loading labels from API...
          </div>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
              Total labels
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {labelStats.total}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
              With questions
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {labelStats.withQuestions}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
              Annotator qs
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {labelStats.annotator}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-gray-500">
              Reviewer qs
            </p>
            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {labelStats.reviewer}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Search</label>
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
            <label className="text-sm font-semibold text-gray-700">Type</label>
            <select
              title="Filter label type"
              value={typeFilter}
              onChange={(event) =>
                setTypeFilter(event.target.value as Label["type"] | "All")
              }
              className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
            >
              <option value="All">All</option>
              <option value="Classification">Classification</option>
              <option value="Bounding Box">Bounding Box</option>
              <option value="Polygon">Polygon</option>
            </select>
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-sm font-semibold text-gray-700">Order by</label>
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

        {!hasLabels ? (
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
            <h3 className="text-lg font-semibold text-gray-800">No labels yet</h3>
            <p className="mt-2 text-sm text-gray-500">
              {isAdmin
                ? "No labels are available right now."
                : "Create your first label configuration for upcoming projects"}
            </p>
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
          </div>
        ) : (
          <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
            <div className="grid grid-cols-[1.4fr_2fr_1.2fr_1fr_1fr_1fr_0.9fr] items-center gap-2 border-b border-gray-200 px-5 py-4 text-xs font-semibold uppercase text-gray-600">
              <span>Label</span>
              <span>Description</span>
              <span>Categories</span>
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
                <div>
                  <p className="font-semibold text-gray-900">{label.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">
                    {label.description || "No description"}
                  </p>
                </div>
                <div>
                  <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                    {label.type}
                  </span>
                </div>
                <div>
                  <span className="rounded-md bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700">
                    1 Reviewer
                  </span>
                </div>
                <span className="text-sm text-gray-600">{label.createdAt}</span>
                <span className="text-sm text-gray-600">{label.createdAt}</span>
                <div className="flex items-center gap-3 text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => handleOpenLabelDetails(label)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Details
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenLabelEdit(label)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLabel(label.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
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
      </div>

      {isCreateLabelOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 sm:items-center">
          <div
            className={`w-full max-w-4xl overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl ${
              closingModals.createLabel ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-5 py-4">
              <h3 className="text-base font-semibold text-gray-900">Create label</h3>
              <button
                type="button"
                onClick={() => {
                  closeWithAnimation("createLabel", setIsCreateLabelOpen);
                  resetCreateLabelForm();
                }}
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

            <form
              onSubmit={handleCreateLabel}
              className="max-h-[calc(90vh-72px)] space-y-5 overflow-y-auto px-5 py-5"
            >
              <div className="rounded-lg border border-gray-200">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-semibold text-gray-900">Label details</h4>
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
                    <label className="text-xs font-semibold text-gray-700">Description</label>
                    <textarea
                      value={labelDescription}
                      onChange={(event) => setLabelDescription(event.target.value)}
                      className="min-h-[96px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                      placeholder="Example description"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Color</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {["#f05252", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#111827"].map(
                        (color) => (
                          <span
                            key={color}
                            className="h-6 w-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {(["Classification", "Bounding Box", "Polygon"] as const).map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setLabelType(type)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold transition ${
                              labelType === type
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-700 hover:border-gray-300"
                            }`}
                          >
                            {type}
                          </button>
                        ),
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">Label type</label>
                      <select
                        title="Label type"
                        value={labelType}
                        onChange={(event) =>
                          setLabelType(event.target.value as Label["type"])
                        }
                        className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                      >
                        <option value="Classification">Classification</option>
                        <option value="Bounding Box">Bounding Box</option>
                        <option value="Polygon">Polygon</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-semibold text-gray-700">
                        Total classes
                      </label>
                      <input
                        value={labelClasses.length}
                        readOnly
                        title="Total classes"
                        className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                      />
                    </div>
                  </div>

                  <div className="rounded-md border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-700">Classes</span>
                      <span className="text-xs text-gray-500">
                        {labelClasses.length} added
                      </span>
                    </div>
                    <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
                      <input
                        value={classInput}
                        onChange={(event) => {
                          setClassInput(event.target.value);
                          if (classError) {
                            setClassError("");
                          }
                        }}
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            event.preventDefault();
                            handleAddClass();
                          }
                        }}
                        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm"
                        placeholder="Add class name..."
                      />
                      <button
                        type="button"
                        onClick={handleAddClass}
                        className="rounded-md border border-blue-300 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 hover:bg-blue-100 sm:min-w-[100px]"
                      >
                        Add class
                      </button>
                    </div>

                    {classError && (
                      <p className="mt-2 text-xs text-red-600">{classError}</p>
                    )}

                    <div className="mt-2 max-h-28 overflow-y-auto pr-1">
                      <div className="flex flex-wrap gap-2">
                        {labelClasses.length === 0 ? (
                          <span className="text-xs text-gray-500">
                            No classes yet.
                          </span>
                        ) : (
                          labelClasses.map((className) => (
                            <span
                              key={className}
                              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                            >
                              {className}
                              <button
                                type="button"
                                onClick={() => handleRemoveClass(className)}
                                className="text-red-500 hover:text-red-600"
                                aria-label={`Remove class ${className}`}
                              >
                                ✕
                              </button>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Checklist questions
                    </h4>
                    <p className="text-xs text-gray-500">0 questions total</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() => {
                      resetQuestionForm();
                      setQuestionTarget("create");
                      setIsAddQuestionOpen(true);
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
                              .filter((question) => question.role === "Annotator")
                              .map((question) => (
                                <div
                                  key={question.id}
                                  className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs text-blue-700"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-blue-700">
                                      {question.text}
                                    </span>
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
                              .filter((question) => question.role === "Reviewer")
                              .map((question) => (
                                <div
                                  key={question.id}
                                  className="rounded-md border border-purple-100 bg-white px-3 py-2 text-xs text-purple-700"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-purple-700">
                                      {question.text}
                                    </span>
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
                  onClick={() => {
                    closeWithAnimation("createLabel", setIsCreateLabelOpen);
                    resetCreateLabelForm();
                  }}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
                >
                  <span className="text-base leading-none">+</span>
                  Create label
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isDetailOpen && detailLabel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4">
          <div
            className={`w-full max-w-lg rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.labelDetails ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">Label details</h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("labelDetails", setIsDetailOpen)}
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
                      {detailLabel.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {detailLabel.description || "No description provided"}
                    </p>
                  </div>
                  <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {detailLabel.type}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">
                    Total classes
                  </p>
                  <p className="mt-2 text-sm text-gray-800">
                    {detailLabel.totalClasses}
                  </p>
                </div>
                <div className="rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">Date created</p>
                  <p className="mt-2 text-sm text-gray-800">
                    {detailLabel.createdAt}
                  </p>
                </div>
              </div>

              {detailLabel.classes && detailLabel.classes.length > 0 && (
                <div className="mt-3 rounded-md border border-gray-200 p-3">
                  <p className="text-xs font-semibold text-gray-700">Classes</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {detailLabel.classes.map((className) => (
                      <span
                        key={className}
                        className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
                      >
                        {className}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
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
              <h3 className="text-base font-semibold text-gray-900">Edit label</h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("editLabel", setIsEditLabelOpen)}
                className="text-gray-500 hover:text-gray-700"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <div className="max-h-[calc(90vh-72px)] space-y-5 overflow-y-auto px-5 py-5">
              <div className="rounded-lg border border-gray-200">
                <div className="border-b px-4 py-3">
                  <h4 className="text-sm font-semibold text-gray-900">Label details</h4>
                </div>
                <div className="space-y-4 px-4 py-4">
                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">
                      Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      value={editName}
                      onChange={(event) => setEditName(event.target.value)}
                      title="Edit label name"
                      placeholder="Label name"
                      className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Description</label>
                    <textarea
                      value={editDescription}
                      onChange={(event) => setEditDescription(event.target.value)}
                      title="Edit label description"
                      placeholder="Label description"
                      className="min-h-[96px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Color</label>
                    <div className="flex flex-wrap items-center gap-2">
                      {["#f05252", "#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#ec4899", "#6b7280", "#111827"].map(
                        (color) => (
                          <span
                            key={color}
                            className="h-6 w-6 rounded-full border border-gray-200"
                            style={{ backgroundColor: color }}
                          />
                        ),
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-xs font-semibold text-gray-700">Categories</label>
                    <div className="flex flex-wrap gap-2">
                      {(["Classification", "Bounding Box", "Polygon"] as const).map(
                        (type) => (
                          <button
                            key={type}
                            type="button"
                            onClick={() => setEditType(type)}
                            className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                              editType === type
                                ? "border-gray-900 bg-gray-900 text-white"
                                : "border-gray-200 bg-white text-gray-700"
                            }`}
                          >
                            {type}
                          </button>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border border-gray-200">
                <div className="flex items-center justify-between border-b px-4 py-3">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      Checklist questions
                    </h4>
                    <p className="text-xs text-gray-500">0 questions total</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white"
                    onClick={() => {
                      resetQuestionForm();
                      setQuestionTarget("edit");
                      setIsAddQuestionOpen(true);
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
                              .filter((question) => question.role === "Annotator")
                              .map((question) => (
                                <div
                                  key={question.id}
                                  className="rounded-md border border-blue-100 bg-white px-3 py-2 text-xs text-blue-700"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-blue-700">
                                      {question.text}
                                    </span>
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
                              .filter((question) => question.role === "Reviewer")
                              .map((question) => (
                                <div
                                  key={question.id}
                                  className="rounded-md border border-purple-100 bg-white px-3 py-2 text-xs text-purple-700"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-semibold text-purple-700">
                                      {question.text}
                                    </span>
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
                  onClick={() => closeWithAnimation("editLabel", setIsEditLabelOpen)}
                  className="rounded-md border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-gray-200 px-4 py-2 text-sm font-semibold text-gray-700"
                >
                  Save as draft
                </button>
                <button
                  type="button"
                  onClick={handleConfirmEdit}
                  className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
                >
                  Confirm
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
              <h3 className="text-sm font-semibold text-gray-900">Add Question</h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("addQuestion", setIsAddQuestionOpen)}
                className="text-gray-400 hover:text-gray-600"
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddQuestionSubmit} className="space-y-4 px-4 py-4">
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
                <label className="text-xs font-semibold text-gray-700">Description</label>
                <textarea
                  value={questionDescription}
                  onChange={(event) => setQuestionDescription(event.target.value)}
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
                    setQuestionRole(event.target.value as "Annotator" | "Reviewer")
                  }
                  title="Question role"
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
                  onChange={(event) => setIsQuestionRequired(event.target.checked)}
                  className="h-4 w-4 rounded border-gray-300"
                />
                Required question
              </label>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => closeWithAnimation("addQuestion", setIsAddQuestionOpen)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-md bg-gray-700 px-3 py-2 text-sm font-semibold text-white"
                >
                  Add Question
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
