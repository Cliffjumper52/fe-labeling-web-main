export const TextExtension = {
  TXT: "txt",
  CSV: "csv",
  JSON: "json",
  XML: "xml",
  MD: "md",
  HTML: "html",
  DOC: "doc",
  DOCX: "docx",
  PDF: "pdf",
} as const;
export type TextExtension = (typeof TextExtension)[keyof typeof TextExtension];
