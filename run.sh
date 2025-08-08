#!/usr/bin/env bash
set -euo pipefail

# Run the Banbury-Website frontend locally with Next.js (no Docker, no backend)
# - Default: starts Next.js dev server with Fast Refresh on port 3000
# - With --prod: builds Next.js and starts the production server on port 3000
#
# Flags:
#   --local-api       Build frontend to use http://localhost:8080 as API base (temporary edit to config.ts)
#   --build-only      Build images/artifacts but do not start servers
#   --no-backend      Skip backend build/run
#   --no-frontend     Skip frontend build/run
#   --backend-port N  Host port to expose backend on (default 8080)
#   --frontend-port N Port to serve frontend on (default 3000)
#   --dev             Start Next.js dev server (default)
#   --prod            Build and start Next.js production server

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
ROOT_DIR="$SCRIPT_DIR"

FRONTEND_PORT=3000
USE_LOCAL_API=false
BUILD_ONLY=false
RUN_FRONTEND=true
DEV_MODE=true

while [[ $# -gt 0 ]]; do
  case "$1" in
    --local-api)
      USE_LOCAL_API=true
      shift
      ;;
    --build-only)
      BUILD_ONLY=true
      shift
      ;;
    --no-frontend)
      RUN_FRONTEND=false
      shift
      ;;
    --frontend-port)
      FRONTEND_PORT="${2:-3000}"
      shift 2
      ;;
    --dev)
      DEV_MODE=true
      shift
      ;;
    --prod)
      DEV_MODE=false
      shift
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

if [[ "$DEV_MODE" == "true" ]]; then
  echo "[1/2] Frontend (dev): install deps"
else
  echo "[1/2] Frontend (prod): install deps and build (Next.js)"
fi
if [[ "$RUN_FRONTEND" == "true" ]]; then
  FRONTEND_DIR="$ROOT_DIR/frontend"
  pushd "$FRONTEND_DIR" >/dev/null

  ORIGINAL_CONFIG="src/config/config.ts"
  BACKUP_CONFIG="src/config/config.ts.__run_backup__"
  RESTORE_CONFIG=false

  if [[ "$USE_LOCAL_API" == "true" ]]; then
    if [[ -f "$ORIGINAL_CONFIG" ]]; then
      cp "$ORIGINAL_CONFIG" "$BACKUP_CONFIG"
      RESTORE_CONFIG=true
      # Force prod/dev/semi_local to false so CONFIG.url falls back to localhost
      sed -i 's/\bprod:\s*true\b/prod: false/' "$ORIGINAL_CONFIG" || true
      sed -i 's/\bdev:\s*true\b/dev: false/' "$ORIGINAL_CONFIG" || true
      sed -i 's/\bsemi_local:\s*true\b/semi_local: false/' "$ORIGINAL_CONFIG" || true
    fi
  fi

npm ci --no-audit --no-fund
if [[ "$DEV_MODE" == "false" ]]; then
  npm run next:build --silent
fi

  if [[ "$RESTORE_CONFIG" == "true" ]]; then
    mv -f "$BACKUP_CONFIG" "$ORIGINAL_CONFIG"
  fi

  popd >/dev/null
else
  echo "  Skipped (per --no-frontend)"
fi

if [[ "$BUILD_ONLY" == "true" && "$DEV_MODE" == "false" ]]; then
  echo "[2/2] Build-only mode: not starting frontend server"
  exit 0
fi

if [[ "$DEV_MODE" == "true" ]]; then
  echo "[2/2] Frontend: start Next.js dev server with Fast Refresh on :$FRONTEND_PORT"
else
  echo "[2/2] Frontend: start Next.js server on :$FRONTEND_PORT"
fi
if [[ "$RUN_FRONTEND" == "true" ]]; then
  pushd "$ROOT_DIR/frontend" >/dev/null
  if [[ "$DEV_MODE" == "true" ]]; then
    npm run next:dev -- --port "$FRONTEND_PORT"
  else
    npm run next:start -- --port "$FRONTEND_PORT"
  fi
  popd >/dev/null
else
  echo "  Skipped (per --no-frontend)"
fi


