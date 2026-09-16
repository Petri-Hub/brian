# Security Policy

## Scope

Brian is a personal bot. It downloads audio from links it receives, so the realistic surface is how it decides what it may fetch and where that runs: the host allow-list, the sandbox that runs yt-dlp, the basic auth in front of eve's session routes, and the dependency tree.

## Supported Versions

There's one version — `main`. If something needs fixing, it gets fixed there.

## Reporting a Vulnerability

If you find a security issue, tell me privately instead of posting it publicly. **Don't open a GitHub issue.** Send an email to [fernando.petri01@gmail.com](mailto:fernando.petri01@gmail.com) with:

- What you found
- How to reproduce it
- Which dependency and version, if that's where it lives

## What happens next

1. I'll confirm the issue
2. I'll write and test a fix
3. I'll merge it into `main`
4. I'll let you know when it's live
