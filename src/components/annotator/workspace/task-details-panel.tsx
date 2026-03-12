import type { Project } from "../../../../interface/project/project.interface";
import type { ProjectTask } from "../../../../interface/project-task/project-task.interface";
import type { ProjectInstruction } from "../../../../interface/project-instruction/project-instruction.interface";

type Props = {
  project: Project | null;
  taskById: ProjectTask | null;
  projectInstruction: ProjectInstruction | null;
  instructionItems: string[];
  allowedLabelNames: string[];
  metaError: string | null;
};

export default function TaskDetailsPanel({
  project,
  taskById,
  projectInstruction,
  instructionItems,
  allowedLabelNames,
  metaError,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500">Project overview</p>
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
            <span className="text-gray-500">Project ID</span>
            <span className="text-right font-semibold text-gray-800">
              {project?.id ?? taskById?.projectId ?? "--"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-gray-500">Status</span>
            <span className="text-right font-semibold capitalize text-gray-800">
              {project?.projectStatus ?? "--"}
            </span>
          </div>
          <div className="flex items-start justify-between gap-3">
            <span className="text-gray-500">Data type</span>
            <span className="text-right font-semibold capitalize text-gray-800">
              {project?.dataType ?? "--"}
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
          {allowedLabelNames.length > 0 ? (
            allowedLabelNames.map((label) => (
              <span
                key={label}
                className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 text-xs text-gray-700"
              >
                {label}
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
