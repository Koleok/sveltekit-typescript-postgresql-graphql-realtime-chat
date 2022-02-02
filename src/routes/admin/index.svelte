<script context="module" lang="ts">
  import type { Load } from '@sveltejs/kit'
  import { getMessagesByUser } from '$lib/utils'
  import { Client } from '../../../.wundergraph/generated/client'

  export const prerender = true

  export const load: Load = async () => {
    const client = new Client()
    const messageQuery = await client.query.Messages({})
    const messages =
      messageQuery.status === 'ok'
        ? messageQuery.body.data?.findManymessages
        : []

    return {
      props: {
        serverSideAggregation: getMessagesByUser(messages),
      },
    }
  }
</script>

<script lang="ts">
  import {
    createSubscription,
    createWundergraphStore,
  } from '$lib/wundergraph.store'
  import type { Aggregation } from '$lib/utils'

  export let serverSideAggregation: Aggregation

  const { client, user, clientState } = createWundergraphStore()

  let email = ''
  let deletedMessages = ''
  let messageAggregation: Aggregation = serverSideAggregation

  createSubscription(client.liveQuery.Messages, (res) => {
    if (res.status === 'ok') {
      messageAggregation = getMessagesByUser(res.body.data?.findManymessages)
    }
  })

  // Demonstration of running a mutation without the the svelte-store based utility
  const deleteAllMessagesFrom = (email: string) =>
    client.mutation
      .DeleteAllMessagesByUserEmail({ input: { email } })
      .then((res) => {
        if (res.status === 'ok') {
          deletedMessages = res.body.data.deleteManymessages.count.toString()
        }
      })

  $: disabled =
    $clientState === 'initialized' ? !$user.roles.includes('superadmin') : false

  $: if ($user) {
    // prefill the email field with users own email
    email = $user.email
  }
</script>

<div>
  <h1>Admin</h1>

  <h2>Delete all messages by user email</h2>
  <fieldset {disabled}>
    <label>
      <input
        type="email"
        value={email}
        placeholder={$user?.email}
        on:change={(e) => (email = e.target['value'])}
      />
    </label>

    <button on:click={() => deleteAllMessagesFrom(email)}>
      Delete all messages by user email
    </button>

    {#if disabled}
      <p>
        <em>Only superadmin users can delete other users messages</em>
      </p>
    {/if}

    {#if deletedMessages}
      <p>
        <em>{`deleted: ${deletedMessages} messages`}</em>
      </p>
    {/if}
  </fieldset>

  <h2>Messages By User</h2>
  <fieldset>
    <table>
      <thead>
        <tr>
          <th>Email</th>
          <th>Message Count</th>
        </tr>
      </thead>
      <tbody>
        {#each messageAggregation as [email, count]}
          <tr>
            <td>{email}</td>
            <td>{count}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </fieldset>
</div>

<style>
  fieldset {
    display: flex;
    flex-direction: column;
  }

  button,
  input {
    width: 50%;
  }
</style>
