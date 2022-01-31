import adapter from '@sveltejs/adapter-auto'
import preprocess from 'svelte-preprocess'
import { defineConfig, searchForWorkspaceRoot } from 'vite'

/** @type {import('@sveltejs/kit').Config} */
const config = {
  // Consult https://github.com/sveltejs/svelte-preprocess
  // for more information about preprocessors
  preprocess: preprocess(),

  kit: {
    adapter: adapter(),

    // hydrate the <div id="svelte"> element in src/app.html
    target: '#svelte',

    vite: defineConfig({
      server: {
        fs: {
          allow: [
            // search up for workspace root
            searchForWorkspaceRoot(process.cwd()),
            // your custom rules
            '.wundergraph/generated/*.ts',
          ],
        },
      },
    }),
  },
}

export default config
