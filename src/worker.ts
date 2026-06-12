import { Container, getContainer } from '@cloudflare/containers';
import { Hono } from 'hono';
import { attachSvelteRoutes, svelteRenderer } from 'svelte-hono';
import { bundles } from './bundles.generated';
// @ts-expect-error esbuild-svelte provides the component module at build time.
import Site from './site.svelte';

interface Env {
  TUIPORT: DurableObjectNamespace<TuiportContainer>;
  RELAY_TOKEN: string;
  SSH_HOST_KEY_B64: string;
}

export class TuiportContainer extends Container<Env> {
  defaultPort = 8080;
  requiredPorts = [8080, 2222];
  sleepAfter = '10m';
  envVars = {
    SSH_HOST_KEY_B64: this.env.SSH_HOST_KEY_B64 || '',
  };
}

const app = new Hono<{ Bindings: Env }>();
// svelte-hono's route helper does not yet preserve a custom Hono bindings type.
// @ts-expect-error The helper only adds static bundle routes and does not inspect bindings.
attachSvelteRoutes(app, { bundles });

const pages = {
  '/': {
    section: 'home',
    title: 'Tuiport — OpenTUI over SSH on Cloudflare',
    eyebrow: 'OpenTUI · SSH · Cloudflare Containers',
  },
  '/tutorial': {
    section: 'tutorial',
    title: 'Tutorial — Tuiport',
    eyebrow: 'Tutorial · get a working deployment',
  },
  '/how-to': {
    section: 'how-to',
    title: 'How-to guides — Tuiport',
    eyebrow: 'How-to · solve a specific problem',
  },
  '/reference': {
    section: 'reference',
    title: 'Reference — Tuiport',
    eyebrow: 'Reference · exact contracts',
  },
  '/explanation': {
    section: 'explanation',
    title: 'Architecture — Tuiport',
    eyebrow: 'Explanation · why the bridge exists',
  },
} as const;

for (const [path, page] of Object.entries(pages)) {
  app.get(
    path,
    svelteRenderer(Site, {
      hydrateAs: 'site',
      title: page.title,
      props: { section: page.section, eyebrow: page.eyebrow },
    }),
  );
}

app.get('/api/health', async (c) => {
  const container = getContainer(c.env.TUIPORT, 'default');
  const response = await container.fetch(new Request('http://container/health'));
  return c.json({ edge: 'ok', container: response.ok ? 'ok' : 'starting' });
});

app.get('/bridge', async (c) => {
  if (c.req.header('upgrade')?.toLowerCase() !== 'websocket') {
    return c.text('WebSocket upgrade required', 426);
  }
  const supplied = c.req.header('authorization');
  if (!c.env.RELAY_TOKEN || supplied !== `Bearer ${c.env.RELAY_TOKEN}`) {
    return c.text('Unauthorized', 401);
  }
  return getContainer(c.env.TUIPORT, 'default').fetch(c.req.raw);
});

app.notFound((c) => c.redirect('/'));

export default app;
