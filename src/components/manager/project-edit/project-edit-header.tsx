type Props = {
  status: "Drafting" | "Active" | "Archived" | "Completed";
  createdAtLabel: string;
  onBackToProjects: () => void;
};

export default function ProjectEditHeader({
  status,
  createdAtLabel,
  onBackToProjects,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <button
          type="button"
          onClick={onBackToProjects}
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
          {status}
        </span>
        <span className="rounded-md bg-amber-50 px-3 py-1 text-sm font-semibold text-amber-800 shadow-sm ring-1 ring-amber-200">
          Created {createdAtLabel}
        </span>
      </div>
    </div>
  );
}
