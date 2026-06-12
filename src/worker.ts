import { Container, getContainer } from '@cloudflare/containers';
import { Hono } from 'hono';
import { attachSvelteRoutes, svelteRenderer } from 'svelte-hono';
import { bundles } from './bundles.generated';
import { publicAssets } from './public.generated';
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

const origin = 'https://tuiport.coey.dev';
const repository = 'https://github.com/acoyfellow/tuiport';

const pages = {
  '/': {
    section: 'home',
    title: 'Tuiport — A Shared Terminal Interface for Agents and Humans',
    description:
      'A shared terminal interface for agents and humans, built with OpenTUI and served over real SSH from a Cloudflare Container.',
    eyebrow: 'OpenTUI · SSH · Cloudflare Containers',
  },
  '/tutorial': {
    section: 'tutorial',
    title: 'Deploy OpenTUI over SSH to Cloudflare — Tuiport Tutorial',
    description:
      'Deploy Tuiport to your Cloudflare account, configure the authenticated relay, add Spectrum, and connect with an ordinary SSH client.',
    eyebrow: 'Tutorial · get a working deployment',
  },
  '/how-to': {
    section: 'how-to',
    title: 'Customize OpenTUI SSH on Cloudflare — Tuiport How-to Guides',
    description:
      'Customize the OpenTUI renderer, restrict SSH keys, rotate relay credentials, run locally, and configure a custom hostname.',
    eyebrow: 'How-to · solve a specific problem',
  },
  '/reference': {
    section: 'reference',
    title: 'Tuiport Reference — Routes, Ports, and Cloudflare Resources',
    description:
      'Exact Tuiport contracts for Worker routes, Container ports, Durable Objects, secrets, authentication, and runtime lifecycle.',
    eyebrow: 'Reference · exact contracts',
  },
  '/explanation': {
    section: 'explanation',
    title: 'Why OpenTUI SSH Needs a TCP Bridge on Cloudflare — Tuiport',
    description:
      'Understand the narrow TCP-to-WebSocket bridge between Cloudflare Spectrum and an OpenTUI SSH server inside a Cloudflare Container.',
    eyebrow: 'Explanation · why the bridge exists',
  },
  '/offline': {
    section: 'offline',
    title: 'Tuiport is offline',
    description:
      'The cached Tuiport documentation shell is available while the network is offline.',
    eyebrow: 'Offline · cached documentation',
    noindex: true,
  },
} as const;

type Page = {
  section: string;
  title: string;
  description: string;
  eyebrow: string;
  noindex?: boolean;
};

function escapeHtml(value: string): string {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
}

function pageHead(path: string, page: Page): string {
  const canonical = `${origin}${path === '/' ? '/' : path}`;
  const image = `${origin}/og-card.png`;
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        '@id': `${origin}/#application`,
        name: 'Tuiport',
        applicationCategory: 'DeveloperApplication',
        operatingSystem: 'Any terminal with an SSH client',
        description: pages['/'].description,
        url: origin,
        codeRepository: repository,
        license: 'https://opensource.org/license/mit',
        isAccessibleForFree: true,
        author: { '@type': 'Person', name: 'Jordan Coeyman', url: 'https://coey.dev' },
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      },
      {
        '@type': 'WebSite',
        '@id': `${origin}/#website`,
        name: 'Tuiport',
        url: origin,
        description: pages['/'].description,
        inLanguage: 'en-US',
      },
      {
        '@type': 'Article',
        headline: page.title,
        description: page.description,
        url: canonical,
        mainEntityOfPage: canonical,
        image,
        inLanguage: 'en-US',
        datePublished: '2026-06-12',
        dateModified: '2026-06-12',
        author: { '@type': 'Person', name: 'Jordan Coeyman', url: 'https://coey.dev' },
      },
      ...(path === '/'
        ? []
        : [
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                { '@type': 'ListItem', position: 1, name: 'Tuiport', item: `${origin}/` },
                { '@type': 'ListItem', position: 2, name: page.section, item: canonical },
              ],
            },
          ]),
    ],
  };

  return `
<meta name="description" content="${escapeHtml(page.description)}">
<meta name="author" content="Jordan Coeyman">
<meta name="robots" content="${'noindex' in page && page.noindex ? 'noindex, nofollow' : 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1'}">
<link rel="canonical" href="${canonical}">
<link rel="manifest" href="/manifest.webmanifest">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="icon" href="/favicon-32x32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
<link rel="alternate" href="/llms.txt" type="text/plain" title="LLM documentation">
<meta name="theme-color" content="#0b1118">
<meta name="application-name" content="Tuiport">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Tuiport">
<meta name="mobile-web-app-capable" content="yes">
<meta name="msapplication-TileColor" content="#0b1118">
<meta name="msapplication-config" content="/browserconfig.xml">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Tuiport">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${escapeHtml(page.title)}">
<meta property="og:description" content="${escapeHtml(page.description)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${image}">
<meta property="og:image:secure_url" content="${image}">
<meta property="og:image:type" content="image/png">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="Tuiport — your terminal is the interface for agents and humans">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escapeHtml(page.title)}">
<meta name="twitter:description" content="${escapeHtml(page.description)}">
<meta name="twitter:image" content="${image}">
<meta name="twitter:image:alt" content="Tuiport — your terminal is the interface for agents and humans">
<script type="application/ld+json">${JSON.stringify(schema).replaceAll('<', '\\u003c')}</script>`;
}

function decodeAsset(body: string): Uint8Array<ArrayBuffer> {
  const binary = atob(body);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

const app = new Hono<{ Bindings: Env }>();
// svelte-hono's route helper does not yet preserve a custom Hono bindings type.
// @ts-expect-error The helper only adds static bundle routes and does not inspect bindings.
attachSvelteRoutes(app, { bundles });

for (const [path, asset] of Object.entries(publicAssets)) {
  app.get(path, () => {
    const cacheControl =
      path === '/sw.js' || path === '/manifest.webmanifest'
        ? 'public, max-age=0, must-revalidate'
        : asset.immutable
          ? 'public, max-age=31536000, immutable'
          : 'public, max-age=3600';
    return new Response(decodeAsset(asset.body), {
      headers: {
        'content-type': asset.type,
        'cache-control': cacheControl,
        ...(path === '/sw.js' ? { 'service-worker-allowed': '/' } : {}),
        'x-content-type-options': 'nosniff',
      },
    });
  });
}

for (const [path, page] of Object.entries(pages)) {
  app.get(
    path,
    svelteRenderer(Site, {
      hydrateAs: 'site',
      title: page.title,
      head: pageHead(path, page),
      props: { section: page.section, eyebrow: page.eyebrow },
    }),
  );
}

app.get('/api/health', (c) => c.json({ edge: 'ok' }));

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

const notFoundPage = {
  section: 'not-found',
  title: 'Page not found — Tuiport',
  description: 'The requested Tuiport documentation page does not exist.',
  eyebrow: '404 · page not found',
  noindex: true,
} as const;
const renderNotFound = svelteRenderer(Site, {
  hydrateAs: 'site',
  title: notFoundPage.title,
  head: pageHead('/404', notFoundPage),
  props: { section: notFoundPage.section, eyebrow: notFoundPage.eyebrow },
});

app.notFound(async (c) => {
  const response = (await renderNotFound(c, async () => undefined)) as Response;
  return new Response(response.body, { status: 404, headers: response.headers });
});

export default app;
