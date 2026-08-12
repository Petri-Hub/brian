import { createMemoryState } from '@chat-adapter/state-memory'
import { createTelegramAdapter, type TelegramAdapterMode } from '@chat-adapter/telegram'
import type { Message, Thread } from 'chat'
import { chatSdkChannel } from 'eve/channels/chat-sdk'
import { takeStagedAudio, type StagedAudio } from '#lib/pending-audio.js'
import { transcribeAudio } from '#lib/transcribe.js'

const mode =
  (process.env.TELEGRAM_MODE as TelegramAdapterMode | undefined) ??
  (process.env.VERCEL ? 'webhook' : 'polling')

export const { bot, channel, send } = chatSdkChannel({
  userName: process.env.TELEGRAM_BOT_USERNAME ?? 'brian',
  adapters: { telegram: createTelegramAdapter({ mode }) },
  state: createMemoryState(),
  streaming: false,
  inputActionPrefix: 'a:',
  events: {
    async 'message.completed'(data, channelCtx, ctx) {
      const thread = channelCtx.thread
      if (data.finishReason === 'tool-calls' || !thread) return

      const staged = takeStagedAudio()
      const caption = data.message?.trim() ?? ''

      if (staged.length === 0) {
        if (caption) await thread.post({ markdown: caption })
        return
      }

      const sandbox = await ctx.getSandbox()
      for (const [index, item] of staged.entries()) {
        const bytes = await sandbox.readBinaryFile({ path: item.path })
        if (!bytes) {
          await thread.post({
            markdown: `Could not read the audio for "${item.title}" back from the sandbox.`,
          })
          continue
        }
        await thread.post({
          markdown: index === 0 && caption ? caption : item.title,
          attachments: [audioAttachment(item, bytes)],
        })
      }
    },
  },
})

function audioAttachment(item: StagedAudio, bytes: Uint8Array) {
  return {
    type: 'audio' as const,
    data: Buffer.from(bytes),
    mimeType: item.mimeType,
    name: item.name,
    size: item.sizeBytes,
  }
}

async function inputFrom(thread: Thread, message: Message): Promise<string> {
  const voice = message.attachments?.find((attachment) => attachment.type === 'audio')
  if (!voice?.fetchData) return message.text

  try {
    const transcript = await transcribeAudio(await voice.fetchData(), voice.mimeType)
    const typed = message.text?.trim() ?? ''
    return typed ? `${typed}\n\n${transcript}` : transcript
  } catch (error) {
    await thread.post({ markdown: `Não consegui entender esse áudio: ${(error as Error).message}` })
    return message.text
  }
}

bot.onNewMention(async (thread: Thread, message: Message) => {
  await thread.subscribe()
  const input = await inputFrom(thread, message)
  if (input?.trim()) await send(input, { thread })
})

bot.onSubscribedMessage(async (thread: Thread, message: Message) => {
  const input = await inputFrom(thread, message)
  if (input?.trim()) await send(input, { thread })
})

export default channel
