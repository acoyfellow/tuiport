import { buildHonoSvelte } from 'svelte-hono/build';

await buildHonoSvelte({
  workerEntry: './src/worker.ts',
  outDir: './build',
  components: { site: './site.svelte' },
});
