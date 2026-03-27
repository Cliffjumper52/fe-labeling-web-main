import type {
  ManagerProjectOrder,
  ManagerProjectOrderBy,
  ManagerProjectStatusFilter,
} from "../../../interface/project/manager-projects.interface";

type Props = {
  projectSearch: string;
  onProjectSearchChange: (value: string) => void;
  projectStatusFilter: ManagerProjectStatusFilter;
  onProjectStatusFilterChange: (value: ManagerProjectStatusFilter) => void;
  projectOrderBy: ManagerProjectOrderBy;
  onProjectOrderByChange: (value: ManagerProjectOrderBy) => void;
  projectOrder: ManagerProjectOrder;
  onProjectOrderChange: (value: ManagerProjectOrder) => void;
};

export default function ProjectFilters({
  projectSearch,
  onProjectSearchChange,
  projectStatusFilter,
  onProjectStatusFilterChange,
  projectOrderBy,
  onProjectOrderByChange,
  projectOrder,
  onProjectOrderChange,
}: Props) {
  return (
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
            value={projectSearch}
            onChange={(event) => onProjectSearchChange(event.target.value)}
            className="w-full text-sm outline-none placeholder:text-gray-400"
            placeholder="Search projects..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-700">Status</label>
        <select
          title="Filter project status"
          value={projectStatusFilter}
          onChange={(event) =>
            onProjectStatusFilterChange(
              event.target.value as ManagerProjectStatusFilter,
            )
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="all">All</option>
          <option value="draft">Drafting</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-700">Order by</label>
        <select
          title="Order projects by"
          value={projectOrderBy}
          onChange={(event) =>
            onProjectOrderByChange(event.target.value as ManagerProjectOrderBy)
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="name">Name</option>
          <option value="createdAt">Date created</option>
          <option value="updatedAt">Updated</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-700">Order</label>
        <select
          title="Project sort order"
          value={projectOrder}
          onChange={(event) =>
            onProjectOrderChange(event.target.value as ManagerProjectOrder)
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="ASC">Ascending</option>
          <option value="DESC">Descending</option>
        </select>
      </div>
    </div>
  );
}
