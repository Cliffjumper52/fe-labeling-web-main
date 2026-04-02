import { Link } from "react-router-dom";
import type { ManagerProjectItem } from "../../../interface/project/manager-projects.interface";

type Props = {
  projects: ManagerProjectItem[];
  loading: boolean;
  onCreateClick: () => void;
};

const toStatusLabel = (status: ManagerProjectItem["projectStatus"]) => {
  switch (status) {
    case "active":
      return "Active";
    case "archived":
      return "Archived";
    case "completed":
      return "Completed";
    case "draft":
    default:
      return "Drafting";
  }
};

const toDataTypeLabel = (dataType: ManagerProjectItem["dataType"]) => {
  switch (dataType) {
    case "image":
      return "Image";
    case "video":
      return "Video";
    case "audio":
      return "Audio";
    case "text":
    default:
      return "Text";
  }
};

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleDateString();
};

export default function ProjectTable({
  projects,
  loading,
  onCreateClick,
}: Props) {
  if (loading) {
    return (
      <div className="mt-6 rounded-lg border border-gray-200 bg-white px-5 py-12 text-center text-sm text-gray-500">
        Loading projects...
      </div>
    );
  }

  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
          <svg
            viewBox="0 0 24 24"
            className="h-8 w-8 text-gray-500"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M3 7a2 2 0 0 1 2-2h4l2 2h6a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-800">No Projects Yet</h3>
        <p className="mt-1 text-sm text-gray-500">
          Get started by creating your first data labeling project
        </p>
        <button
          type="button"
          onClick={onCreateClick}
          className="mt-5 flex items-center gap-2 rounded-md bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700"
        >
          <span className="text-base leading-none">+</span>
          Create Project
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6 rounded-lg border border-gray-200 bg-white shadow-sm">
      <div className="grid grid-cols-[1.6fr_2.2fr_1fr_1fr_1fr_0.8fr] items-center gap-2 border-b bg-gray-50 px-4 py-3 text-xs font-semibold uppercase text-gray-600">
        <span>Name</span>
        <span>Description</span>
        <span>Status</span>
        <span>Data type</span>
        <span>Date created</span>
        <span>Action</span>
      </div>

      {projects.map((project) => (
        <div
          key={project.id}
          className="grid grid-cols-[1.6fr_2.2fr_1fr_1fr_1fr_0.8fr] items-center gap-2 border-b px-4 py-3 text-sm last:border-b-0"
        >
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 bg-gray-100">
              {project.imageUrl ? (
                <img
                  src={project.imageUrl}
                  alt={`${project.name} thumbnail`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-gray-400">
                  N/A
                </div>
              )}
            </div>
            <p className="font-medium text-gray-800">{project.name}</p>
          </div>

          <div>
            <p className="text-sm text-gray-600">
              {project.description || "No description"}
            </p>
          </div>

          <div>
            <span className="rounded-md bg-gray-200 px-3 py-1 text-xs font-semibold text-gray-700">
              {toStatusLabel(project.projectStatus)}
            </span>
          </div>

          <span className="text-gray-700">
            {toDataTypeLabel(project.dataType)}
          </span>
          <span className="text-gray-700">{formatDate(project.createdAt)}</span>

          <div className="flex items-center gap-3 text-sm font-semibold">
            <Link
              to={`/manager/projects/${project.id}/edit`}
              className="text-blue-600 hover:text-blue-700"
            >
              Edit
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
