const ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

const EXTENSION_BY_MIME: Record<string, string> = {
  "audio/flac": "flac",
  "audio/m4a": "m4a",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/ogg": "ogg",
  "audio/oga": "oga",
  "audio/opus": "ogg",
  "audio/wav": "wav",
  "audio/webm": "webm",
  "audio/x-wav": "wav",
};

export async function transcribeAudio(bytes: Uint8Array, mimeType?: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is not set, so voice messages cannot be transcribed.");

  const normalized = (mimeType ?? "audio/ogg").split(";")[0]!.trim().toLowerCase();
  const extension = EXTENSION_BY_MIME[normalized] ?? "ogg";

  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(bytes)], { type: normalized }), `voice.${extension}`);
  form.append("model", process.env.TRANSCRIBE_MODEL ?? "gpt-4o-mini-transcribe");

  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed (${response.status}): ${(await response.text()).slice(0, 300)}`);
  }

  const result = (await response.json()) as { text?: unknown };
  const text = typeof result.text === "string" ? result.text.trim() : "";
  if (!text) throw new Error("Transcription returned no text.");
  return text;
}
