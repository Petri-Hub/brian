const MIME_BY_EXTENSION: Record<string, string> = {
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp3: "audio/mpeg",
  oga: "audio/ogg",
  ogg: "audio/ogg",
  opus: "audio/ogg",
  wav: "audio/wav",
  weba: "audio/webm",
  webm: "audio/webm",
};

export const TELEGRAM_PLAYER_EXTENSIONS = new Set(["aac", "flac", "m4a", "mp3", "oga", "ogg", "opus"]);

const UNSAFE_FILENAME_CHARS = /["*:<>?|\\/]/g;

export function extensionOf(filename: string): string {
  const dot = filename.lastIndexOf(".");
  return dot === -1 ? "" : filename.slice(dot + 1).toLowerCase();
}

export function mimeTypeFor(filename: string): string {
  return MIME_BY_EXTENSION[extensionOf(filename)] ?? "application/octet-stream";
}

export function safeFilename(title: string, extension: string): string {
  const stem = title.replace(UNSAFE_FILENAME_CHARS, " ").replace(/\s+/g, " ").trim().slice(0, 80);
  return `${stem.length > 0 ? stem : "audio"}.${extension}`;
}
