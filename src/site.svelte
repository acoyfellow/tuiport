<script lang="ts">
  import { onMount, tick } from 'svelte';
  import type { Terminal as CloudtermTerminal } from 'cloudterm';

  let { section = 'home', eyebrow = '' } = $props<{ section: string; eyebrow: string }>();
  let copied = $state(false);
  let demoElement = $state<HTMLDivElement | null>(null);
  let demoStatus = $state<'idle' | 'connecting' | 'live' | 'ended' | 'error'>('idle');
  let demoSocket: WebSocket | null = null;
  let demoTerminal: CloudtermTerminal | null = null;
  let pendingDemoSize: { cols: number; rows: number } | null = null;
  let installPrompt = $state<Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> }>();
  const command = 'ssh your-hostname';

  onMount(() => {
    if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');
    const captureInstall = (event: Event) => {
      event.preventDefault();
      installPrompt = event as typeof installPrompt;
    };
    window.addEventListener('beforeinstallprompt', captureInstall);
    return () => {
      window.removeEventListener('beforeinstallprompt', captureInstall);
      demoSocket?.close(1000, 'page left');
      demoTerminal?.destroy();
    };
  });

  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    copied = true;
    setTimeout(() => (copied = false), 1400);
  }

  async function startDemo() {
    if (!demoElement || demoStatus === 'connecting' || demoStatus === 'live') return;
    demoStatus = 'connecting';
    await tick();
    try {
      const { mount } = await import('cloudterm');
      demoTerminal?.destroy();
      demoElement.replaceChildren();
      demoTerminal = await mount(demoElement, {
        predictionMode: 'off',
        theme: {
          background: '#080d13',
          foreground: '#d7e2ec',
          cursor: '#f6821f',
          fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
          fontSize: 12,
        },
        onData: (bytes) => {
          if (demoSocket?.readyState === WebSocket.OPEN) demoSocket.send(bytes);
        },
        onResize: (cols, rows) => {
          pendingDemoSize = { cols, rows };
          if (demoSocket?.readyState === WebSocket.OPEN) {
            demoSocket.send(JSON.stringify({ type: 'resize', cols, rows }));
          }
        },
      });

      const protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const socket = new WebSocket(`${protocol}//${location.host}/ws/demo`);
      socket.binaryType = 'arraybuffer';
      demoSocket = socket;
      socket.onopen = () => {
        demoStatus = 'live';
        if (pendingDemoSize) {
          socket.send(JSON.stringify({ type: 'resize', ...pendingDemoSize }));
        }
        demoTerminal?.focus();
      };
      socket.onmessage = async ({ data }) => {
        if (data instanceof ArrayBuffer) demoTerminal?.write(new Uint8Array(data));
        else if (data instanceof Blob) demoTerminal?.write(new Uint8Array(await data.arrayBuffer()));
        else demoTerminal?.write(data);
      };
      socket.onerror = () => {
        demoStatus = 'error';
      };
      socket.onclose = (event) => {
        demoStatus = event.code === 1000 ? 'ended' : 'error';
        demoSocket = null;
      };
    } catch {
      demoStatus = 'error';
      demoTerminal?.destroy();
      demoTerminal = null;
    }
  }

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    installPrompt = undefined;
  }
</script>

<svelte:head>
  <meta name="theme-color" content="#0b1118" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
</svelte:head>

