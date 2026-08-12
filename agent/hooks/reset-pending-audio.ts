import { defineHook } from "eve/hooks";
import { clearStagedAudio } from "#lib/pending-audio.js";

export default defineHook({
  events: {
    "turn.started"() {
      clearStagedAudio();
    },
  },
});
