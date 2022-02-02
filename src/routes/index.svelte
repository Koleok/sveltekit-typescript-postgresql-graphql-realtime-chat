<script context="module" lang="ts">
  import { Client } from '../../.wundergraph/generated/client'
  import type { Load } from '@sveltejs/kit'

  export const prerender = true

  export const load: Load = async () => {
    const client = new Client()

    const user = await client.fetchUser()
    const messageQuery = await client.query.Messages({})
    const messages =
      messageQuery.status === 'ok'
        ? messageQuery.body.data?.findManymessages.reverse()
        : []

    return {
      props: {
        serverSideUser: user || null,
        serverSideMessages: messages,
      },
    }
  }
</script>

<script lang="ts">
  import { browser } from '$app/env'
  import type { Message } from '$lib/types'
  import type { User } from '../../.wundergraph/generated/client'
  import {
    createSubscription,
    createWundergraphStore,
    useMutation,
    useQuery,
  } from '$lib/wundergraph.store'

  export let serverSideUser: User
  export let serverSideMessages: Message[]

  const {
    client,
    user: clientSideUser,
    clientState,
    logout,
  } = createWundergraphStore()

  let message = ''
  let messages = serverSideMessages

  createSubscription(client.liveQuery.Messages, (res) => {
    if (res.status === 'ok') {
      messages = res.body.data?.findManymessages.reverse()
    }
  })

  const { mutate: addMessage } = useMutation(client.mutation.AddMessage)
  const { response: userQuery, state: userQueryState } = useQuery(
    client.query.UserInfo
  )

  $: user =
    browser && $clientState === 'initialized' ? $clientSideUser : serverSideUser
</script>

<h1>Home</h1>

<div class="container">
  {#if user}
    <h3>User</h3>
    <fieldset>
      <table>
        <tbody>
          <tr>
            <td>Name</td>
            <td>{user.name}</td>
          </tr>
          <tr>
            <td>Email</td>
            <td>{user.email}</td>
          </tr>
          <tr>
            <td>Roles</td>
            <td>{user.roles}</td>
          </tr>
          <tr>
            <td>Last Login</td>
            {#if $userQueryState === 'loading'}
              <td>loading...</td>
            {:else if $userQueryState === 'loaded'}
              {#if $userQuery.status === 'ok' && $userQuery.body.data?.findFirstusers?.lastlogin}
                <td>{$userQuery.body.data.findFirstusers.lastlogin}</td>
              {/if}
            {/if}
          </tr>
        </tbody>
      </table>

      <button on:click={logout}> Logout </button>
    </fieldset>

    <h3>Add Message</h3>
    <fieldset>
      <input
        placeholder="message"
        value={message}
        on:change={(e) => (message = e.target['value'])}
      />

      <button on:click={() => addMessage({ input: { message } })}>
        submit
      </button>
    </fieldset>
  {:else}
    <div>
      <p>Please Login to be able to use the chat!</p>

      <button on:click={() => client.login.github()}>Login GitHub</button>
    </div>
  {/if}

  {#if messages?.length}
    <h3>Messages</h3>

    <fieldset>
      <table>
        <colgroup>
          <col style="width: 15em" />
          <col />
        </colgroup>
        <thead>
          <tr>
            <th>from</th>
            <th>message</th>
          </tr>
        </thead>
        <tbody>
          {#each messages as message}
            <tr>
              <td>{message.users.name}</td>
              <td>{message.message}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </fieldset>
  {/if}
</div>

<style>
  table {
    column-width: 100px;
  }
</style>
