const origin = process.argv[2] || 'http://127.0.0.1:8787';
const routes = ['/', '/tutorial', '/how-to', '/reference', '/explanation'];

function matches(html: string, pattern: RegExp, name: string): string {
  const values = [...html.matchAll(pattern)].map((match) => match[1]);
  if (values.length !== 1)
    throw new Error(`${name}: expected one match, received ${values.length}`);
  return values[0];
}

for (const route of routes) {
  const url = new URL(route, origin).toString();
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${url}: HTTP ${response.status}`);
  const html = await response.text();
  const title = matches(html, /<title>(.*?)<\/title>/gis, 'title');
  const description = matches(html, /<meta name="description" content="(.*?)"/gis, 'description');
  const canonical = matches(html, /<link rel="canonical" href="(.*?)"/gis, 'canonical');
  const expectedCanonical = new URL(route, 'https://tuiport.coey.dev').toString();

  if (title.length < 35 || title.length > 70)
    throw new Error(`${url}: title length ${title.length}`);
  if (description.length < 120 || description.length > 180) {
    throw new Error(`${url}: description length ${description.length}`);
  }
  if (canonical !== expectedCanonical) {
    throw new Error(`${url}: canonical ${canonical}, expected ${expectedCanonical}`);
  }
  for (const marker of [
    'property="og:title"',
    'property="og:image"',
    'name="twitter:card"',
    'rel="manifest"',
    'application/ld+json',
    '<h1',
  ]) {
    if (!html.includes(marker)) throw new Error(`${url}: missing ${marker}`);
  }
  for (const schema of [
    ...html.matchAll(/<script type="application\/ld\+json">(.*?)<\/script>/gis),
  ]) {
    JSON.parse(schema[1]);
  }
}

const assets: Record<string, string> = {
  '/manifest.webmanifest': 'application/manifest+json',
  '/sw.js': 'text/javascript',
  '/robots.txt': 'text/plain',
  '/sitemap.xml': 'application/xml',
  '/llms.txt': 'text/plain',
  '/icon.svg': 'image/svg+xml',
  '/icons/icon-192.png': 'image/png',
  '/icons/icon-512.png': 'image/png',
  '/icons/icon-maskable-512.png': 'image/png',
  '/icons/apple-touch-icon.png': 'image/png',
  '/og-card.png': 'image/png',
  '/screenshots/desktop.png': 'image/png',
  '/screenshots/mobile.png': 'image/png',
  '/.well-known/security.txt': 'text/plain',
};

for (const [path, type] of Object.entries(assets)) {
  const response = await fetch(new URL(path, origin));
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  if (!response.headers.get('content-type')?.startsWith(type)) {
    throw new Error(`${path}: unexpected content-type ${response.headers.get('content-type')}`);
  }
}

const manifest = await fetch(new URL('/manifest.webmanifest', origin)).then((response) =>
  response.json(),
);
if (manifest.display !== 'standalone') throw new Error('manifest: display must be standalone');
if (manifest.icons.length < 4) throw new Error('manifest: expected at least four icons');
if (manifest.screenshots.length < 2)
  throw new Error('manifest: expected wide and narrow screenshots');
if (manifest.shortcuts.length < 2) throw new Error('manifest: expected application shortcuts');

const robots = await fetch(new URL('/robots.txt', origin)).then((response) => response.text());
if (!robots.includes('Sitemap: https://tuiport.coey.dev/sitemap.xml')) {
  throw new Error('robots.txt: missing sitemap declaration');
}

const notFound = await fetch(new URL('/not-a-real-page', origin));
if (notFound.status !== 404) throw new Error(`404: expected 404, received ${notFound.status}`);
if (!(await notFound.text()).includes('noindex, nofollow')) throw new Error('404: missing noindex');

console.log(`SEO and PWA audit passed for ${origin}`);
