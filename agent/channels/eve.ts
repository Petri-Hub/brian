import { eveChannel } from 'eve/channels/eve'
import { httpBasic, localDev, placeholderAuth, vercelOidc, type AuthFn } from 'eve/channels/auth'
import { requireEnv } from '#lib/env.js'

function operatorAuth(): AuthFn<Request> {
  return httpBasic(
    {
      username: requireEnv('EVE_BASIC_AUTH_USER'),
      password: requireEnv('EVE_BASIC_AUTH_PASSWORD'),
    },
    { realm: 'brian' },
  )
}

export default eveChannel({
  auth: [operatorAuth(), vercelOidc(), localDev(), placeholderAuth()],
})
