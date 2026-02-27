import ManagerLabelsPage from "../manager-labels/page";

export default function AdminLabelsPage() {
  const sampleLabels = [
    {
      id: "label-1",
      name: "Vehicle Detection",
      description: "Cars, buses, trucks, bikes, and motorcycles.",
      type: "Bounding Box",
      totalClasses: 5,
      createdAt: "2026-02-05",
    },
    {
      id: "label-2",
      name: "Road Markings",
      description: "Lane lines, crosswalks, and stop lines.",
      type: "Polygon",
      totalClasses: 3,
      createdAt: "2026-01-18",
    },
    {
      id: "label-3",
      name: "CT Slice Quality",
      description: "Classify scan quality and artifact presence.",
      type: "Classification",
      totalClasses: 4,
      createdAt: "2025-12-21",
    },
  ];

  return <ManagerLabelsPage mode="admin" initialLabels={sampleLabels} />;
}
