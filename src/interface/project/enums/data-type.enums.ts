export const DataType = {
  IMAGE: "image",
  TEXT: "text",
  VIDEO: "video",
  AUDIO: "audio",
} as const;
export type DataType = (typeof DataType)[keyof typeof DataType];
