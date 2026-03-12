export const VideoExtension = {
  MP4: 'mp4',
  AVI: 'avi',
  MOV: 'mov',
  WMV: 'wmv',
  FLV: 'flv',
  MKV: 'mkv',
  WEBM: 'webm',
  MPG: 'mpg',
} as const;
export type VideoExtension = (typeof VideoExtension)[keyof typeof VideoExtension];
