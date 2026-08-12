import { openai } from '@ai-sdk/openai'
import { defineAgent } from 'eve'
import { requireEnv } from '#lib/env.js'

requireEnv('OPENAI_API_KEY')

export default defineAgent({
  model: openai(requireEnv('AGENT_MODEL')),
  reasoning: 'minimal',
})
