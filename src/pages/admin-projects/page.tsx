import ManagerProjectsPage from "../manager-projects/page";

export default function AdminProjectsPage() {
  const sampleProjects: {
    id: string;
    name: string;
    description: string;
    status: "Active" | "Drafting" | "Archived";
    dataType: "Image" | "Video" | "Text" | "Audio";
    createdAt: string;
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

  return <ManagerProjectsPage mode="admin" initialProjects={sampleProjects} />;
}
