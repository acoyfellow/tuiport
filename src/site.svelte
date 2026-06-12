<script lang="ts">
  let { section = 'home', eyebrow = '' } = $props<{ section: string; eyebrow: string }>();
  let copied = $state(false);
  const command = 'ssh tuiport.coey.dev';
  async function copyCommand() {
    await navigator.clipboard.writeText(command);
    copied = true;
    setTimeout(() => (copied = false), 1400);
  }
</script>

<svelte:head>
  <meta name="description" content="Serve OpenTUI applications over SSH from a Cloudflare Container." />
</svelte:head>

<header>
  <a class="brand" href="/" aria-label="Tuiport home"><span>◈</span> tuiport</a>
  <nav aria-label="Documentation">
    <a href="/tutorial">tutorial</a><a href="/how-to">how-to</a><a href="/reference">reference</a><a href="/explanation">why</a>
  </nav>
  <a class="github" href="https://github.com/acoyfellow/tuiport">GitHub ↗</a>
</header>

<main>
  <p class="eyebrow">{eyebrow}</p>

  {#if section === 'home'}
    <section class="hero">
      <div>
        <h1>Your OpenTUI app.<br /><em>One SSH command away.</em></h1>
        <p class="lede">Tuiport runs an <code>@opentui/ssh</code> server inside a Cloudflare Container and gives it a small, auditable path to the public Internet.</p>
        <div class="actions">
          <a class="primary" href="https://deploy.workers.cloudflare.com/?url=https://github.com/acoyfellow/tuiport">Deploy to Cloudflare</a>
          <a class="secondary" href="/tutorial">Build your own →</a>
        </div>
      </div>
      <button class="terminal" onclick={copyCommand} aria-label="Copy SSH command">
        <div class="chrome"><i></i><i></i><i></i><span>ssh · tuiport.coey.dev</span></div>
        <pre><b>$</b> ssh tuiport.coey.dev

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
        <small>{copied ? 'copied!' : 'click to copy'}</small>
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
        <tr><th><code>GET /api/health</code></th><td>Starts the singleton Container and reports readiness.</td></tr>
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

<footer><span>Built for the terminal.</span><span>MIT · 0.0.1 · <a href="https://coey.dev">coey.dev</a></span></footer>

<style>
  :global(*){box-sizing:border-box} :global(body){margin:0;background:#090a0d;color:#eef1f4;font-family:Inter,ui-sans-serif,system-ui,sans-serif} :global(a){color:inherit} :global(code),pre{font-family:"SFMono-Regular",Consolas,monospace}
  header,footer,main{max-width:1180px;margin:auto} header{height:74px;display:flex;align-items:center;border-bottom:1px solid #252830;padding:0 24px;gap:34px}.brand{text-decoration:none;font-weight:750;font-size:20px;letter-spacing:-.03em}.brand span{color:#f48120}nav{display:flex;gap:22px;margin-left:auto}nav a,.github{font:13px monospace;text-decoration:none;color:#a7acb5}nav a:hover,.github:hover{color:white}.github{border:1px solid #343842;padding:8px 11px;border-radius:6px}
  main{padding:70px 24px 100px}.eyebrow{font:12px monospace;text-transform:uppercase;letter-spacing:.13em;color:#f48120;margin:0 0 28px}.hero{display:grid;grid-template-columns:1.05fr .95fr;gap:70px;align-items:center;min-height:440px}h1{font-size:58px;line-height:1.02;letter-spacing:-.055em;margin:0 0 26px}h1 em{font-style:normal;color:#f48120}.lede,.summary{font-size:19px;line-height:1.65;color:#a9afb9;max-width:650px}.actions{display:flex;gap:13px;margin-top:34px}.primary,.secondary{display:inline-block;text-decoration:none;padding:13px 17px;border-radius:6px;font-weight:700;font-size:14px}.primary{background:#f48120;color:#17100a}.secondary{border:1px solid #343842;color:#d8dce1}
  .terminal{position:relative;text-align:left;padding:0;background:#101218;color:#d8dee9;border:1px solid #343842;border-radius:10px;box-shadow:0 28px 80px #0009;overflow:hidden;cursor:pointer;width:100%}.chrome{height:39px;border-bottom:1px solid #292d36;display:flex;align-items:center;padding:0 13px;gap:7px}.chrome i{width:9px;height:9px;border-radius:50%;background:#3a3e48}.chrome i:first-child{background:#f48120}.chrome span{font:11px monospace;color:#777e89;margin-left:7px}.terminal pre{font-size:13px;line-height:1.55;padding:23px 27px;margin:0;color:#cbd1da}.terminal pre b{color:#f48120}.terminal small{position:absolute;right:12px;bottom:10px;color:#777e89;font:10px monospace}
  .flow{margin:100px 0 52px;border:1px solid #292d36;border-radius:9px;display:flex;align-items:center;justify-content:space-around;padding:25px;background:#0d0f13}.flow div{display:flex;flex-direction:column;gap:5px}.flow b{font:10px monospace;color:#676d77}.flow strong{font-size:14px}.flow span{font:11px monospace;color:#7f8590}.flow i{color:#4d535d}.flow .cloud strong{color:#f48120}.cards{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.cards article{border-top:1px solid #343842;padding:25px 4px}.cards span{font:11px monospace;color:#f48120}.cards h2{font-size:22px}.cards p,.doc p,.doc li{color:#a9afb9;line-height:1.7}
  .doc{max-width:780px;margin:0 auto}.doc h1{font-size:49px}.doc h2{margin-top:48px;font-size:24px;letter-spacing:-.02em}.doc pre{background:#111319;border:1px solid #2d313a;border-radius:7px;padding:18px;overflow:auto;line-height:1.6}.doc table{border-collapse:collapse;width:100%;margin-top:30px}.doc th,.doc td{text-align:left;border-bottom:1px solid #292d36;padding:15px 10px}.doc td{color:#a9afb9}.doc th{width:190px}
  footer{border-top:1px solid #252830;padding:28px 24px 55px;display:flex;justify-content:space-between;color:#777e89;font:12px monospace}
  @media(max-width:800px){header nav{display:none}.github{margin-left:auto}.hero{grid-template-columns:1fr;gap:40px}h1{font-size:43px}.flow{overflow:auto;justify-content:flex-start;gap:20px}.cards{grid-template-columns:1fr}.terminal pre{font-size:10px;padding:18px 12px}main{padding-top:45px}.doc h1{font-size:40px}}
</style>
