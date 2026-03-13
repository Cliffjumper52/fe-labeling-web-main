import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../context/auth-context.context";
import type { ApiResponse } from "../../interface/common/api-response.interface";
import type { ProjectTask } from "../../interface/project-task/project-task.interface";
import { ProjectTaskStatus } from "../../interface/project-task/enums/task-status.enums";
import {
  getCurrentUserProjectTasks,
  patchProjectTask,
} from "../../services/project-task-service.service";
import { toast } from "sonner";
import TaskStatsBar from "../../components/annotator/annotator-task/task-stat-bar";
import TaskFilters from "../../components/annotator/annotator-task/task-filter";
import TaskTable from "../../components/annotator/annotator-task/task-table";

// ─── helpers ────────────────────────────────────────────────────────────────

type TaskListPayload = { data?: ProjectTask[] };

const extractTaskList = (payload: unknown): ProjectTask[] => {
  const apiResponse = payload as ApiResponse<TaskListPayload | ProjectTask[]>;
  if (Array.isArray(apiResponse?.data)) return apiResponse.data;
  if (Array.isArray((apiResponse?.data as TaskListPayload | undefined)?.data)) {
    return (apiResponse.data as TaskListPayload).data ?? [];
  }
  return [];
};

// ─── page ────────────────────────────────────────────────────────────────────

export default function AnnotatorTasksPage() {
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
  const [acceptingTaskId, setAcceptingTaskId] = useState<string | null>(null);

  // filter state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<
    ProjectTask["status"] | "All"
  >("All");
  const [priorityFilter, setPriorityFilter] = useState<
    ProjectTask["priority"] | "All"
  >("All");

  // ─── data fetching ──────────────────────────────────────────────────────

  const fetchTasks = async () => {
    try {
      const resp = await getCurrentUserProjectTasks({
        page: 1,
        limit: 100,
        order: "DESC",
        orderBy: "createdAt",
        assignedToUserId: currentUser?.id,
      });
      setTasks(extractTaskList(resp));
    } catch (err) {
      setTasks([]);
      setError(
        err instanceof Error ? err.message : "Failed to load assigned tasks.",
      );
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        if (!currentUser?.id)
          throw new Error("Cannot determine current user from auth context.");
        await fetchTasks();
      } catch (err) {
        if (cancelled) return;
        setTasks([]);
        setError(
          err instanceof Error ? err.message : "Failed to load assigned tasks.",
        );
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [getUserInfo]);

  // ─── handlers ───────────────────────────────────────────────────────────

  const handleAcceptTask = async (taskId: string) => {
    setAcceptingTaskId(taskId);
    try {
      await patchProjectTask(taskId, { status: ProjectTaskStatus.IN_PROGRESS });
      toast.success("Task accepted. You can now start working on it.");
      await fetchTasks();
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Failed to accept the task. Please try again.",
      );
    } finally {
      setAcceptingTaskId(null);
    }
  };

  // ─── derived state ───────────────────────────────────────────────────────

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const project = task.project as
        | { id?: string; name?: string }
        | undefined;
      const projectName =
        typeof project?.name === "string" && project.name.trim()
          ? project.name
          : `Project ${((typeof project?.id === "string" && project.id) || task.projectId).slice(0, 8)}`;

      const matchesSearch =
        projectName.toLowerCase().includes(search.toLowerCase()) ||
        task.id.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "All" || task.status === statusFilter;
      const matchesPriority =
        priorityFilter === "All" || task.priority === priorityFilter;

      return matchesSearch && matchesStatus && matchesPriority;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const counts = useMemo(
    () => ({
      total: tasks.length,
      inProgress: tasks.filter(
        (t) => t.status === ProjectTaskStatus.IN_PROGRESS,
      ).length,
      pending: tasks.filter(
        (t) => t.status === ProjectTaskStatus.PENDING_REVIEW,
      ).length,
      rejected: tasks.filter((t) => t.status === ProjectTaskStatus.REJECTED)
        .length,
    }),
    [tasks],
  );

  // ─── render ──────────────────────────────────────────────────────────────

  return (
    <div className="w-full bg-white px-6 py-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">My Tasks</h2>
          <p className="text-sm text-gray-500">
            Live tasks assigned to your account.
          </p>
        </div>
        <TaskStatsBar counts={counts} />
      </div>

      <div className="mb-4 h-px w-full bg-gray-200" />

      <TaskFilters
        search={search}
        statusFilter={statusFilter}
        priorityFilter={priorityFilter}
        onSearchChange={setSearch}
        onStatusChange={setStatusFilter}
        onPriorityChange={setPriorityFilter}
      />

      <TaskTable
        tasks={filteredTasks}
        isLoading={isLoading}
        error={error}
        onAccept={handleAcceptTask}
        acceptingTaskId={acceptingTaskId}
      />
    </div>
  );
}
