import { createHash } from "node:crypto";
import { defineTool } from "eve/tools";
import { z } from "zod";
import { extensionOf, mimeTypeFor, safeFilename, TELEGRAM_PLAYER_EXTENSIONS } from "#lib/audio-formats.js";
import { stageAudio } from "#lib/pending-audio.js";
import { assertAllowedSource, MAX_AUDIO_BYTES } from "#lib/sources.js";

const YT_DLP = "/workspace/bin/yt-dlp";
const FORMAT = "bestaudio[ext=m4a]/bestaudio[ext=mp3]/bestaudio";

interface ProbeResult {
  readonly title: string;
  readonly durationSeconds: number | null;
}

function workDir(url: string): string {
  return `downloads/${createHash("sha256").update(url).digest("hex").slice(0, 16)}`;
}

function parseProbe(stdout: string): ProbeResult {
  const lines = stdout.trim().split("\n");
  const line = lines.reverse().find((entry: string) => entry.startsWith("{"));
  if (!line) return { title: "audio", durationSeconds: null };

  const info = JSON.parse(line) as { title?: unknown; duration?: unknown };
  const duration =
    typeof info.duration === "number" && Number.isFinite(info.duration) ? Math.round(info.duration) : null;
  return {
    title: typeof info.title === "string" && info.title.trim().length > 0 ? info.title.trim() : "audio",
    durationSeconds: duration,
  };
}

export default defineTool({
  description:
    "Download the audio track of a media URL and stage it for delivery to the user as an audio message. " +
    "Only accepts URLs on the configured allow-list. Returns metadata about what was staged; the audio " +
    "itself is attached to your reply automatically, so never paste a link to it.",
  inputSchema: z.object({
    url: z.string().describe("The https:// media URL to extract audio from."),
  }),
  outputSchema: z.object({
    staged: z.boolean(),
    title: z.string(),
    durationSeconds: z.number().nullable(),
    sizeBytes: z.number(),
    note: z.string().optional(),
  }),
  async execute({ url }, ctx) {
    const source = assertAllowedSource(url);
    const sandbox = await ctx.getSandbox();
    const dir = workDir(source.toString());

    await sandbox.run({ command: `bash -lc 'rm -rf ${sandbox.resolvePath(dir)}'` });
    await sandbox.writeTextFile({ path: `${dir}/url.txt`, content: `${source.toString()}\n` });

    const absoluteDir = sandbox.resolvePath(dir);
    const download = await sandbox.run({
      command:
        `bash -lc 'set -o pipefail; ${YT_DLP} --batch-file ${absoluteDir}/url.txt ` +
        `--format "${FORMAT}" --no-playlist --no-progress --max-filesize ${MAX_AUDIO_BYTES} ` +
        `--print-json --no-simulate --output "${absoluteDir}/media.%(ext)s"'`,
    });

    if (download.exitCode !== 0) {
      throw new Error(
        `Could not extract audio from ${source.hostname}: ${download.stderr.trim().slice(-600)}`,
      );
    }

    const listing = await sandbox.run({
      command: `bash -lc 'ls -1 ${absoluteDir} | grep "^media\\." || true'`,
    });
    const downloaded = listing.stdout.trim().split("\n").filter(Boolean).at(0);
    if (!downloaded) {
      throw new Error(
        "yt-dlp reported success but produced no audio file (the source may exceed the size limit).",
      );
    }

    const stat = await sandbox.run({ command: `bash -lc 'stat -c %s ${absoluteDir}/${downloaded}'` });
    const sizeBytes = Number.parseInt(stat.stdout.trim(), 10);
    if (!Number.isFinite(sizeBytes)) {
      throw new Error("Could not determine the size of the downloaded audio.");
    }
    if (sizeBytes > MAX_AUDIO_BYTES) {
      throw new Error(
        `The audio is ${Math.round(sizeBytes / 1024 / 1024)} MB, over the ${MAX_AUDIO_BYTES / 1024 / 1024} MB Telegram limit.`,
      );
    }

    const extension = extensionOf(downloaded);
    const { title, durationSeconds } = parseProbe(download.stdout);
    const name = safeFilename(title, extension);

    stageAudio({
      path: `${absoluteDir}/${downloaded}`,
      name,
      mimeType: mimeTypeFor(downloaded),
      title,
      durationSeconds,
      sizeBytes,
    });

    return {
      staged: true,
      title,
      durationSeconds,
      sizeBytes,
      note: TELEGRAM_PLAYER_EXTENSIONS.has(extension)
        ? undefined
        : `Only a .${extension} stream was available; Telegram may show it as a file rather than a player.`,
    };
  },
});
