#!/usr/bin/env bash
set -euo pipefail

fail() {
  printf 'public-release check failed: %s\n' "$1" >&2
  exit 1
}

tracked=$(git ls-files)
if printf '%s\n' "$tracked" | grep -Eq '(^|/)(\.env|\.dev\.vars|\.alchemy)(/|$)|\.(pem|key)$|host_key$'; then
  fail 'a secret or local-state filename is tracked'
fi

if git grep -IEn '(/Users/|/home/[^/]+/|-----BEGIN (OPENSSH|PRIVATE) KEY-----|gh[opsu]_[A-Za-z0-9]{20,})' -- . ':(exclude)scripts/check-public.sh'; then
  fail 'tracked content contains a local path, private key, or token-shaped value'
fi

while read -r email; do
  case "$email" in
    *@users.noreply.github.com) ;;
    *) fail "commit metadata uses a non-noreply email: $email" ;;
  esac
done < <(git log --format='%ae%n%ce' | sort -u)

printf 'public-release check passed\n'
