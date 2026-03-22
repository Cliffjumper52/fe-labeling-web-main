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
    <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center sm:gap-3">
      <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm">
        Total: <span className="text-slate-900">{counts.total}</span>
      </div>
      <div className="rounded-xl border border-sky-200 bg-gradient-to-br from-sky-50 to-cyan-50 px-3 py-2 text-xs font-semibold text-sky-800 shadow-sm">
        In Progress: <span className="text-sky-900">{counts.inProgress}</span>
      </div>
      <div className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 px-3 py-2 text-xs font-semibold text-amber-800 shadow-sm">
        Pending: <span className="text-amber-900">{counts.pending}</span>
      </div>
      <div className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-pink-50 px-3 py-2 text-xs font-semibold text-rose-800 shadow-sm">
        Rejected: <span className="text-rose-900">{counts.rejected}</span>
      </div>
    </div>
  );
}
