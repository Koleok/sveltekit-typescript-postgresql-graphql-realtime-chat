import { derived, writable } from 'svelte/store'
import { Client } from '../../.wundergraph/generated/client'
import type {
  User,
  Response,
  RequestOptions,
  SubscriptionRequestOptions,
} from '../../.wundergraph/generated/client'
import { onMount } from 'svelte'

export type State = 'idle' | 'initializing' | 'initialized'

export interface InternalOptions {
  requiresAuthentication: boolean
}

export const createWundergraphStore = () => {
  const user = writable<User>(null)
  const clientState = writable<State>('initializing')
  const refetchMountedQueries = writable(new Date())
  const queryCache = writable<Record<string, any>>({})

  const client = new Client()

  client.fetchUser()

  client.setUserListener((u) => {
    user.set(u)
    clientState.set('initialized')
  })

  client.setLogoutCallback(() => {
    queryCache.set({})
    clientState.set('idle')
  })

  return {
    client,
    user: derived(user, (x) => x),
    clientState: derived(clientState, (x) => x),
    refetchMountedQueries: derived(refetchMountedQueries, (x) => x),
    queryCache: derived(queryCache, (x) => x),
  }
}

type LiveQueries = Client['liveQuery']

type LiveQueryName = keyof LiveQueries

type LiveQuery = LiveQueries[LiveQueryName]

/**
 * Creates a live query that initializes with svelte#onMount and aborts on unmount.
 *
 * @param operation Wundergraph generated live query
 * @param onUpdate Function to run when query is updated
 */
export const createSubscription = <T extends LiveQuery>(
  operation: T,
  onUpdate: (response: Parameters<Parameters<T>[1]>[0]) => void
) => {
  onMount(() => {
    const controller = new AbortController()

    operation(
      { refetchOnWindowFocus: true, abortSignal: controller.signal },
      onUpdate
    )

    return () => {
      controller.abort()
    }
  })
}
