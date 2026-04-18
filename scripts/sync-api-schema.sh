#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET_SCHEMA_PATH="${SMETCHIK_API_LOCAL_SCHEMA_PATH:-$ROOT_DIR/schema.yaml}"
SSH_HOST="${SMETCHIK_API_SSH_HOST:-}"
SSH_KEY="${SMETCHIK_API_SSH_KEY:-$HOME/.ssh/id_ed25519}"
REMOTE_SCHEMA_PATH="${SMETCHIK_API_REMOTE_PATH:-}"
TMP_FILE="$(mktemp)"

cleanup() {
  rm -f "$TMP_FILE"
}
trap cleanup EXIT

if [[ -z "$SSH_HOST" ]]; then
  echo "SMETCHIK_API_SSH_HOST is required (example: user@example-host)" >&2
  exit 1
fi

if [[ -z "$REMOTE_SCHEMA_PATH" ]]; then
  echo "SMETCHIK_API_REMOTE_PATH is required (example: /path/to/swagger.yaml)" >&2
  exit 1
fi

echo "Downloading schema from ${SSH_HOST}:${REMOTE_SCHEMA_PATH}"
scp -q -o IdentitiesOnly=yes -i "$SSH_KEY" "${SSH_HOST}:${REMOTE_SCHEMA_PATH}" "$TMP_FILE"

if ! grep -Eiq '^(openapi|swagger):' "$TMP_FILE"; then
  echo "Downloaded file does not look like OpenAPI/Swagger schema" >&2
  exit 1
fi

mv "$TMP_FILE" "$TARGET_SCHEMA_PATH"
echo "Schema updated: ${TARGET_SCHEMA_PATH}"

echo "Generating API client with orval"
cd "$ROOT_DIR"
npm run api

echo "API client generation completed"
