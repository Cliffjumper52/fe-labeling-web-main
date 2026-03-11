type TaskCounts = {
  total: number;
  inProgress: number;
  pending: number;
  rejected: number;
};

type Props = {
  counts: TaskCounts;
};

export default function TaskStatsBar({ counts }: Props) {
  return (
    <div className="flex items-center gap-3">
      <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-600">
        Total: {counts.total}
      </div>
      <div className="rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700">
        In Progress: {counts.inProgress}
      </div>
      <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
        Pending: {counts.pending}
      </div>
      <div className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
        Rejected: {counts.rejected}
      </div>
    </div>
  );
}
