import {
  useEffect,
  useMemo,
  useState,
  type Dispatch,
  type FormEvent,
  type SetStateAction,
} from "react";

type Label = {
  id: string;
  name: string;
  description?: string;
  type: "Bounding Box" | "Polygon" | "Classification";
  totalClasses: number;
  classes?: string[];
  createdAt: string;
};

type ManagerLabelsPageProps = {
  mode?: "manager" | "admin";
  initialLabels?: Label[];
};

const MANAGER_LABELS_STORAGE_KEY = "manager-label-sets";

const readManagerLabels = (): Label[] => {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = localStorage.getItem(MANAGER_LABELS_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as Label[];
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed;
  } catch {
    return [];
  }
};

export default function ManagerLabelsPage({
  mode = "manager",
  initialLabels,
}: ManagerLabelsPageProps) {
  const isAdmin = mode === "admin";
  const [labels, setLabels] = useState<Label[]>(() => {
    if (isAdmin) {
      return initialLabels ?? [];
    }

    const managerStored = readManagerLabels();
    if (managerStored.length > 0) {
      return managerStored;
    }

    return initialLabels ?? [];
  });
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
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailLabel, setDetailLabel] = useState<Label | null>(null);
  const [closingModals, setClosingModals] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    if (isAdmin || typeof window === "undefined") {
      return;
    }

    localStorage.setItem(MANAGER_LABELS_STORAGE_KEY, JSON.stringify(labels));
  }, [isAdmin, labels]);

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

  const resetCreateLabelForm = () => {
    setLabelName("");
    setLabelDescription("");
    setLabelType("Classification");
    setLabelClasses([]);
    setClassInput("");
    setClassError("");
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

  const handleCreateLabel = (event: FormEvent) => {
    event.preventDefault();
    if (labelClasses.length === 0) {
      setClassError("Please add at least one class.");
      return;
    }

    const now = new Date();
    const createdAt = now.toISOString().slice(0, 10);
    setLabels((prev) => [
      {
        id: crypto.randomUUID(),
        name: labelName.trim() || "Untitled Label",
        description: labelDescription.trim(),
        type: labelType,
        totalClasses: labelClasses.length,
        classes: labelClasses,
        createdAt,
      },
      ...prev,
    ]);
    setIsCreateLabelOpen(false);
    resetCreateLabelForm();
  };

  const handleOpenLabelEdit = (label: Label) => {
    setActiveLabel(label);
    setIsEditLabelOpen(true);
  };

  const handleOpenLabelDetails = (label: Label) => {
    setDetailLabel(label);
    setIsDetailOpen(true);
  };

  const handleDeleteLabel = (labelId: string) => {
    setLabels((prev) => prev.filter((label) => label.id !== labelId));
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

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Labels</h2>
        {!isAdmin && (
          <button
            type="button"
            onClick={() => {
              resetCreateLabelForm();
              setIsCreateLabelOpen(true);
            }}
            className="flex items-center gap-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
          >
            <span className="text-lg leading-none">+</span>
            New Label
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
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full text-sm outline-none placeholder:text-gray-400"
              placeholder="Search labels..."
            />
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Type</label>
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

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order by</label>
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

        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Order</label>
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
          <h3 className="text-lg font-semibold text-gray-800">No Labels Yet</h3>
          <p className="mt-1 text-sm text-gray-500">
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
              className="mt-5 flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
            >
              <span className="text-base leading-none">+</span>
              Create Label
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="grid grid-cols-[1.6fr_2fr_1fr_1fr_0.8fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
            <span>Name</span>
            <span>Description</span>
            <span>Category</span>
            <span>Date created</span>
            <span>Action</span>
          </div>

          {visibleLabels.map((label) => (
            <div
              key={label.id}
              className="grid grid-cols-[1.6fr_2fr_1fr_1fr_0.8fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
            >
              <div>
                <p className="font-medium text-gray-800">{label.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">
                  {label.description || "No description"}
                </p>
              </div>
              <div>
                <span className="rounded-md bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
                  {label.type}
                </span>
              </div>
              <span className="text-gray-700">{label.createdAt}</span>
              <div className="flex items-center gap-3 text-sm font-semibold">
                <button
                  type="button"
                  onClick={() => handleOpenLabelDetails(label)}
                  className="text-blue-600 hover:text-blue-700"
                >
                  Details
                </button>
                {isAdmin ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteLabel(label.id)}
                    className="text-red-500 hover:text-red-600"
                  >
                    Delete
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleOpenLabelEdit(label)}
                    className="text-blue-600 hover:text-blue-700"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))}

          {visibleLabels.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-gray-500">
              No labels found for current filters.
            </div>
          )}
        </div>
      )}

      {!isAdmin && isCreateLabelOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/30 px-4 py-6 sm:items-center">
          <div
            className={`w-full max-w-lg overflow-hidden rounded-lg border border-gray-300 bg-white shadow-xl ${
              closingModals.createLabel ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="flex items-center justify-between border-b px-4 py-3">
              <h3 className="text-sm font-semibold text-gray-800">Create new label</h3>
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
              className="max-h-[calc(90vh-64px)] space-y-4 overflow-y-auto p-4"
            >
              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">Label name</label>
                <input
                  value={labelName}
                  onChange={(event) => setLabelName(event.target.value)}
                  className="rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example name"
                  required
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
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

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-semibold text-gray-700">Total classes</label>
                  <input
                    value={labelClasses.length}
                    readOnly
                    title="Total classes"
                    className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-semibold text-gray-700">
                  Label description
                </label>
                <textarea
                  value={labelDescription}
                  onChange={(event) => setLabelDescription(event.target.value)}
                  className="min-h-[100px] rounded-md border border-gray-300 px-3 py-2 text-sm"
                  placeholder="Example description"
                />
              </div>

              <div className="rounded-md border border-gray-200 p-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700">Classes</span>
                  <span className="text-xs text-gray-500">{labelClasses.length} added</span>
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
                      <span className="text-xs text-gray-500">No classes yet.</span>
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

              <div className="rounded-md border border-blue-100 bg-blue-50 px-3 py-2 text-xs text-blue-700">
                You can edit classes and guideline details after creating this label.
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
                  New Label
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
            className={`w-full max-w-xl rounded-md border border-gray-300 bg-white shadow-xl ${
              closingModals.editLabel ? "modal-pop-out" : "modal-pop"
            }`}
          >
            <div className="relative flex items-center justify-between border-b px-3 py-2">
              <button
                type="button"
                onClick={() => closeWithAnimation("editLabel", setIsEditLabelOpen)}
                className="rounded-md border border-gray-300 px-2 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-100"
              >
                ← Go back
              </button>
              <h3 className="absolute left-1/2 -translate-x-1/2 text-sm font-semibold text-gray-800">
                Edit label
              </h3>
              <button
                type="button"
                onClick={() => closeWithAnimation("editLabel", setIsEditLabelOpen)}
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
                      {activeLabel.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500">
                      {activeLabel.description || "Example Label Configuration"}
                    </p>
                  </div>
                  <span className="rounded-md bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-600">
                    {activeLabel.type}
                  </span>
                </div>
              </div>

              <div className="mt-2 flex flex-col gap-2">
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
                        <circle cx="12" cy="12" r="9" />
                        <path d="M8 12h8" />
                      </svg>
                      Classes ({activeLabel.totalClasses})
                    </div>
                    <button
                      type="button"
                      className="rounded-md bg-blue-600 px-3 py-1 text-xs font-semibold text-white"
                    >
                      Add class
                    </button>
                  </div>
                  <div className="flex min-h-[44px] items-center justify-center text-sm text-gray-400">
                    No class added
                  </div>
                </div>

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
                        <path d="M20 12v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h7" />
                        <path d="M16 3h5v5" />
                        <path d="M16 8 21 3" />
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
                  onClick={() => closeWithAnimation("editLabel", setIsEditLabelOpen)}
                  className="rounded-md bg-red-500 px-3 py-2 text-sm font-semibold text-white"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="rounded-md bg-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
                >
                  Save as draft
                </button>
                <button
                  type="button"
                  className="rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white"
                >
                  Confirm
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
