import { onMount } from 'svelte'
import { derived, writable } from 'svelte/store'
import { Client } from '../../.wundergraph/generated/client'
import type { User } from '../../.wundergraph/generated/client'

export interface InternalOptions {
  requiresAuthentication: boolean
}

export const createWundergraphStore = () => {
  type State = 'loggedOut' | 'initializing' | 'initialized'

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
    clientState.set('loggedOut')
  })

  const logout = async () => {
    await client.logout()
    window.location.reload()
  }

  return {
    client,
    logout,
    user: derived(user, (x) => x),
    clientState: derived(clientState, (x) => x),
    refetchMountedQueries: derived(refetchMountedQueries, (x) => x),
    queryCache: derived(queryCache, (x) => x),
  }
}

type LiveQueries = Client['liveQuery']

type LiveQueryName = keyof LiveQueries

type LiveQuery = LiveQueries[LiveQueryName]

type UpdateParamFromLiveQuery<T extends LiveQuery> = Parameters<
  Parameters<T>[1]
>[0]

/**
 * Creates a live query that initializes with svelte#onMount and aborts on unmount.
 *
 * @param operation Wundergraph generated live query
 * @param onUpdate Function to run when query is updated
 */
export const createSubscription = <T extends LiveQuery>(
  operation: T,
  onUpdate: (response: UpdateParamFromLiveQuery<T>) => void
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

type Queries = Client['query']

type QueryName = keyof Queries

type Query = Queries[QueryName]

type OptionsFromQuery<T extends Query> = Parameters<T>[0]

export const useQuery = <
  Q extends Query,
  O extends OptionsFromQuery<Q>,
  R extends Awaited<ReturnType<Q>>
>(
  operation: Q,
  options?: O
) => {
  type State = 'idle' | 'loading' | 'loaded'

  const state = writable<State>('loading')
  const response = writable<R>(null)

  const fetchResult = () =>
    operation((options || {}) as {}).then((res) => {
      state.set('loaded')
      response.set(res)
    })

  fetchResult()

  return {
    state: derived(state, (x) => x),
    response: derived(response, (x) => x),
    refetch: fetchResult,
  }
}

type Mutations = Client['mutation']

type MutationName = keyof Mutations

type Mutation = Mutations[MutationName]

type OptionsFromMutation<T extends Mutation> = Parameters<T>[0]

export const useMutation = <
  M extends Mutation,
  O extends OptionsFromMutation<M>,
  R extends Awaited<ReturnType<M>>
>(
  operation: M,
  initialOptions?: O
) => {
  type State = 'idle' | 'loading' | 'loaded'

  const state = writable<State>('idle')
  const response = writable<R>(null)

  return {
    state: derived(state, (x) => x),
    response: derived(response, (x) => x),
    mutate(options: O) {
      return Promise.resolve()
        .then(() => state.set('loading'))
        .then(() =>
          operation((options || initialOptions || {}) as {}).then((res) => {
            state.set('loaded')
            response.set(res)
            return res as Promise<R>
          })
        )
    },
  }
}
