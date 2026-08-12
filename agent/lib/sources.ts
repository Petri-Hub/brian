export const MAX_AUDIO_BYTES = 45 * 1024 * 1024;

const MEDIA_EGRESS_COMPANIONS: Record<string, readonly string[]> = {
  "youtube.com": ["*.googlevideo.com", "*.ytimg.com"],
  "youtu.be": ["*.googlevideo.com", "*.ytimg.com"],
  "soundcloud.com": ["*.sndcdn.com"],
  "vimeo.com": ["*.vimeocdn.com", "*.akamaized.net"],
  "bandcamp.com": ["*.bcbits.com"],
  "archive.org": ["*.archive.org"],
};

export class SourceNotAllowedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SourceNotAllowedError";
  }
}

function baseDomain(pattern: string): string {
  return pattern.startsWith("*.") ? pattern.slice(2) : pattern;
}

export function allowedHosts(): readonly string[] {
  return (process.env.AUDIO_ALLOWED_HOSTS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
}

function hostMatches(host: string, pattern: string): boolean {
  const base = baseDomain(pattern);
  return host === base || host.endsWith(`.${base}`);
}

export function assertAllowedSource(rawUrl: string): URL {
  const patterns = allowedHosts();
  if (patterns.length === 0) {
    throw new SourceNotAllowedError(
      "No sources are configured. Set AUDIO_ALLOWED_HOSTS to the hosts this bot may pull from.",
    );
  }

  let url: URL;
  try {
    url = new URL(rawUrl);
  } catch {
    throw new SourceNotAllowedError(`Not a valid URL: ${rawUrl}`);
  }

  if (url.protocol !== "https:") {
    throw new SourceNotAllowedError("Only https:// sources are accepted.");
  }

  const host = url.hostname.toLowerCase();
  if (!patterns.some((pattern) => hostMatches(host, pattern))) {
    throw new SourceNotAllowedError(
      `${host} is not an allowed source. Allowed: ${patterns.join(", ")}.`,
    );
  }

  return url;
}

export function sandboxAllowList(): string[] {
  const extra = (process.env.AUDIO_EXTRA_EGRESS_HOSTS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);

  const entries = allowedHosts().flatMap((pattern) => {
    const base = baseDomain(pattern);
    return [base, `*.${base}`, ...(MEDIA_EGRESS_COMPANIONS[base] ?? [])];
  });

  return [...new Set([...entries, ...extra])];
}
