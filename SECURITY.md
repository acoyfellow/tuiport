# Security

Report vulnerabilities privately through GitHub Security Advisories for `acoyfellow/tuiport`.

## Security model

- SSH encrypts and authenticates the application session end to end.
- `RELAY_TOKEN` authenticates the byte relay to the Worker.
- The relay has no SSH host or user private keys.
- The sample accepts any verified public key. This identifies users but does not authorize them for private capabilities.

Before production use, replace the sample SSH policy with an allowlist, store `RELAY_TOKEN` as a Worker secret, restrict relay administration, and apply connection limits at Spectrum or the relay.

Use `SSH_HOST_KEY_B64` so clients see a stable server identity across Container restarts. Never commit `.dev.vars`, relay tokens, host private keys, or user private keys.