# Tutorial: deploy Tuiport

This tutorial produces a working OpenTUI SSH application in your Cloudflare account.

## Prerequisites

- a Cloudflare account with Workers Containers access
- Bun and the Wrangler CLI (`bun install` brings Wrangler in)
- for public SSH only: a paid zone with Spectrum SSH support and a small host with a public TCP address for the relay

## Deploy the application

The site and the live browser demo need no secrets. From a clone of the repository:

```sh
bun install
wrangler login      # or `bun run setup` starts it for you
bun run setup
```

`bun run setup` deploys the Worker and Container to the account you are logged into, generates `RELAY_TOKEN` and `SSH_HOST_KEY_B64`, and stores them with the bulk secrets API. It reads the deployed URL from Wrangler's structured output and prints it. The generated secrets are also saved to `.dev.vars` (gitignored) so the relay can reuse them. Nothing is pasted into a web form.

The stable host key in `SSH_HOST_KEY_B64` prevents fingerprint warnings after a Container restart. The generator uses `ssh-keygen` (present on macOS and Linux); macOS LibreSSL cannot generate Ed25519 keys with `openssl genpkey`.

Prefer no local toolchain? The Deploy to Cloudflare button in the README also works and needs no secrets; run `bun run setup` (or the steps below) afterward to enable SSH.

## Start the relay

On the public TCP host:

```sh
git clone https://github.com/acoyfellow/tuiport
cd tuiport/relay
go build
./tuiport-relay \
  -listen :22 \
  -upstream wss://YOUR-WORKER.workers.dev/bridge \
  -token 'THE-SAME-SECRET'
```

The relay forwards bytes and holds no application state.

## Connect your SSH hostname

[Cloudflare Spectrum](https://developers.cloudflare.com/spectrum/) is Cloudflare's public TCP proxy. It receives `ssh ssh.example.com:22` and forwards the encrypted SSH bytes to your relay.

Create one Spectrum SSH application with:

- hostname: `ssh.example.com`
- edge port: `22`
- origin: the relay's public TCP address
- origin port: `22`
- TLS termination: off, because SSH provides its own encryption

Spectrum requires a paid Cloudflare plan. Configure it separately after deployment; Deploy to Cloudflare does not currently provision Spectrum applications.

## Connect

```sh
ssh ssh.example.com
```

Accept the host key on the first connection. Press `q` to leave the sample app.

You now have OpenSSH talking to an OpenTUI application in a Cloudflare Container.