import { Link } from "react-router-dom";
import type { ProjectTask } from "../../../interface";
import { ProjectTaskStatus } from "../../../interface/project-task/enums/task-status.enums";

const getProjectDisplayName = (task: ProjectTask): string => {
  const project = task.project as { id?: string; name?: string } | undefined;
  if (typeof project?.name === "string" && project.name.trim()) {
    return project.name;
  }
  const fallbackId =
    (typeof project?.id === "string" && project.id) || task.projectId;
  return `Project ${fallbackId.slice(0, 8)}`;
};

const formatStatus = (status: ProjectTask["status"]): string => {
  switch (status) {
    case ProjectTaskStatus.ASSIGNED:
      return "Assigned";
    case ProjectTaskStatus.IN_PROGRESS:
      return "In Progress";
    case ProjectTaskStatus.PENDING_REVIEW:
      return "Pending Review";
    case ProjectTaskStatus.APPROVED:
      return "Approved";
    case ProjectTaskStatus.REJECTED:
      return "Rejected";
    case ProjectTaskStatus.DONE:
      return "Done";
    default:
      return status;
  }
};

const formatPriority = (priority: ProjectTask["priority"]): string => {
  switch (priority) {
    case "high":
      return "High";
    case "medium":
      return "Medium";
    case "low":
      return "Low";
    default:
      return priority;
  }
};

const formatDate = (value: string | null): string => {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return date.toLocaleDateString();
};

const getStatusBadgeClasses = (status: ProjectTask["status"]): string => {
  switch (status) {
    case ProjectTaskStatus.ASSIGNED:
      return "bg-gray-100 text-gray-700";
    case ProjectTaskStatus.IN_PROGRESS:
      return "bg-blue-100 text-blue-700";
    case ProjectTaskStatus.PENDING_REVIEW:
      return "bg-amber-100 text-amber-700";
    case ProjectTaskStatus.APPROVED:
    case ProjectTaskStatus.DONE:
      return "bg-emerald-100 text-emerald-700";
    case ProjectTaskStatus.REJECTED:
      return "bg-rose-100 text-rose-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

const getPriorityBadgeClasses = (priority: ProjectTask["priority"]): string => {
  switch (priority) {
    case "high":
      return "bg-rose-100 text-rose-700";
    case "medium":
      return "bg-gray-100 text-gray-700";
    case "low":
      return "bg-slate-100 text-slate-600";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

type Props = {
  task: ProjectTask;
  onAccept: (taskId: string) => void;
};

export default function ReviewerTaskRow({ task, onAccept }: Props) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.9fr_1fr_1.2fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0">
      <div>
        <p className="font-medium text-gray-800">
          {getProjectDisplayName(task)}
        </p>
        <p className="text-xs text-gray-500">Task ID: {task.id}</p>
        <p className="text-xs text-gray-500">
          Files assigned: {task.fileIds.length}
        </p>
      </div>

      <div>
        <span
          className={`rounded-md px-3 py-1 text-xs font-semibold ${getStatusBadgeClasses(task.status)}`}
        >
          {formatStatus(task.status)}
        </span>
      </div>

      <div>
        <span
          className={`rounded-md px-3 py-1 text-xs font-semibold ${getPriorityBadgeClasses(task.priority)}`}
        >
          {formatPriority(task.priority)}
        </span>
      </div>

      <div>
        <p className="text-sm text-gray-700">{formatDate(task.createdAt)}</p>
        <p className="text-xs text-gray-500">
          Updated: {formatDate(task.updatedAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        {task.status === ProjectTaskStatus.ASSIGNED ? (
          <button
            onClick={() => onAccept(task.id)}
            className="rounded-md bg-blue-600 px-3 py-1 text-white hover:bg-blue-700"
          >
            Accept Task
          </button>
        ) : (
          <Link
            to={`/reviewer/workspace/${task.id}`}
            className="rounded-md bg-blue-100 px-3 py-1 text-blue-600 hover:text-blue-700"
          >
            Inspect
          </Link>
        )}
      </div>
    </div>
  );
}
