import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context.context";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { ProjectTask } from "../../interface/project-task/project-task.interface";
import type { Project } from "../../interface/project/project.interface";
import { ProjectTaskStatus } from "../../interface/project-task/enums/task-status.enums";
import {
  getCurrentUserProjectTasks,
  patchProjectTask,
} from "../../services/project-task-service.service";
import { toast } from "sonner";
import ReviewerTaskTable from "../../components/reviewer/reviewer-task/task-table";

type ApiTaskListPayload = { data?: ProjectTask[] };

const extractTaskList = (payload: unknown): ProjectTask[] => {
  const apiResponse = payload as ApiResponse<
    ApiTaskListPayload | ProjectTask[]
  >;
  if (Array.isArray(apiResponse?.data))
    return apiResponse.data as ProjectTask[];
  if (
    Array.isArray((apiResponse?.data as ApiTaskListPayload | undefined)?.data)
  ) {
    return (apiResponse.data as ApiTaskListPayload).data ?? [];
  }
  return [];
};

const getProjectName = (task: ProjectTask): string => {
  const project = task.project as Project | { name?: string } | undefined;
  if (project && "name" in project && typeof project.name === "string") {
    return project.name;
  }
  return `Project ${task.projectId.slice(0, 8)}`;
};

export default function ReviewerQueuePage() {
  const { getUserInfo } = useAuth();

  const [currentUser] = useState(() => {
    try {
      return getUserInfo();
    } catch {
      return null;
    }
  });

  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ProjectTask["status"] | "All"
  >("All");

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      if (!currentUser?.id) {
        setError("Cannot determine current user from auth context.");
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const resp = await getCurrentUserProjectTasks({
          page: 1,
          limit: 100,
          order: "DESC",
          orderBy: "createdAt",
          assignedToUserId: currentUser.id,
        });

        if (!cancelled) {
          setTasks(extractTaskList(resp));
        }
      } catch (err) {
        if (!cancelled) {
          setTasks([]);
          setError(
            err instanceof Error ? err.message : "Failed to load tasks.",
          );
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [currentUser?.id]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const projectName = getProjectName(task);
      const bySearch =
        projectName.toLowerCase().includes(search.toLowerCase()) ||
        task.id.toLowerCase().includes(search.toLowerCase());
      const byStatus = statusFilter === "All" || task.status === statusFilter;
      return bySearch && byStatus;
    });
  }, [tasks, search, statusFilter]);

  const stats = useMemo(
    () => ({
      pending: tasks.filter(
        (t) => t.status === ProjectTaskStatus.PENDING_REVIEW,
      ).length,
      approved: tasks.filter(
        (t) =>
          t.status === ProjectTaskStatus.APPROVED ||
          t.status === ProjectTaskStatus.DONE,
      ).length,
      rejected: tasks.filter((t) => t.status === ProjectTaskStatus.REJECTED)
        .length,
    }),
    [tasks],
  );

  const fetchTasks = async () => {
    if (!currentUser?.id) return;

    try {
      const resp = await getCurrentUserProjectTasks({
        page: 1,
        limit: 100,
        order: "DESC",
        orderBy: "createdAt",
        assignedToUserId: currentUser.id,
      });
      setTasks(extractTaskList(resp));
    } catch (err) {
      setTasks([]);
      setError(err instanceof Error ? err.message : "Failed to load tasks.");
    }
  };

  const handleAcceptTask = async (taskId: string) => {
    try {
      await patchProjectTask(taskId, { status: ProjectTaskStatus.IN_PROGRESS });
      toast.success("Task accepted. You can now start reviewing.");
      await fetchTasks();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to accept the task. Please try again.",
      );
    }
  };

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Review Queue</h2>
          <p className="text-sm text-gray-500">
            Inspect pending submissions, approve or reject with categorized
            errors.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-700">
            Pending: {stats.pending}
          </span>
          <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700">
            Approved: {stats.approved}
          </span>
          <span className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700">
            Rejected: {stats.rejected}
          </span>
        </div>
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.8fr_1fr_1fr]">
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Search</label>
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
            placeholder="Search project or task ID..."
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">Status</label>
          <select
            value={statusFilter}
            onChange={(event) =>
              setStatusFilter(
                event.target.value as ProjectTask["status"] | "All",
              )
            }
            title="Filter by status"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option value={ProjectTaskStatus.PENDING_REVIEW}>
              Pending Review
            </option>
            <option value={ProjectTaskStatus.REJECTED}>Returned</option>
            <option value={ProjectTaskStatus.APPROVED}>Completed</option>
            <option value="All">All</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-semibold text-gray-700">
            Order by
          </label>
          <select
            title="Order tasks"
            className="rounded-md border border-gray-300 px-3 py-2 text-sm"
          >
            <option>Assigned date</option>
            <option>Due date</option>
            <option>Priority</option>
          </select>
        </div>
      </div>

      <ReviewerTaskTable
        tasks={filteredTasks}
        isLoading={isLoading}
        error={error}
        onAccept={handleAcceptTask}
      />
    </div>
  );
}
