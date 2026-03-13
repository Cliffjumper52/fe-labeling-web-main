export const ImageExtension = {
  JPG: "jpg",
  JPEG: "jpeg",
  PNG: "png",
  GIF: "gif",
  SVG: "svg",
  WEBP: "webp",
  AVIF: "avif",
  BMP: "bmp",
  TIFF: "tiff",
} as const;
export type ImageExtension =
  (typeof ImageExtension)[keyof typeof ImageExtension];
