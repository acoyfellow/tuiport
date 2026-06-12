#!/usr/bin/env bash
set -euo pipefail

image="tuiport:local"
container="tuiport-local"

docker rm -f "$container" >/dev/null 2>&1 || true
docker build -f container/Dockerfile -t "$image" .

printf '\nTuiport is ready. In another terminal, run:\n\n'
printf '  ssh -p 2222 localhost\n\n'

docker run --rm --name "$container" -p 8080:8080 -p 2222:2222 "$image"
