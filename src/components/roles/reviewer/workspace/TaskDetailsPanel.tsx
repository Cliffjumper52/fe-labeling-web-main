import type { Label } from "../../../../interface/label/label.interface";
import type { Project } from "../../../../interface/project/project.interface";
import type { ProjectInstruction } from "../../../../interface/project-instruction/project-instruction.interface";
import type { ProjectTask } from "../../../../interface/project-task/project-task.interface";

type Props = {
  project: Project | null;
  taskById: ProjectTask | null;
  taskId: string | undefined;
  taskStatusText: string;
  projectInstruction: ProjectInstruction | null;
  instructionItems: string[];
  projectLabels: Label[];
  metaError: string | null;
};

export default function TaskDetailsPanel({
  project,
  taskById,
  taskId,
  taskStatusText,
  projectInstruction,
  instructionItems,
  projectLabels,
  metaError,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">
              Reviewer Workspace: {project?.name ?? "Project Workspace"}
            </h2>
            <p className="text-sm text-gray-500">
              Task {taskById?.id ?? taskId ?? "--"}
            </p>
          </div>
          <span className="rounded-md bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
            {taskStatusText}
          </span>
        </div>

        <p className="text-xs font-semibold text-gray-500">Task details</p>
        {project?.imageUrl ? (
          <img
            src={project.imageUrl}
            alt={project.name}
            className="mt-3 h-32 w-full rounded-md border border-gray-200 object-cover"
          />
        ) : null}
        <div className="mt-3 space-y-2 text-sm text-gray-700">
          <div className="flex items-start justify-between gap-3">
            <span className="text-gray-500">Project</span>
            <span className="text-right font-semibold text-gray-800">
              {project?.name ?? "--"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-gray-500">Priority</span>
            <span className="text-right font-semibold capitalize text-gray-800">
              {taskById?.priority ?? "--"}
            </span>
          </div>
          <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm text-gray-700">
            {project?.description || "No project description provided."}
          </div>
          {metaError ? (
            <p className="rounded-md border border-rose-200 bg-rose-50 px-2 py-1 text-xs text-rose-700">
              {metaError}
            </p>
          ) : null}
        </div>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Instructions</p>
        <p className="mt-2 text-sm font-semibold text-gray-800">
          {projectInstruction?.title || "Project instructions"}
        </p>

        {projectInstruction?.attachmentUrl ? (
          <a
            href={projectInstruction.attachmentUrl}
            target="_blank"
            rel="noreferrer"
            className="mt-3 inline-flex rounded-md border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
          >
            Download attachment
          </a>
        ) : (
          <p className="mt-2 text-xs text-gray-500">No attachment available.</p>
        )}

        {instructionItems.length > 0 ? (
          <ul className="mt-3 list-disc space-y-2 pl-4 text-sm text-gray-700">
            {instructionItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : null}
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Allowed labels</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {projectLabels.length > 0 ? (
            projectLabels.map((label) => (
              <span
                key={label.id}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
              >
                {label.name}
              </span>
            ))
          ) : (
            <p className="text-xs text-gray-500">No labels configured.</p>
          )}
        </div>
      </div>
    </div>
  );
}
