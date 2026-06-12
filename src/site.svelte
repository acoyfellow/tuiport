<script lang="ts">
  let { section = 'home', eyebrow = '' } = $props<{ section: string; eyebrow: string }>();
  let copied = $state(false);
  const command = 'ssh your-hostname';
  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    copied = true;
    setTimeout(() => (copied = false), 1400);
  }
</script>

<svelte:head>
  <meta name="description" content="Serve OpenTUI applications over SSH from a Cloudflare Container." />
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
    <span><strong>Agent Experience</strong><em>Tuiport / Field experiment 001</em></span>
  </a>
  <nav aria-label="Documentation">
    <a href="/tutorial">Tutorial</a><a href="/how-to">How-to</a><a href="/reference">Reference</a><a href="/explanation">Why</a>
  </nav>
  <a class="github" href="https://github.com/acoyfellow/tuiport">Source <span aria-hidden="true">↗</span></a>
</header>

<main>
  <p class="eyebrow">{eyebrow}</p>

  {#if section === 'home'}
    <section class="hero">
      <div class="hero-grid" aria-hidden="true"></div>
      <div class="hero-glow" aria-hidden="true"></div>
      <div class="hero-copy">
        <div class="badge"><i></i> Agent Experience / Cloudflare</div>
        <h1>OpenTUI on Cloudflare.<br /><em>One SSH command away.</em></h1>
        <p class="lede">A working field experiment for agents and humans who live in terminals. Tuiport runs the SSH server, session, and interface inside a Cloudflare Container.</p>
        <div class="actions">
          <a class="primary" href="https://deploy.workers.cloudflare.com/?url=https://github.com/acoyfellow/tuiport">Deploy to Cloudflare <span>↘</span></a>
          <a class="secondary" href="/tutorial">Read the tutorial</a>
        </div>
        <div class="hero-meta"><span>AX–FIELD–001</span><span>Open protocol / bounded runtime</span></div>
      </div>
      <button class="terminal" onclick={copyCommand} aria-label="Copy SSH command">
        <div class="chrome"><span class="state"><i></i> live session</span><span>ssh · your-hostname</span></div>
        <pre><b>$</b> ssh your-hostname

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
        <small>{copied ? 'copied!' : 'click to copy command'}</small>
      </button>
    </section>

    <section class="flow" aria-label="Architecture">
      <div><b>01</b><strong>SSH client</strong><span>unchanged OpenSSH</span></div><i>→</i>
      <div><b>02</b><strong>TCP relay</strong><span>bytes only</span></div><i>→</i>
      <div class="cloud"><b>03</b><strong>Cloudflare</strong><span>Worker · DO · Container</span></div><i>→</i>
      <div><b>04</b><strong>OpenTUI</strong><span>your application</span></div>
    </section>

    <section class="cards">
      <article><span>01</span><h2>Real SSH</h2><p>No browser terminal and no custom client. PTYs, resize events, SSH keys, and terminal capabilities arrive intact.</p></article>
      <article><span>02</span><h2>Tiny boundary</h2><p>The relay terminates nothing. It forwards opaque bytes over an authenticated WebSocket; the SSH server stays in your Container.</p></article>
      <article><span>03</span><h2>Made to disappear</h2><p>When Cloudflare accepts inbound TCP natively, remove the relay. The app and its OpenTUI session code do not change.</p></article>
    </section>
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
  {:else}
    <article class="doc"><h1>Why Tuiport has a relay</h1><p class="summary">Cloudflare can host the complete application today, but it cannot yet accept the first raw TCP byte directly into a Worker or Container.</p>
      <h2>The missing edge</h2><p>Workers TCP sockets are outbound. Container ports are reachable through their Durable Object, but only over HTTP/WebSocket fetches. Cloudflare Tunnel can expose SSH when the client runs <code>cloudflared</code>; that changes the desired <code>ssh host</code> experience.</p>
      <h2>The narrow bridge</h2><p>Spectrum accepts public SSH traffic. Today its raw TCP origin must have a reachable TCP address; Spectrum-to-Tunnel supports HTTP/HTTPS only. Tuiport therefore uses a stateless TCP-to-WebSocket relay. It cannot decrypt SSH and stores no session state.</p>
      <h2>Deletion is the design</h2><p>The application speaks SSH only inside the Container. Native inbound TCP can replace the relay and WebSocket route without rewriting the OpenTUI app. This repository is both a working proof and a precise request for that platform seam.</p>
    </article>
  {/if}
</main>

<footer><span>Cloudflare / Agent Experience</span><span>FIELD EXPERIMENT 001 · MIT · 0.0.1</span><a href="https://coey.dev">coey.dev ↗</a></footer>

<style>
  :global(:root){color-scheme:dark;--font-sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;--font-mono:"IBM Plex Mono",ui-monospace,SFMono-Regular,Menlo,monospace;--ax-ink:#0b1118;--ax-layer:#111a24;--ax-layer-2:#182431;--ax-layer-3:#223141;--ax-text:#f7f9fb;--ax-muted:#9baaba;--ax-border:rgba(174,196,216,.14);--ax-border-strong:rgba(174,196,216,.27);--ax-orange:#f6821f;--ax-amber:#f7b53b;--ax-orange-soft:rgba(246,130,31,.12);--ax-blue:#2678a4;--ax-blue-light:#71b8d8;--ax-blue-soft:rgba(74,154,194,.13);--ax-green:#63d5a2;--ax-green-soft:rgba(59,207,145,.11);--radius-sm:.25rem;--radius-md:.45rem;--radius-lg:.7rem}
  :global(*){box-sizing:border-box}:global(html){scroll-behavior:smooth}:global(body){min-width:320px;margin:0;background:var(--ax-ink);color:var(--ax-text);font-family:var(--font-sans);font-synthesis:none}:global(a){color:inherit}:global(code),pre{font-family:var(--font-mono)}:global(::selection){background:var(--ax-orange);color:#170900}
  header,footer,main{max-width:1280px;margin:auto}header{height:76px;display:flex;align-items:center;border-bottom:1px solid var(--ax-border);padding:0 28px;gap:36px}.brand{display:flex;align-items:center;gap:.65rem;text-decoration:none}.brand svg{width:2.15rem;overflow:visible;flex:none;filter:drop-shadow(0 5px 9px rgba(10,23,34,.42))}.brand span{display:grid;line-height:1;letter-spacing:-.025em}.brand strong{font-size:.9rem}.brand em{margin-top:.28rem;color:var(--ax-muted);font:400 .66rem/1 var(--font-mono);font-style:normal;letter-spacing:.01em}.orb-shell{stroke:rgba(255,255,255,.34);stroke-width:1}.orb-core{mix-blend-mode:screen}.orb-glint{fill:none;stroke:rgba(255,255,255,.74);stroke-width:4;stroke-linecap:round}.orb-depth{fill:none;stroke:rgba(37,15,11,.24);stroke-width:3;stroke-linecap:round}nav{display:flex;gap:24px;margin-left:auto}nav a,.github{color:var(--ax-muted);font:500 .68rem/1 var(--font-mono);text-decoration:none;text-transform:uppercase;letter-spacing:.045em;transition:.15s}nav a:hover,.github:hover{color:var(--ax-text)}.github{border:1px solid var(--ax-border-strong);border-radius:var(--radius-md);padding:.65rem .75rem}
  main{padding:72px 28px 112px}.eyebrow{display:flex;align-items:center;gap:.55rem;margin:0 0 28px;color:var(--ax-orange);font:600 .68rem/1 var(--font-mono);letter-spacing:.12em;text-transform:uppercase}.eyebrow::before{content:'';width:1.25rem;height:1px;background:currentColor}.hero{position:relative;display:grid;grid-template-columns:1.08fr .92fr;gap:clamp(36px,6vw,90px);align-items:center;min-height:540px;padding:clamp(30px,5vw,68px);border:1px solid var(--ax-border);border-radius:var(--radius-lg);background:linear-gradient(110deg,rgba(8,13,19,.98),rgba(13,31,43,.9));overflow:hidden}.hero-grid{position:absolute;inset:0;background-image:linear-gradient(rgba(255,255,255,.045) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.045) 1px,transparent 1px);background-size:4rem 4rem;mask-image:linear-gradient(90deg,#000,transparent 80%);pointer-events:none}.hero-glow{position:absolute;right:-3%;top:5%;width:min(44rem,57%);aspect-ratio:1;border-radius:50%;background:radial-gradient(circle at 31% 24%,rgba(255,255,255,.2),rgba(113,184,216,.13) 22%,rgba(38,120,164,.12) 47%,rgba(246,130,31,.1) 68%,rgba(53,24,18,.08) 82%,transparent 83%);box-shadow:inset 0 0 42px rgba(255,255,255,.035),0 0 100px rgba(38,120,164,.09);pointer-events:none}.hero-copy,.terminal{position:relative;z-index:1}.badge{display:inline-flex;align-items:center;gap:.5rem;width:max-content;padding:.4rem .55rem;border:1px solid var(--ax-border-strong);border-radius:999px;color:#d7e5ec;background:rgba(8,13,19,.55);backdrop-filter:blur(8px);font:600 .58rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.055em}.badge i{width:.42rem;height:.42rem;border-radius:50%;background:var(--ax-orange);box-shadow:0 0 0 3px var(--ax-orange-soft)}h1{margin:1.2rem 0 1.2rem;font-size:clamp(3.25rem,6.1vw,6.35rem);line-height:.9;letter-spacing:-.072em;font-weight:730}h1 em{color:#9ccfe2;font-style:normal;font-weight:500}.lede,.summary{max-width:650px;color:#c8d4dd;font-size:clamp(1rem,1.6vw,1.18rem);line-height:1.65}.actions{display:flex;gap:.65rem;margin-top:2rem}.primary,.secondary{display:inline-flex;align-items:center;justify-content:center;gap:.6rem;min-height:2.7rem;padding:0 1rem;border-radius:var(--radius-md);font-size:.76rem;font-weight:650;text-decoration:none;transition:.15s}.primary{border:1px solid var(--ax-orange);background:var(--ax-orange);color:#1d0b00}.primary:hover{background:#ff9b49}.secondary{border:1px solid var(--ax-border-strong);background:var(--ax-layer-2);color:var(--ax-text)}.secondary:hover{border-color:var(--ax-blue-light)}.hero-meta{display:flex;gap:1.4rem;margin-top:2.2rem;color:var(--ax-muted);font:500 .55rem/1.5 var(--font-mono);text-transform:uppercase;letter-spacing:.07em}.hero-meta span:first-child{color:var(--ax-orange)}
  .terminal{text-align:left;padding:0;width:100%;border:1px solid var(--ax-border-strong);border-radius:var(--radius-lg);background:#080d13;color:#d7e2ec;box-shadow:0 32px 100px rgba(0,0,0,.42);overflow:hidden;cursor:pointer;transform:perspective(900px) rotateY(-2deg)}.chrome{height:42px;display:flex;align-items:center;justify-content:space-between;padding:0 .85rem;border-bottom:1px solid var(--ax-border);color:var(--ax-muted);font:500 .58rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.05em}.chrome .state{display:flex;align-items:center;gap:.45rem}.chrome i{width:.42rem;height:.42rem;border-radius:50%;background:var(--ax-green);box-shadow:0 0 0 3px var(--ax-green-soft)}.terminal pre{min-height:318px;margin:0;padding:1.6rem;font-size:.76rem;line-height:1.65;color:#d7e2ec}.terminal pre b{color:var(--ax-orange)}.terminal small{position:absolute;right:.8rem;bottom:.65rem;color:var(--ax-muted);font:500 .55rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.05em}
  .flow{display:grid;grid-template-columns:1fr auto 1fr auto 1.25fr auto 1fr;align-items:center;gap:1rem;margin:1rem 0;border:1px solid var(--ax-border);border-radius:var(--radius-lg);padding:1.2rem;background:var(--ax-layer)}.flow div{display:flex;flex-direction:column;gap:.35rem}.flow b{color:var(--ax-orange);font:600 .58rem/1 var(--font-mono)}.flow strong{font-size:.85rem}.flow span{color:var(--ax-muted);font:500 .58rem/1.4 var(--font-mono)}.flow i{color:#526474}.flow .cloud{padding:.8rem;border-left:2px solid var(--ax-blue-light);background:var(--ax-blue-soft)}.flow .cloud strong{color:var(--ax-blue-light)}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;border:1px solid var(--ax-border);border-radius:var(--radius-lg);background:var(--ax-border);overflow:hidden}.cards article{min-height:235px;padding:1.35rem;background:var(--ax-layer)}.cards span{color:var(--ax-orange);font:600 .6rem/1 var(--font-mono)}.cards h2{margin:4rem 0 .65rem;font-size:1.2rem;letter-spacing:-.025em}.cards p,.doc p,.doc li{color:var(--ax-muted);font-size:.84rem;line-height:1.72}
  .doc{max-width:820px;margin:0 auto;padding:clamp(1rem,3vw,2rem);border-left:1px solid var(--ax-border)}.doc h1{font-size:clamp(3rem,6vw,5.5rem)}.doc h2{margin-top:3rem;font-size:1.5rem;letter-spacing:-.035em}.doc pre{padding:1.15rem;border:1px solid var(--ax-border);border-radius:var(--radius-lg);background:#080d13;overflow:auto;line-height:1.65}.doc table{width:100%;margin-top:2rem;border-collapse:collapse}.doc th,.doc td{text-align:left;border-bottom:1px solid var(--ax-border);padding:1rem .65rem}.doc td{color:var(--ax-muted)}.doc th{width:195px}
  footer{display:grid;grid-template-columns:1fr auto auto;gap:2rem;padding:1.7rem 28px 3.5rem;border-top:1px solid var(--ax-border);color:var(--ax-muted);font:500 .58rem/1 var(--font-mono);text-transform:uppercase;letter-spacing:.06em}footer a{color:var(--ax-blue-light);text-decoration:none}
  @media(max-width:900px){header nav{display:none}.github{margin-left:auto}.hero{grid-template-columns:1fr;min-height:auto}.terminal{transform:none}.flow{grid-template-columns:1fr;gap:.8rem}.flow>i{display:none}.cards{grid-template-columns:1fr}.cards article{min-height:180px}.cards h2{margin-top:2rem}}
  @media(max-width:600px){header{height:68px;padding:0 18px}.brand em{display:none}.github{padding:.55rem}.github>span{display:none}main{padding:42px 16px 80px}.hero{padding:26px 20px}h1{font-size:3.15rem}.actions{align-items:stretch;flex-direction:column}.hero-meta{display:grid;gap:.3rem}.terminal pre{min-height:270px;padding:1rem;font-size:.61rem}.chrome{font-size:.49rem}.eyebrow{font-size:.58rem}footer{grid-template-columns:1fr;padding:1.5rem 18px 3rem}footer span:nth-child(2){display:none}}
  @media(prefers-reduced-motion:reduce){:global(html){scroll-behavior:auto}}
</style>
