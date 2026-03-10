import { useMemo } from "react";
import ManagerProjectsPage from "../manager-projects/page";

const MANAGER_PROJECTS_STORAGE_KEY = "manager-projects";

export default function AdminProjectsPage() {
  const sampleProjects: {
    id: string;
    name: string;
    description: string;
    status: "Active" | "Drafting" | "Archived";
    dataType: "Image" | "Video" | "Text" | "Audio";
    createdAt: string;
    uploadedFiles?: string[];
    selectedPreset?: { id: string; name: string } | null;
    assignedAnnotatorIds?: string[];
    assignedReviewerIds?: string[];
    annotatorFileAssignments?: Record<string, string[]>;
    reviewerFileAssignments?: Record<string, string[]>;
  }[] = [
    {
      id: "proj-1",
      name: "Retail Shelf Audit",
      description: "Detect SKU placement and count facings per brand.",
      status: "Active" as const,
      dataType: "Image" as const,
      createdAt: "2026-02-12",
    },
    {
      id: "proj-2",
      name: "Street Scene Vehicles",
      description: "Bounding boxes for cars, buses, and bikes in urban scenes.",
      status: "Drafting" as const,
      dataType: "Video" as const,
      createdAt: "2026-01-28",
    },
    {
      id: "proj-3",
      name: "Medical Scan Classification",
      description: "Classify CT slices by anomaly category.",
      status: "Archived" as const,
      dataType: "Text" as const,
      createdAt: "2025-12-03",
    },
  ];

  const initialProjects = useMemo(() => {
    if (typeof window === "undefined") {
      return sampleProjects;
    }

    const raw = localStorage.getItem(MANAGER_PROJECTS_STORAGE_KEY);
    if (!raw) {
      return sampleProjects;
    }

    try {
      const parsed = JSON.parse(raw) as typeof sampleProjects;
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return sampleProjects;
      }
      return parsed;
    } catch {
      return sampleProjects;
    }
  }, [sampleProjects]);

  return <ManagerProjectsPage mode="admin" initialProjects={initialProjects} />;
}
