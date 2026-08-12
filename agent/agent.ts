import { openai } from "@ai-sdk/openai";
import { defineAgent } from "eve";

export default defineAgent({
  model: openai(process.env.AGENT_MODEL ?? "gpt-5-nano"),
  reasoning: "minimal",
});
