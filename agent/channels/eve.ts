import { eveChannel } from 'eve/channels/eve'
import { httpBasic, localDev, placeholderAuth, vercelOidc, type AuthFn } from 'eve/channels/auth'

function operatorAuth(): AuthFn<Request> | null {
  const username = process.env.EVE_BASIC_AUTH_USER?.trim()
  const password = process.env.EVE_BASIC_AUTH_PASSWORD?.trim()
  if (!username || !password) return null
  return httpBasic({ username, password }, { realm: 'brian' })
}

export default eveChannel({
  auth: [operatorAuth(), vercelOidc(), localDev(), placeholderAuth()].filter((entry) => entry !== null),
})
