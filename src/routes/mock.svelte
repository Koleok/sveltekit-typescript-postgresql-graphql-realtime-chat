<script lang="ts">
  import Json from '$lib/JSON.svelte'
  import { createWundergraphStore } from '$lib/wundergraph.store'

  const { client } = createWundergraphStore()

  const mockQuery = client.query.MockQuery({})
</script>

<h2>Mock</h2>
<p>
  mock
  {#await mockQuery}
    Loading...
  {:then res}
    {#if res.status === 'ok'}
      <Json data={res.body.data} />
    {/if}
  {/await}
</p>
