# How-to guides

## Render a different OpenTUI app

Edit `container/server.ts`. Mount core renderables directly on `session.renderer`, or adopt the renderer with `@opentui/react` or `@opentui/solid`. Keep per-session cleanup in `session.onClose()`.

## Restrict users by SSH key

Replace `publicKey: 'any'` with an allowlist:

```ts
createServer({
  auth: { publicKey: { authorizedKeys: '/app/authorized_keys' } },
});
```

Copy the allowlist into the image in `container/Dockerfile`. The relay token authenticates the relay, not the SSH user.

## Rotate the relay token

Update the Worker secret, restart every relay with the new value, and verify old relays receive HTTP 401 from `/bridge`.

## Use a custom domain for the docs

Add a Worker custom domain in the dashboard or change `domainName` in `alchemy.run.ts`. The web and SSH services may share a hostname because they listen on ports 443 and 22.

## Run the Container directly

```sh
docker build -f container/Dockerfile -t tuiport .
docker run --rm -p 8080:8080 -p 2222:2222 tuiport
ssh -p 2222 localhost
```

This isolates OpenTUI and SSH work from Worker routing.