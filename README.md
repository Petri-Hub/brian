<h1 align="center">🎵 brian</h1>

<br>

<h3 align="center">A Telegram agent that fetches music for my dad.<br>Built on Vercel's eve, with GPT and yt-dlp</h3>

<p align="center">
  <a href="https://github.com/Petri-Hub/brian/actions/workflows/quality-gate.yml"><img alt="Quality gate" src="https://img.shields.io/github/actions/workflow/status/Petri-Hub/brian/quality-gate.yml?label=quality%20gate&logo=githubactions&logoColor=white" /></a> <img alt="Top language" src="https://img.shields.io/github/languages/top/Petri-Hub/brian" /> <a href="https://github.com/Petri-Hub/brian/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/Petri-Hub/brian" /></a>
</p>

<br>

## About

> **TL;DR:** my dad wanted music to listen to in the car, and he isn't much into tech. A website full of buttons would scare him more than a bot that answers like a person and understands when he talks to it. So he sends Brian a link, the name of a song or a voice message, picks one of the results, and gets the song back as an .mp3 he can download. The name comes from Brian O'Conner, of Fast & Furious.

## How it works

```
text or voice message
          │
          ▼
        agent ─────────── a link ─────────────┐
          │                                   │
        a name                                │
          ▼                                   │
    search_videos ──▶ numbered list           │
                            │                 │
                   the user picks one ────────┤
                                              ▼
                                         fetch_audio
                                              │
                                              ▼
                                     yt-dlp in a sandbox
                                              │
                                              ▼
                                     .mp3 in the chat
```

Voice messages are transcribed before they reach the agent, so asking out loud works the same as typing.

## The three decisions that mattered

**🧰 Two tools and nothing else.** eve gives every agent a shell, file access and web search by default. Brian has all of them switched off, so the only things the model can do are search for a video and fetch its audio.

**🔒 An empty allow-list rejects everything.** `fetch_audio` only accepts `https` links on hosts listed in `AUDIO_ALLOWED_HOSTS`, and on Vercel the sandbox's network only reaches those hosts, their media CDNs and GitHub, where yt-dlp is downloaded from. Forgetting to configure it gives a bot that does nothing, not one that downloads anything.

**📦 The download never runs where the chat is answered.** yt-dlp is installed and run inside a sandbox, Docker locally and Vercel Sandbox in production, and only the finished file comes back out.

## What's inside

```sh
└── agent
    ├── channels         # Telegram, plus eve's session routes behind basic auth
    ├── hooks            # clears staged audio at the start of each turn
    ├── lib              # allowed sources, audio formats and voice transcription
    ├── sandbox          # where yt-dlp is installed and runs
    ├── tools            # search_videos and fetch_audio, with eve's defaults switched off
    ├── agent.ts         # the model
    └── instructions.md  # how Brian talks, and when it may download
```

## Technologies

<table align="center">
  <tr>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/typescript" width="48" height="48" alt="TypeScript" /><br>TypeScript</td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/nodedotjs" width="48" height="48" alt="Node.js" /><br>Node.js</td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/vercel/9198A1" width="48" height="48" alt="Vercel" /><br>Vercel</td>
    <td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/selfhst/icons/svg/openai-light.svg" width="48" height="48" alt="OpenAI" /><br>OpenAI</td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/telegram" width="48" height="48" alt="Telegram" /><br>Telegram</td>
    <td align="center" width="96"><img src="https://cdn.jsdelivr.net/gh/homarr-labs/dashboard-icons/svg/yt-dlp.svg" width="48" height="48" alt="yt-dlp" /><br>yt-dlp</td>
    <td align="center" width="96"><img src="https://cdn.simpleicons.org/docker" width="48" height="48" alt="Docker" /><br>Docker</td>
  </tr>
</table>
