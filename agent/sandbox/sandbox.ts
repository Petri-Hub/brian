import { defaultBackend, defineSandbox } from 'eve/sandbox'
import { sandboxAllowList } from '#lib/sources.js'

const YT_DLP_RELEASE = 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_linux'

const BOOTSTRAP_ALLOW = ['github.com', '*.github.com', '*.githubusercontent.com']

export default defineSandbox({
  backend: defaultBackend({
    vercel: { networkPolicy: { allow: [...BOOTSTRAP_ALLOW, ...sandboxAllowList()] } },
  }),
  revalidationKey: () => process.env.YT_DLP_REVALIDATION_KEY ?? 'yt-dlp-v1',
  async bootstrap({ use }) {
    const sandbox = await use()
    const install = await sandbox.run({
      command: `bash -lc 'set -euo pipefail; mkdir -p /workspace/bin; curl -fsSL -o /workspace/bin/yt-dlp "${YT_DLP_RELEASE}"; chmod +x /workspace/bin/yt-dlp; /workspace/bin/yt-dlp --version'`,
    })
    if (install.exitCode !== 0) {
      throw new Error(`yt-dlp install failed (exit ${install.exitCode}): ${install.stderr}`)
    }
  },
})
