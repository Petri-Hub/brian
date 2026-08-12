export function requireEnv(name: string): string {
  const value = process.env[name]?.trim()
  if (!value) {
    throw new Error(`${name} is not set. Copy .env.example to .env.local and fill it in.`)
  }
  return value
}
