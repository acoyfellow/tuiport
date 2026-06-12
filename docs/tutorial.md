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

## Configure Spectrum

Create an SSH Spectrum application with edge port `22`, the relay's address as its origin, and origin port `22`. Keep TLS termination off; SSH provides its own encryption.

## Connect

```sh
ssh ssh.example.com
```

Accept the host key on the first connection. Press `q` to leave the sample app.

You now have OpenSSH talking to an OpenTUI application in a Cloudflare Container.