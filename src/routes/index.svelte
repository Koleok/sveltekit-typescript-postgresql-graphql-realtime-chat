<script context="module" lang="ts">
  import { fade } from 'svelte/transition'
  import { Client } from '../../.wundergraph/generated/client'
  import type { Load } from '@sveltejs/kit'

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
  import { createWundergraphStore } from '$lib/wundergraph.store'
  import type { User } from '../../.wundergraph/generated/client'
  import type { Message } from '../lib/types'

  export let serverSideUser: User
  export let serverSideMessages: Message[]

  const { client, user: clientSideUser, initialized } = createWundergraphStore()

  let message = ''
  let messages: Message[] = !clientSideUser ? serverSideMessages : []

  client.liveQuery.Messages({ refetchOnWindowFocus: true }, (res) => {
    if (res.status === 'ok') {
      messages = res.body.data?.findManymessages.reverse()
    }
  })

  const addMessage = (message: string) =>
    client.mutation.AddMessage({ input: { message } })

  const logout = async () => {
    await client.logout()
    window.location.reload()
  }

  const userInfo = client.query.UserInfo({})

  const user =
    typeof window !== 'undefined' && $initialized
      ? $clientSideUser
      : serverSideUser
</script>

<div class="container">
  {#if user}
    <h2>User</h2>
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
            {#await userInfo}
              <td>loading...</td>
            {:then info}
              {#if info.status === 'ok' && info.body.data?.findFirstusers?.lastlogin}
                <td>{info.body.data.findFirstusers.lastlogin}</td>
              {/if}
            {/await}
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

      <button on:click={() => addMessage(message)}> submit </button>
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
            <tr transition:fade>
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
