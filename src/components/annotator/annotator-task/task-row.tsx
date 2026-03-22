import { Link } from "react-router-dom";
import type { ProjectTask } from "../../../interface";
import { ProjectTaskPriorityEnums } from "../../../interface/project-task/enums/task-priority.enums";
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
    case ProjectTaskPriorityEnums.HIGH:
      return "High";
    case ProjectTaskPriorityEnums.MEDIUM:
      return "Medium";
    case ProjectTaskPriorityEnums.LOW:
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

type Props = {
  task: ProjectTask;
  onAccept: (taskId: string) => void;
  acceptingTaskId: string | null;
};

export default function TaskRow({ task, onAccept, acceptingTaskId }: Props) {
  return (
    <div className="grid grid-cols-[1.4fr_1fr_0.9fr_1fr_1.2fr] items-center gap-2 border-b border-slate-100 px-4 py-3 text-sm transition-colors hover:bg-slate-50/60 last:border-b-0">
      <div>
        <p className="font-semibold text-slate-900">
          {getProjectDisplayName(task)}
        </p>
        <p className="text-xs text-slate-500">Task ID: {task.id}</p>
        <p className="text-xs text-slate-500">
          Files assigned: {task.fileIds.length}
        </p>
      </div>

      <div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            task.status === ProjectTaskStatus.IN_PROGRESS
              ? "bg-sky-100 text-sky-700"
              : task.status === ProjectTaskStatus.PENDING_REVIEW
                ? "bg-amber-100 text-amber-700"
                : task.status === ProjectTaskStatus.REJECTED
                  ? "bg-rose-100 text-rose-700"
                  : task.status === ProjectTaskStatus.APPROVED ||
                      task.status === ProjectTaskStatus.DONE
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-700"
          }`}
        >
          {formatStatus(task.status)}
        </span>
      </div>

      <div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            task.priority === ProjectTaskPriorityEnums.HIGH
              ? "bg-rose-100 text-rose-700"
              : task.priority === ProjectTaskPriorityEnums.MEDIUM
                ? "bg-gray-100 text-gray-700"
                : "bg-slate-100 text-slate-600"
          }`}
        >
          {formatPriority(task.priority)}
        </span>
      </div>

      <div>
        <p className="text-sm text-slate-700">{formatDate(task.createdAt)}</p>
        <p className="text-xs text-slate-500">
          Updated: {formatDate(task.updatedAt)}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3 text-sm font-semibold">
        {task.status === ProjectTaskStatus.ASSIGNED ? (
          <button
            onClick={() => onAccept(task.id)}
            disabled={acceptingTaskId !== null}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-sky-600 to-blue-600 px-3 py-1.5 text-white shadow-sm transition-all hover:-translate-y-[1px] hover:from-sky-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {acceptingTaskId === task.id ? (
              <>
                <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
                  <path d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" fill="currentColor" className="opacity-75" />
                </svg>
                Accepting...
              </>
            ) : (
              "Accept Task"
            )}
          </button>
        ) : (
          <Link
            to={`/annotator/workspace/${task.id}`}
            className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sky-700 shadow-sm transition-all hover:-translate-y-[1px] hover:border-sky-300 hover:bg-sky-50"
          >
            Open
          </Link>
        )}
      </div>
    </div>
  );
}
