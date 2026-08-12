import { defineState } from "eve/context";

export interface StagedAudio {
  readonly path: string;
  readonly name: string;
  readonly mimeType: string;
  readonly title: string;
  readonly durationSeconds: number | null;
  readonly sizeBytes: number;
}

export interface PendingAudioState {
  readonly items: readonly StagedAudio[];
}

export const pendingAudio = defineState<PendingAudioState>("brian.pending-audio", () => ({
  items: [],
}));

export function stageAudio(item: StagedAudio): void {
  pendingAudio.update((current) => ({ items: [...current.items, item] }));
}

export function takeStagedAudio(): readonly StagedAudio[] {
  const { items } = pendingAudio.get();
  if (items.length > 0) clearStagedAudio();
  return items;
}

export function clearStagedAudio(): void {
  pendingAudio.update(() => ({ items: [] }));
}
