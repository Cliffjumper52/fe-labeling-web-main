import ManagerPresetsPage from "../manager-presets/page";

export default function AdminPresetsPage() {
  const samplePresets = [
    {
      id: "preset-1",
      name: "Urban Vehicles",
      description: "Vehicle detection labels for street scenes.",
      labels: ["Vehicle Detection", "Road Markings"],
      createdAt: "2026-02-08",
    },
    {
      id: "preset-2",
      name: "Retail Shelf",
      description: "Shelf product placement and count labels.",
      labels: ["Product Box", "Price Tag", "Shelf Divider"],
      createdAt: "2026-01-30",
    },
    {
      id: "preset-3",
      name: "Medical QA",
      description: "Quality control labels for CT slices.",
      labels: ["CT Slice Quality"],
      createdAt: "2025-12-22",
    },
  ];

  return <ManagerPresetsPage mode="admin" initialPresets={samplePresets} />;
}
