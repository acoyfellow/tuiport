# Tutorial: deploy Tuiport

This tutorial produces a working OpenTUI SSH application in your Cloudflare account.

## Prerequisites

- a Cloudflare account with Workers Containers access
- a paid zone with Spectrum SSH support
- a small host with a public TCP address for the relay
- GitHub or GitLab

## Deploy the application

Use the Deploy to Cloudflare button in the README. Cloudflare forks the repository, builds the Worker and Container, and configures Workers Builds.

Generate a relay secret and stable SSH host key, then add both in the deployed Worker's settings:

```sh
openssl rand -hex 32
openssl genpkey -algorithm ED25519 | base64
```

Store them as `RELAY_TOKEN` and `SSH_HOST_KEY_B64`. The stable host key prevents fingerprint warnings after a Container restart.

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