# Tuiport

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/acoyfellow/tuiport)
[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Serve an [OpenTUI](https://github.com/anomalyco/opentui) application over real SSH from a Cloudflare Container.

Tuiport is an **Agent Experience** release: a shared terminal interface where agents and humans can meet, work, and stay in flow.

```sh
git clone https://github.com/acoyfellow/tuiport
cd tuiport && bun install
bun run local

# in another terminal
ssh -p 2222 localhost
```

Tuiport keeps the SSH server and application on Cloudflare. A 70-line stateless relay carries encrypted SSH bytes from a public TCP address to the Worker because Workers and Containers do not yet accept direct inbound TCP.

```text
OpenSSH ──TCP──▶ Spectrum ──TCP──▶ relay ──WSS──▶ Worker ──▶ Container
                                                               └─ @opentui/ssh
```

The relay cannot read the SSH session. It only converts transports and is designed to be deleted when Cloudflare supports native TCP ingress to a Container.

## Live browser session

The landing page also runs a constrained version of the same OpenTUI application directly in the browser:

```text
cloudterm → same-origin WebSocket → Worker → Durable Object → Container → OpenTUI
```

This is a real Container-backed session, not a recording. It intentionally exposes no shell, command execution, filesystem, or visitor credentials. The direct WebSocket path exists for dogfooding; ordinary SSH remains the product interface.

## Deploy

1. Click **Deploy to Cloudflare** above.
2. Set the relay secret and a stable SSH host key:

   ```sh
   bun run secrets:gen          # prints RELAY_TOKEN and SSH_HOST_KEY_B64
   bunx wrangler secret put RELAY_TOKEN
   bunx wrangler secret put SSH_HOST_KEY_B64
   ```

   `secrets:gen` uses `ssh-keygen`; macOS LibreSSL cannot generate Ed25519 keys via `openssl genpkey`.

3. Run the relay on any host with a public TCP address:

   ```sh
   cd relay && go build
   ./tuiport-relay \
     -listen :22 \
     -upstream wss://YOUR-WORKER.workers.dev/bridge \
     -token "$RELAY_TOKEN"
   ```

4. Point a Cloudflare Spectrum SSH application at the relay.
5. Connect with `ssh your-hostname`.

The Deploy button provisions the Worker, Durable Object, and Container in the user's Cloudflare account. Spectrum and its TCP origin are configured separately because Deploy to Cloudflare does not provision Spectrum.

## Make it yours

Edit `container/server.ts`. `@opentui/ssh` gives each accepted session an OpenTUI renderer connected to the remote PTY:

```ts
createServer({ auth: { publicKey: 'any' } }).serve((session) => {
  session.renderer.root.add(yourOpenTuiApp(session.renderer));
});
```

The sample accepts any **verified** public key. Set `SSH_HOST_KEY_B64` before sharing the hostname so the server fingerprint survives Container restarts. Use an `authorized_keys` allowlist before attaching private data or capabilities.

## Repository map

| Path | Purpose |
|---|---|
| `src/` | svelte-hono site, embedded cloudterm session, routing, and Container binding |
| `container/` | OpenTUI SSH application and local byte bridge |
| `relay/` | minimal TCP-to-WebSocket adapter |
| `docs/` | Diátaxis documentation |
| `wrangler.jsonc` | portable one-click deployment |
| `alchemy.run.ts` | custom-domain deployment for `tuiport.coey.dev` |

## Documentation

- [Tutorial](docs/tutorial.md) — deploy a working instance
- [How-to guides](docs/how-to.md) — customize auth, UI, and hostnames
- [Reference](docs/reference.md) — exact routes, ports, and resources
- [Explanation](docs/explanation.md) — architecture and platform boundary

The same documentation is published at <https://tuiport.coey.dev>.

## Local development

Run the complete SSH loop with Docker:

```sh
bun install
bun run local

# in another terminal
ssh -p 2222 localhost
```

Run the Worker development server separately with `bun run dev`. Run `bun run check` before pushing.

## Status

Tuiport is a focused proof, version `0.0.1`. The Cloudflare application is real; the only non-Cloudflare runtime requirement is the public TCP relay described above.

## License

MIT © Jordan Coeyman.
