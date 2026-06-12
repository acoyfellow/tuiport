# Reference

## Worker routes

| Route | Contract |
|---|---|
| `GET /` | Public svelte-hono site |
| `GET /tutorial` | Tutorial |
| `GET /how-to` | Task-oriented guides |
| `GET /reference` | Reference |
| `GET /explanation` | Architecture explanation |
| `GET /api/health` | Reports Worker readiness without waking the Container |
| `WS /bridge` | Binary SSH stream; bearer token required |

## Ports

| Port | Location | Purpose |
|---|---|---|
| `22` | relay/Spectrum edge | public SSH |
| `2222` | Container | `@opentui/ssh` server |
| `8080` | Container | health and WebSocket bridge |
| `443` | Worker | docs and authenticated bridge |

## Resources

- Worker: `tuiport`
- Durable Object / Container class: `TuiportContainer`
- Container size: `lite`
- Maximum instances: `1`
- Sleep timeout: `10m`

## Configuration

`RELAY_TOKEN` is required in production. Requests to `/bridge` must include `Authorization: Bearer <RELAY_TOKEN>`.

`SSH_HOST_KEY_B64` is a base64-encoded Ed25519 private key in PEM form. If omitted, the Container generates an ephemeral development key.

The sample SSH policy accepts any valid public key after proof-of-possession verification. It does not accept passwords.