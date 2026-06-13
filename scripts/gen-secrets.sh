#!/usr/bin/env bash
# Generate the two secrets Tuiport requires, in a form alchemy.env.ts accepts.
# Uses ssh-keygen (present on macOS and Linux) because LibreSSL's `openssl
# genpkey -algorithm ED25519` is unavailable on macOS.
# Usage:
#   bash scripts/gen-secrets.sh            # print to stdout
#   bash scripts/gen-secrets.sh >> .env    # append for `alchemy deploy`
set -euo pipefail

relay_token="$(openssl rand -hex 32)"

key_dir="$(mktemp -d)"
trap 'rm -rf "$key_dir"' EXIT
key_path="$key_dir/host_ed25519"
ssh-keygen -t ed25519 -N '' -C 'tuiport-host-key' -f "$key_path" >/dev/null
host_key_b64="$(base64 < "$key_path" | tr -d '\n')"

printf 'RELAY_TOKEN=%s\n' "$relay_token"
printf 'SSH_HOST_KEY_B64=%s\n' "$host_key_b64"
