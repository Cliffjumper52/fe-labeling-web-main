import type { ProjectSnapshotListItem } from "../../../interface/project-snapshot/project-snapshot.interface";

type Props = {
  snapshots: ProjectSnapshotListItem[];
  loading: boolean;
  creating: boolean;
  deletingSnapshotId: string | null;
  snapshotName: string;
  snapshotDescription: string;
  onSnapshotNameChange: (value: string) => void;
  onSnapshotDescriptionChange: (value: string) => void;
  onCreateSnapshot: () => void;
  onDeleteSnapshot: (snapshotId: string) => void;
  onExportSnapshot: (snapshotId: string) => void;
};

const formatSnapshotDate = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value;
  }
  return parsed.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function ProjectEditSnapshots({
  snapshots,
  loading,
  creating,
  deletingSnapshotId,
  snapshotName,
  snapshotDescription,
  onSnapshotNameChange,
  onSnapshotDescriptionChange,
  onCreateSnapshot,
  onDeleteSnapshot,
  onExportSnapshot,
}: Props) {
  return (
    <div className="mt-4 rounded-md border border-gray-200 px-3 py-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Project snapshots
          </h3>
          <p className="text-xs text-gray-500">
            Save a versioned snapshot of the current project configuration.
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
        <div className="flex flex-col gap-1 md:col-span-1">
          <label className="text-xs font-semibold text-gray-700">
            Snapshot name
          </label>
          <input
            value={snapshotName}
            onChange={(event) => onSnapshotNameChange(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Release 2026-03-12"
          />
        </div>

        <div className="flex flex-col gap-1 md:col-span-2">
          <label className="text-xs font-semibold text-gray-700">
            Description (optional)
          </label>
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              value={snapshotDescription}
              onChange={(event) =>
                onSnapshotDescriptionChange(event.target.value)
              }
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm"
              placeholder="What changed in this version?"
            />
            <button
              type="button"
              onClick={onCreateSnapshot}
              disabled={creating}
              className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
            >
              {creating ? "Creating..." : "Create"}
            </button>
          </div>
        </div>
      </div>

      <div className="mt-3 rounded-md border border-gray-200 bg-gray-50 p-2">
        {loading ? (
          <div className="px-2 py-3 text-sm text-gray-500">
            Loading snapshots...
          </div>
        ) : snapshots.length === 0 ? (
          <div className="px-2 py-3 text-sm text-gray-500">
            No snapshots yet.
          </div>
        ) : (
          <div className="space-y-2">
            {snapshots.map((snapshot) => (
              <div
                key={snapshot.id}
                className="rounded-md border border-gray-200 bg-white px-3 py-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-gray-800">
                    {snapshot.name}
                  </p>
                  <span className="rounded bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                    {snapshot.version}
                  </span>
                </div>
                <p className="mt-1 text-xs text-gray-600">
                  {snapshot.description || "No description"}
                </p>
                <p className="mt-1 text-[11px] text-gray-500">
                  {snapshot.totalFiles} files •{" "}
                  {formatSnapshotDate(snapshot.createdAt)}
                </p>
                <div className="mt-2 flex flex-wrap justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onExportSnapshot(snapshot.id)}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                  >
                    Export
                  </button>
                  <button
                    type="button"
                    onClick={() => onDeleteSnapshot(snapshot.id)}
                    disabled={deletingSnapshotId === snapshot.id}
                    className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {deletingSnapshotId === snapshot.id
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
