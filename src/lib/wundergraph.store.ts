import { derived, writable } from 'svelte/store'
import { Client } from '../../.wundergraph/generated/client'
import type { User } from '../../.wundergraph/generated/client'

export const createWundergraphStore = () => {
  const user = writable<User>(null)
  const initialized = writable(false)
  const initializing = writable(false)
  const refetchMountedQueries = writable(new Date())
  const queryCache = writable<Record<string, any>>({})

  const client = new Client()

  client.setUserListener(user.set)
  client.setLogoutCallback(() => queryCache.set({}))

  return {
    client,
    user: derived(user, (x) => x),
    initialized: derived(initialized, (x) => x),
    initializing: derived(initializing, (x) => x),
    refetchMountedQueries: derived(refetchMountedQueries, (x) => x),
    queryCache: derived(queryCache, (x) => x),
  }
}
