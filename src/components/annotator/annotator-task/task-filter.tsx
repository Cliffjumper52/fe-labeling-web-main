import type { ProjectTask } from "../../../interface";
import { ProjectTaskPriorityEnums } from "../../../interface/project-task/enums/task-priority.enums";
import { ProjectTaskStatus } from "../../../interface/project-task/enums/task-status.enums";

type Props = {
  search: string;
  statusFilter: ProjectTask["status"] | "All";
  priorityFilter: ProjectTask["priority"] | "All";
  onSearchChange: (value: string) => void;
  onStatusChange: (value: ProjectTask["status"] | "All") => void;
  onPriorityChange: (value: ProjectTask["priority"] | "All") => void;
};

export default function TaskFilters({
  search,
  statusFilter,
  priorityFilter,
  onSearchChange,
  onStatusChange,
  onPriorityChange,
}: Props) {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.7fr_1fr_1fr]">
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full text-sm outline-none placeholder:text-gray-400"
            placeholder="Search by project or task ID..."
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-700">Status</label>
        <select
          value={statusFilter}
          onChange={(e) =>
            onStatusChange(e.target.value as ProjectTask["status"] | "All")
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="All">All</option>
          <option value={ProjectTaskStatus.ASSIGNED}>Assigned</option>
          <option value={ProjectTaskStatus.IN_PROGRESS}>In Progress</option>
          <option value={ProjectTaskStatus.PENDING_REVIEW}>
            Pending Review
          </option>
          <option value={ProjectTaskStatus.APPROVED}>Approved</option>
          <option value={ProjectTaskStatus.REJECTED}>Rejected</option>
          <option value={ProjectTaskStatus.DONE}>Done</option>
        </select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-gray-700">Priority</label>
        <select
          value={priorityFilter}
          onChange={(e) =>
            onPriorityChange(e.target.value as ProjectTask["priority"] | "All")
          }
          className="rounded-md border border-gray-300 bg-white px-3 py-2 text-sm shadow-sm"
        >
          <option value="All">All</option>
          <option value={ProjectTaskPriorityEnums.HIGH}>High</option>
          <option value={ProjectTaskPriorityEnums.MEDIUM}>Medium</option>
          <option value={ProjectTaskPriorityEnums.LOW}>Low</option>
        </select>
      </div>
    </div>
  );
}
