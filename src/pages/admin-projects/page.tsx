import ManagerProjectsPage from "../manager-projects/page";

export default function AdminProjectsPage() {
  const sampleProjects = [
    {
      id: "proj-1",
      name: "Retail Shelf Audit",
      description: "Detect SKU placement and count facings per brand.",
      status: "Active",
      dataType: "Image",
      createdAt: "2026-02-12",
    },
    {
      id: "proj-2",
      name: "Street Scene Vehicles",
      description: "Bounding boxes for cars, buses, and bikes in urban scenes.",
      status: "Drafting",
      dataType: "Video",
      createdAt: "2026-01-28",
    },
    {
      id: "proj-3",
      name: "Medical Scan Classification",
      description: "Classify CT slices by anomaly category.",
      status: "Archived",
      dataType: "Text",
      createdAt: "2025-12-03",
    },
  ];

  return <ManagerProjectsPage mode="admin" initialProjects={sampleProjects} />;
}
