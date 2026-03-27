export const AudioExtension = {
  MP3: "mp3",
  WAV: "wav",
  AAC: "aac",
  FLAC: "flac",
  OGG: "ogg",
  WMA: "wma",
  M4A: "m4a",
} as const;
export type AudioExtension =
  (typeof AudioExtension)[keyof typeof AudioExtension];
