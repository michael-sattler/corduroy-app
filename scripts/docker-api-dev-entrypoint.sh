#!/bin/sh
set -e

# Re-install only when the resolved dependency tree changes. package-lock.json
# is the source of truth — it updates whenever a real dep is added/removed, so
# editing package.json "scripts" no longer triggers a disruptive reinstall.
LOCK_SHA=$(sha256sum package-lock.json | cut -d' ' -f1)
HASH_FILE="/app/.docker-api-deps-hash"

if [ ! -f "$HASH_FILE" ] || [ "$(cat "$HASH_FILE")" != "$LOCK_SHA" ]; then
  echo ">> API dependencies changed — running npm ci (this may take a minute)..."
  npm ci
  echo "$LOCK_SHA" > "$HASH_FILE"
fi

exec "$@"