<header>
  <a class="brand" href="/" aria-label="Tuiport home">
    <svg viewBox="0 0 64 64" role="img" aria-label="Agent Experience orb">
      <defs>
        <radialGradient id="ax-orb" cx="29%" cy="22%" r="78%">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset=".18" stop-color="#dff8ff" />
          <stop offset=".45" stop-color="#71b8d8" />
          <stop offset=".72" stop-color="#f6821f" />
          <stop offset="1" stop-color="#351812" />
        </radialGradient>
        <radialGradient id="ax-orb-core" cx="45%" cy="38%" r="65%">
          <stop offset="0" stop-color="#fff3a8" stop-opacity=".9" />
          <stop offset=".55" stop-color="#ff7a18" stop-opacity=".48" />
          <stop offset="1" stop-color="#ff4f12" stop-opacity="0" />
        </radialGradient>
      </defs>
      <circle class="orb-shell" cx="32" cy="32" r="25" fill="url(#ax-orb)" />
      <circle class="orb-core" cx="37" cy="38" r="15" fill="url(#ax-orb-core)" />
      <path class="orb-glint" d="M17 27c5-11 16-16 27-12" />
      <path class="orb-depth" d="M18 43c10 9 25 8 33-2" />
    </svg>
    <span><strong>Agent Experience</strong><em>Tuiport</em></span>
  </a>
  <nav aria-label="Documentation">
    <a href="/tutorial" aria-current={section === 'tutorial' ? 'page' : undefined}>Tutorial</a><a href="/how-to" aria-current={section === 'how-to' ? 'page' : undefined}>How-to</a><a href="/reference" aria-current={section === 'reference' ? 'page' : undefined}>Reference</a><a href="/explanation" aria-current={section === 'explanation' ? 'page' : undefined}>Why</a>
  </nav>
  {#if installPrompt}<button class="install" onclick={installApp}>Install</button>{/if}
  <a class="github" href="https://github.com/acoyfellow/tuiport">Source <span aria-hidden="true">↗</span></a>
</header>

<main>
  {#if section === 'home'}
    <p class="eyebrow">{eyebrow}</p>
  {:else}
    <nav class="breadcrumb" aria-label="Breadcrumb">
      <a href="/">Tuiport</a><span aria-hidden="true">/</span><span>{eyebrow}</span>
    </nav>
  {/if}

  {#if section === 'home'}
    <section class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="hero-copy">
        <div class="badge"><i></i> Agent Experience / Cloudflare</div>
        <div class="prompt-line" aria-hidden="true"><span>~/agent-experience</span><b>$</b> tuiport</div>
        <h1>Your terminal is<br /><em>the interface.</em></h1>
        <p class="lede">A shared place for agents and humans to meet, work, and stay in flow—one SSH command away. Powered by OpenTUI inside a Cloudflare Container.</p>
        <div class="actions">
          <a class="primary" href="https://deploy.workers.cloudflare.com/?url=https://github.com/acoyfellow/tuiport">Deploy to Cloudflare <span>↘</span></a>
          <a class="secondary" href="/tutorial">Read the tutorial</a>
        </div>
        <div class="hero-meta"><span>Agent Experience / Tuiport</span><span>Open protocol / bounded runtime</span></div>
      </div>
      <div class:demo-active={demoStatus !== 'idle'} class="terminal" role="group" aria-label="Interactive Tuiport session">
        <div class="chrome">
          <span class="state"><i></i> {demoStatus === 'live' ? 'live container' : demoStatus === 'connecting' ? 'starting container' : 'session preview'}</span>
          <span>{demoStatus === 'live' ? 'left/right to explore' : 'ssh · your-hostname'}</span>
        </div>
        <pre aria-hidden={demoStatus !== 'idle'}><b>$</b> ssh your-hostname

┌────────────── tuiport ──────────────┐
│                                     │
│  OpenTUI is running inside a        │
│  Cloudflare Container.              │
│                                     │
│  hello tj · 80×24                   │
│                                     │
│  press q to disconnect              │
│                                     │
└─────────────────────────────────────┘</pre>
        <div bind:this={demoElement} class="demo-host" aria-label="Live terminal"></div>
        {#if demoStatus === 'connecting'}<div class="demo-message">Waking a real Cloudflare Container…</div>{/if}
        {#if demoStatus === 'error'}<div class="demo-message">The live demo is busy or unavailable. Try again.</div>{/if}
        {#if demoStatus === 'ended'}<div class="demo-message">Session closed. Start another when you are ready.</div>{/if}
        <div class="terminal-actions">
          <button class="start-demo" onclick={startDemo} disabled={demoStatus === 'connecting' || demoStatus === 'live'}>{demoStatus === 'live' ? 'connected' : demoStatus === 'connecting' ? 'starting…' : demoStatus === 'ended' ? 'start again' : 'try the live demo'}</button>
          {#if demoStatus === 'idle'}<button class="copy-command" onclick={copyCommand}>{copied ? 'copied!' : 'copy SSH command'}</button>{/if}
        </div>
      </div>
    </section>

    <div class="flow" role="group" aria-label="Architecture">
      <div><b>01</b><strong>SSH client</strong><span>unchanged OpenSSH</span></div><i>→</i>
      <div><b>02</b><strong>TCP relay</strong><span>bytes only</span></div><i>→</i>
      <div class="cloud"><b>03</b><strong>Cloudflare</strong><span>Worker · DO · Container</span></div><i>→</i>
      <div><b>04</b><strong>OpenTUI</strong><span>your application</span></div>
    </div>

    <div class="cards">
      <article><span>01</span><h2>Real SSH</h2><p>No browser terminal and no custom client. PTYs, resize events, SSH keys, and terminal capabilities arrive intact.</p></article>
      <article><span>02</span><h2>Tiny boundary</h2><p>The relay terminates nothing. It forwards opaque bytes over an authenticated WebSocket; the SSH server stays in your Container.</p></article>
      <article><span>03</span><h2>Made to disappear</h2><p>When Cloudflare accepts inbound TCP natively, remove the relay. The app and its OpenTUI session code do not change.</p></article>
    </div>
  {:else if section === 'tutorial'}
    <article class="doc"><h1>Deploy Tuiport</h1><p class="summary">Get the sample OpenTUI application running in your Cloudflare account, then connect a public SSH hostname.</p>
      <h2>1. Deploy the Cloudflare side</h2><p>Use the button. Cloudflare forks the repository, builds the Worker and Container, and connects future pushes to Workers Builds.</p>
      <p><a class="primary" href="https://deploy.workers.cloudflare.com/?url=https://github.com/acoyfellow/tuiport">Deploy to Cloudflare</a></p>
      <h2>2. Choose a relay secret</h2><pre><code>openssl rand -hex 32
bunx wrangler secret put RELAY_TOKEN</code></pre><p>Use the same value when starting the relay.</p>
      <h2>3. Run the relay</h2><pre><code>cd relay
go build
./tuiport-relay \
  -listen :22 \
  -upstream wss://YOUR-WORKER.workers.dev/bridge \
  -token "$RELAY_TOKEN"</code></pre>
      <h2>4. Put Spectrum in front</h2><p>Create one Spectrum SSH application. Route <code>ssh.example.com:22</code> to the relay's public TCP address on port 22.</p>
      <h2>5. Connect</h2><pre><code>ssh ssh.example.com</code></pre><p>The sample accepts any valid public key and uses its verified fingerprint as identity. Replace that policy before serving private data.</p>
    </article>
  {:else if section === 'how-to'}
    <article class="doc"><h1>How-to guides</h1><p class="summary">Small recipes for changing the shipped proof.</p>
      <h2>Render your OpenTUI application</h2><p>Edit <code>container/server.ts</code>. The callback passed to <code>.serve()</code> receives a renderer already bound to the SSH channel. Add core renderables or adopt it with OpenTUI React or Solid.</p>
      <h2>Restrict SSH keys</h2><pre><code>createServer(&#123;
  auth: &#123;
    publicKey: &#123; authorizedKeys: '/app/authorized_keys' &#125;
  &#125;
&#125;)</code></pre>
      <h2>Run locally</h2><pre><code>cp .dev.vars.example .dev.vars
bun install
bun run dev</code></pre><p>Container development requires Docker. Test the container directly with <code>ssh -p 2222 localhost</code>.</p>
      <h2>Change the hostname</h2><p>The web/docs hostname is a Worker custom domain. The SSH hostname is a Spectrum application; it can be the same DNS name because HTTPS and SSH use different ports.</p>
    </article>
  {:else if section === 'reference'}
    <article class="doc"><h1>Reference</h1><p class="summary">Ports, endpoints, bindings, and trust boundaries.</p>
      <table><tbody>
        <tr><th><code>GET /</code></th><td>Public svelte-hono documentation.</td></tr>
        <tr><th><code>GET /api/health</code></th><td>Reports Worker readiness without waking the Container.</td></tr>
        <tr><th><code>WS /bridge</code></th><td>Opaque SSH byte stream. Requires <code>Authorization: Bearer …</code>.</td></tr>
        <tr><th><code>:8080</code></th><td>Container HTTP and WebSocket bridge.</td></tr>
        <tr><th><code>:2222</code></th><td><code>@opentui/ssh</code> inside the Container.</td></tr>
      </tbody></table>
      <h2>Cloudflare resources</h2><ul><li>one Worker</li><li>one Durable Object namespace</li><li>one Container application, maximum one lite instance</li></ul>
      <h2>Environment</h2><p><code>RELAY_TOKEN</code> is the only secret. It authenticates the relay to the Worker; it does not authenticate SSH users.</p>
      <h2>Lifecycle</h2><p>The Container sleeps after ten minutes without Worker traffic. The first new connection starts it. An active bridge keeps it in use.</p>
    </article>
  {:else if section === 'explanation'}
    <article class="doc"><h1>Why Tuiport has a relay</h1><p class="summary">Cloudflare can host the complete application today, but it cannot yet accept the first raw TCP byte directly into a Worker or Container.</p>
      <h2>The missing edge</h2><p>Workers TCP sockets are outbound. Container ports are reachable through their Durable Object, but only over HTTP/WebSocket fetches. Cloudflare Tunnel can expose SSH when the client runs <code>cloudflared</code>; that changes the desired <code>ssh host</code> experience.</p>
      <h2>The narrow bridge</h2><p>Spectrum accepts public SSH traffic. Today its raw TCP origin must have a reachable TCP address; Spectrum-to-Tunnel supports HTTP/HTTPS only. Tuiport therefore uses a stateless TCP-to-WebSocket relay. It cannot decrypt SSH and stores no session state.</p>
      <h2>Deletion is the design</h2><p>The application speaks SSH only inside the Container. Native inbound TCP can replace the relay and WebSocket route without rewriting the OpenTUI app. This repository is both a working proof and a precise request for that platform seam.</p>
    </article>
  {:else if section === 'offline'}
    <article class="doc"><h1>You are offline.</h1><p class="summary">The Tuiport application shell is cached. Reconnect to refresh the documentation or open a page you have visited before.</p><p><a class="secondary" href="/">Return home</a></p></article>
  {:else}
    <article class="doc"><h1>That page is not here.</h1><p class="summary">The documentation may have moved, or the address may be incomplete.</p><p><a class="secondary" href="/">Return to Tuiport</a></p></article>
  {/if}
</main>

<footer><span>Cloudflare / Agent Experience</span><span>TUIPORT · MIT · 0.0.1</span><a href="https://coey.dev">coey.dev ↗</a></footer>

<style>
  :global(:root){color-scheme:dark;--font-sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--font-mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;--ax-ink:#0b1118;--ax-layer:#111a24;--ax-layer-2:#182431;--ax-layer-3:#223141;--ax-text:#f7f9fb;--ax-muted:#9baaba;--ax-border:rgba(174,196,216,.14);--ax-border-strong:rgba(174,196,216,.27);--ax-orange:#f6821f;--ax-amber:#f7b53b;--ax-orange-soft:rgba(246,130,31,.12);--ax-blue:#2678a4;--ax-blue-light:#71b8d8;--ax-blue-soft:rgba(74,154,194,.13);--ax-green:#63d5a2;--ax-green-soft:rgba(59,207,145,.11);--radius-sm:.25rem;--radius-md:.45rem;--radius-lg:.7rem}
  :global(*){box-sizing:border-box}:global(html){scroll-behavior:smooth}:global(body){min-width:320px;margin:0;background:var(--ax-ink);color:var(--ax-text);font-family:var(--font-sans);font-synthesis:none}:global(a){color:inherit}:global(code),pre{font-family:var(--font-mono)}:global(::selection){background:var(--ax-orange);color:#170900}
  header,footer,main{width:min(100%,1280px);margin-inline:auto;padding-inline:28px}header{height:76px;display:flex;align-items:center;border-bottom:1px solid var(--ax-border);gap:36px}.brand{display:flex;align-items:center;gap:.65rem;text-decoration:none}.brand svg{width:2.15rem;overflow:visible;flex:none;filter:drop-shadow(0 5px 9px rgba(10,23,34,.42))}.brand span{display:grid;line-height:1;letter-spacing:-.025em}.brand strong{font-size:.9rem}.brand em{margin-top:.28rem;color:var(--ax-muted);font:400 .66rem/1 var(--font-mono);font-style:normal;letter-spacing:.01em}.orb-shell{stroke:rgba(255,255,255,.34);stroke-width:1}.orb-core{mix-blend-mode:screen}.orb-glint{fill:none;stroke:rgba(255,255,255,.74);stroke-width:4;stroke-linecap:round}.orb-depth{fill:none;stroke:rgba(37,15,11,.24);stroke-width:3;stroke-linecap:round}header>nav{display:flex;gap:24px;margin-left:auto}header>nav a,.github{color:var(--ax-muted);font:500 .68rem/1 var(--font-mono);text-decoration:none;text-transform:uppercase;letter-spacing:.045em;transition:.15s}header>nav a:hover,.github:hover{color:var(--ax-text)}.github,.install{border:1px solid var(--ax-border-strong);border-radius:var(--radius-md);padding:.65rem .75rem}.install{color:#1d0b00;background:var(--ax-orange);border-color:var(--ax-orange);font:650 .68rem/1 var(--font-sans);cursor:pointer}.install:hover{background:#ff9b49}header>nav a[aria-current='page']{color:var(--ax-text)}
  main{padding-block:72px 112px}.eyebrow{display:flex;align-items:center;gap:.55rem;margin:0 0 28px;color:var(--ax-orange);font:600 .68rem/1 var(--font-mono);letter-spacing:.12em;text-transform:uppercase}.eyebrow::before{content:'';width:1.25rem;height:1px;background:currentColor}.breadcrumb{display:flex;align-items:center;gap:.55rem;margin:0 0 28px;color:var(--ax-muted);font:600 .68rem/1 var(--font-mono);letter-spacing:.08em;text-transform:uppercase}.breadcrumb a{color:var(--ax-orange);text-decoration:none}.breadcrumb a:hover{text-decoration:underline;text-underline-offset:3px}.breadcrumb span:last-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.hero{position:relative;display:grid;grid-template-columns:minmax(20rem,.78fr) minmax(30rem,1.22fr);gap:clamp(34px,5vw,72px);align-items:center;min-height:500px;padding:clamp(30px,5vw,68px);border:1px solid var(--ax-border);border-radius:var(--radius-lg);background:linear-gradient(110deg,rgba(8,13,19,.98),rgba(13,31,43,.9));overflow:hidden}.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:4rem 4rem;mask-image:linear-gradient(90deg,#000,transparent 80%);pointer-events:none}.hero-glow{position:absolute;right:-3%;top:5%;width:min(44rem,57%);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 31% 24%,rgba(255,255,255,.2),rgba(113,184,216,.13) 22%,rgba(38,120,164,.12) 47%,rgba(246,130,31,.1) 68%,rgba(53,24,18,.08) 82%,transparent 83%);box-shadow:inset 0 0 42px rgba(255,255,255,.035),0 0 100px rgba(38,120,164,.09);pointer-events:none}.hero-copy,.terminal{position:relative;z-index:1}.badge{display:inline-flex;align-items:center;gap:.5rem;width:max-content;padding:.4rem .55rem;border:1px solid var(--ax-border-strong);border-radius:999px;color:#d7e5ec;background:rgba(8,13,19,.55);backdrop-filter:blur(8px);font:600 .58rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.055em}.badge i{width:.42rem;height:.42rem;border-radius:50%;background:var(--ax-orange);box-shadow:0 0 0 3px var(--ax-orange-soft)}.prompt-line{display:flex;align-items:center;gap:.65rem;margin:1.75rem 0 .75rem;color:var(--ax-muted);font:500 .68rem/1 var(--font-mono)}.prompt-line span{color:var(--ax-blue-light)}.prompt-line b{color:var(--ax-orange);font-weight:600}h1{max-width:18ch;margin:0 0 1.25rem;font-family:var(--font-mono);font-size:clamp(1.95rem,2.65vw,2.75rem);line-height:1.08;letter-spacing:-.05em;font-weight:600}h1 em{color:var(--ax-text);font-style:normal;font-weight:500}.lede,.summary{max-width:650px;color:#c8d4dd;font-size:clamp(1rem,1.6vw,1.18rem);line-height:1.65}.actions{display:flex;gap:.65rem;margin-top:2rem}.primary,.secondary{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;min-height:2.7rem;padding:0 1rem;border-radius:var(--radius-md);font-size:.76rem;font-weight:650;text-decoration:none;transition:.15s}.primary{border:1px solid var(--ax-orange);background:var(--ax-orange);color:#1d0b00}.primary:hover{background:#ff9b49}.secondary{border:1px solid var(--ax-border-strong);background:var(--ax-layer-2);color:var(--ax-text)}.secondary:hover{border-color:var(--ax-blue-light)}.hero-meta{display:flex;gap:1.4rem;margin-top:2.2rem;color:var(--ax-muted);font:500 .55rem/1.5 var(--font-mono);text-transform:uppercase;letter-spacing:.07em}.hero-meta span:first-child{color:var(--ax-orange)}
  .terminal{position:relative;min-height:368px;text-align:left;padding:0;width:100%;border:1px solid var(--ax-border-strong);border-radius:var(--radius-lg);background:#080d13;color:#d7e2ec;box-shadow:0 32px 100px rgba(0,0,0,.42);overflow:hidden;transform:perspective(900px) rotateY(-2deg)}.chrome{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 .85rem;border-bottom:1px solid var(--ax-border);color:var(--ax-muted);font:500 .58rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.05em}.chrome .state{display:flex;align-items:center;gap:.45rem}.chrome i{width:.42rem;height:.42rem;border-radius:50%;background:var(--ax-green);box-shadow:0 0 0 3px var(--ax-green-soft)}.terminal pre{min-height:318px;margin:0;padding:1.6rem;font-size:.76rem;line-height:1.65;color:#d7e2ec;transition:opacity .15s}.terminal pre b{color:var(--ax-orange)}.demo-host{position:absolute;inset:42px 0 0;opacity:0;pointer-events:none}.demo-active .demo-host{opacity:1;pointer-events:auto}.demo-active>pre{opacity:0;pointer-events:none}.demo-message{position:absolute;inset:42px 0 0;z-index:3;display:grid;place-items:center;padding:2rem;color:var(--ax-muted);background:rgba(8,13,19,.84);font:500 .68rem/1.6 var(--font-mono);text-align:center}.terminal-actions{position:absolute;z-index:5;right:.7rem;bottom:.65rem;display:flex;gap:.45rem}.copy-command,.start-demo{padding:.4rem .55rem;border:1px solid var(--ax-border);border-radius:var(--radius-sm);color:var(--ax-muted);background:rgba(17,26,36,.92);font:600 .55rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.05em;cursor:pointer}.start-demo{color:#1d0b00;border-color:var(--ax-orange);background:var(--ax-orange)}.copy-command:hover{color:var(--ax-text);border-color:var(--ax-border-strong)}.start-demo:hover{background:#ff9b49}.start-demo:disabled{cursor:default;opacity:.62}
  .flow{display:grid;grid-template-columns:1fr auto 1fr auto 1.25fr auto 1fr;align-items:center;gap:1rem;margin:1rem 0;border:1px solid var(--ax-border);border-radius:var(--radius-lg);padding:1.2rem;background:var(--ax-layer)}.flow div{display:flex;flex-direction:column;gap:.35rem}.flow b{color:var(--ax-orange);font:600 .58rem/1 var(--font-mono)}.flow strong{font-size:.85rem}.flow span{color:var(--ax-muted);font:500 .58rem/1.4 var(--font-mono)}.flow i{color:#526474}.flow .cloud{padding:.8rem;border-left:2px solid var(--ax-blue-light);background:var(--ax-blue-soft)}.flow .cloud strong{color:var(--ax-blue-light)}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border:1px solid var(--ax-border);border-radius:var(--radius-lg);background:var(--ax-border);overflow:hidden}.cards article{min-height:235px;padding:1.35rem;background:var(--ax-layer)}.cards span{color:var(--ax-orange);font:600 .6rem/1 var(--font-mono)}.cards h2{margin:4rem 0 .65rem;font-size:1.2rem;letter-spacing:-.025em}.cards p,.doc p,.doc li{color:var(--ax-muted);font-size:.84rem;line-height:1.72}
  .doc{width:min(100%,960px);margin:0;padding:0}.doc h1{font-size:clamp(3rem,6vw,5.5rem)}.doc h2{margin-top:3rem;font-size:1.5rem;letter-spacing:-.035em}.doc pre{padding:1.15rem;border:1px solid var(--ax-border);border-radius:var(--radius-lg);background:#080d13;overflow:auto;line-height:1.65}.doc table{width:100%;margin-top:2rem;border-collapse:collapse}.doc th,.doc td{text-align:left;border-bottom:1px solid var(--ax-border);padding:1rem .65rem}.doc td{color:var(--ax-muted)}.doc th{width:195px}
  footer{display:grid;grid-template-columns:1fr auto auto;gap:2rem;padding-block:1.7rem 3.5rem;border-top:1px solid var(--ax-border);color:var(--ax-muted);font:500 .58rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.06em}footer a{color:var(--ax-blue-light);text-decoration:none}
  @media(max-width:1000px){header>nav{display:none}.github{margin-left:auto}.hero{grid-template-columns:1fr;min-height:auto}.terminal{transform:none}.flow{grid-template-columns:1fr;gap:.8rem}.flow>i{display:none}.cards{grid-template-columns:1fr}.cards article{min-height:180px}.cards h2{margin-top:2rem}}
  @media(max-width:600px){header{height:68px;padding-inline:18px}.brand em{display:none}.github{padding:.55rem}.github>span{display:none}main{padding:42px 18px 80px}.hero{padding:26px 20px}h1{font-size:2.2rem}.actions{align-items:stretch;flex-direction:column}.hero-meta{display:grid;gap:.3rem}.terminal pre{min-height:270px;padding:1rem;font-size:.61rem}.chrome{font-size:.49rem}.eyebrow{font-size:.58rem}footer{grid-template-columns:1fr;padding:1.5rem 18px 3rem}footer span:nth-child(2){display:none}}
  @media(prefers-reduced-motion:reduce){:global(html){scroll-behavior:auto}}
</style>
