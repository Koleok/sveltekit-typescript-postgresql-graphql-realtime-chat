<script lang="ts">
</script>

<nav>
  <ul>
    <li><a href="/">Home</a></li>
    <li><a href="/mock">Mock</a></li>
    <li><a href="/updateuser">Update User</a></li>
  </ul>
</nav>

<div class="container">
  <slot />
</div>

<style>
  .container {
    display: flex;
    flex-direction: column;
    align-items: center;
    height: 100%;
  }

  ul {
    display: flex;
    justify-content: space-between;
    flex-direction: row;
    flex-wrap: wrap;
    padding: 0;
    margin-bottom: 5em;
  }

  li {
    flex: 1;
    padding: 1em 0;
    max-width: 10em;
    list-style: none;
    text-align: center;
    background: #181818;
    border-radius: 6px;
    cursor: pointer;
  }
</style>
