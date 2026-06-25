#!/bin/sh
set -e

# Re-install when package manifests change (e.g. after git pull or agent edits).
LOCK_SHA=$(
  cat package-lock.json package.json apps/api/package.json | sha256sum | cut -d' ' -f1
)
HASH_FILE="/app/.docker-api-deps-hash"

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$LOCK_SHA" ]; then
  echo ">> API dependencies changed — running npm ci (this may take a minute)..."
  npm ci
  echo "$LOCK_SHA" > "$HASH_FILE"
fi

exec "$@"
