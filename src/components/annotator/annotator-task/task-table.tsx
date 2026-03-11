import type { ProjectTask } from "../../../interface";
import TaskRow from "./task-row";

type Props = {
  tasks: ProjectTask[];
  isLoading: boolean;
  error: string | null;
  onAccept: (taskId: string) => void;
};

export default function TaskTable({
  tasks,
  isLoading,
  error,
  onAccept,
}: Props) {
  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.4fr_1fr_0.9fr_1fr_1.2fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
        <span>Project</span>
        <span>Status</span>
        <span>Priority</span>
        <span>Assigned</span>
        <span>Action</span>
      </div>

      {isLoading && (
        <div className="px-4 py-6 text-sm text-gray-500">Loading tasks...</div>
      )}

      {!isLoading && error && (
        <div className="px-4 py-6 text-sm text-rose-600">{error}</div>
      )}

      {!isLoading && !error && tasks.length === 0 && (
        <div className="px-4 py-6 text-sm text-gray-500">
          No assigned tasks found for your filters.
        </div>
      )}

      {!isLoading &&
        !error &&
        tasks.map((task) => (
          <TaskRow key={task.id} task={task} onAccept={onAccept} />
        ))}
    </div>
  );
}
