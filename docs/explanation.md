# Explanation: why the relay exists

Tuiport aims to preserve one interface: `ssh hostname`. That means the first connection is arbitrary inbound TCP, not HTTP and not a client-side Cloudflare Tunnel command.

Workers currently create outbound TCP sockets but cannot receive inbound TCP. Containers expose HTTP and WebSocket requests through a Durable Object; their ports are not public Internet origins. Wrangler's Container SSH path is authenticated operator access and is intentionally not public.

Spectrum accepts public SSH, but a raw TCP Spectrum application cannot use Cloudflare Tunnel as its origin. It therefore needs an origin with a reachable TCP address.

Tuiport reduces that origin to a transport adapter:

1. Spectrum sends the encrypted SSH stream to the relay.
2. The relay opens an authenticated WebSocket to the Worker.
3. The Worker routes it to the singleton Container.
4. A local bridge sends the bytes to `@opentui/ssh` on port 2222.
5. SSH encryption, authentication, PTY handling, and application rendering all happen in the Container.

The relay has no key material and cannot interpret the encrypted session. It is still a runtime dependency, so the design keeps it stateless and under 100 lines.

When Cloudflare supports direct TCP ingress into a Worker or Container binding, steps 1–3 collapse into the native ingress. The OpenTUI application remains unchanged. Deleting the relay is an intended migration, not a rewrite.

## Public sources

The platform boundary described here comes entirely from public Cloudflare documentation:

- [Workers TCP sockets](https://developers.cloudflare.com/workers/runtime-apis/tcp-sockets/) documents outbound TCP and states that inbound TCP is not currently available.
- [Containers SSH](https://developers.cloudflare.com/containers/ssh/) documents the authenticated Wrangler path and states that it does not expose a public port.
- [Spectrum limitations](https://developers.cloudflare.com/spectrum/reference/limitations/) states that raw TCP Spectrum applications cannot use Cloudflare Tunnel as an origin.