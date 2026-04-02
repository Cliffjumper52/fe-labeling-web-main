export const ExportFormat = {
  CSV: "csv",
  JSON: "json",
  XML: "xml",
} as const;
export type ExportFormat = (typeof ExportFormat)[keyof typeof ExportFormat];
