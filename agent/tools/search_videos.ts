import { defineTool } from "eve/tools";
import { z } from "zod";

const YT_DLP = "/workspace/bin/yt-dlp";
const MAX_RESULTS = 5;

interface SearchEntry {
  readonly id?: unknown;
  readonly title?: unknown;
  readonly duration?: unknown;
  readonly uploader?: unknown;
  readonly channel?: unknown;
}

function formatDuration(seconds: number | null): string | null {
  if (seconds === null) return null;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}:${String(remainder).padStart(2, "0")}`;
}

export default defineTool({
  description:
    "Search YouTube by title or description when the user asks for something by name instead of sending a link. " +
    "Returns candidate videos with their URLs. This only finds candidates — it downloads nothing. " +
    "Show the results to the user and let them choose before calling fetch_audio.",
  inputSchema: z.object({
    query: z.string().min(2).describe("What to search for, e.g. an artist and track name."),
  }),
  outputSchema: z.object({
    results: z.array(
      z.object({
        url: z.string(),
        title: z.string(),
        channel: z.string().nullable(),
        duration: z.string().nullable(),
      }),
    ),
  }),
  async execute({ query }, ctx) {
    const sandbox = await ctx.getSandbox();
    const search = await sandbox.run({
      command: `bash -lc 'set -o pipefail; ${YT_DLP} "ytsearch${MAX_RESULTS}:$SEARCH_QUERY" --dump-json --flat-playlist --no-warnings'`,
      env: { SEARCH_QUERY: query },
    });

    if (search.exitCode !== 0) {
      throw new Error(`Search failed: ${search.stderr.trim().slice(-400)}`);
    }

    const results = search.stdout
      .trim()
      .split("\n")
      .filter((line) => line.startsWith("{"))
      .map((line) => JSON.parse(line) as SearchEntry)
      .filter(
        (entry): entry is SearchEntry & { id: string } => typeof entry.id === "string" && entry.id.length > 0,
      )
      .map((entry) => ({
        url: `https://www.youtube.com/watch?v=${entry.id}`,
        title: typeof entry.title === "string" ? entry.title : entry.id,
        channel:
          typeof entry.channel === "string"
            ? entry.channel
            : typeof entry.uploader === "string"
              ? entry.uploader
              : null,
        duration: formatDuration(
          typeof entry.duration === "number" && Number.isFinite(entry.duration)
            ? Math.round(entry.duration)
            : null,
        ),
      }));

    return { results };
  },
});
