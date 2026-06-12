# Contributing

Keep Tuiport small, auditable, and removable.

```sh
bun install
bun run check
bun run relay:build
```

Changes should preserve ordinary OpenSSH compatibility, keep authentication boundaries explicit, and avoid adding state to the relay. Update the corresponding Diátaxis page when behavior changes.

Open an issue before introducing another Cloudflare resource or deployment system.