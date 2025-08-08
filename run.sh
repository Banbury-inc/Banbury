#!/usr/bin/env bash
set -euo pipefail

# Run the entire Banbury-Website locally:
# - Backend: builds Docker image from backend/Dockerfile and runs on host port 8080 (container port 80)
# - Frontend: builds CRA and serves static build on port 3000
#
# Flags:
#   --local-api       Build frontend to use http://localhost:8080 as API base (temporary edit to config.ts)
#   --build-only      Build images/artifacts but do not start servers
#   --no-backend      Skip backend build/run
#   --no-frontend     Skip frontend build/run
#   --backend-port N  Host port to expose backend on (default 8080)
#   --frontend-port N Port to serve frontend on (default 3000)

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)"
ROOT_DIR="$SCRIPT_DIR"

BACKEND_IMAGE="banbury-backend:local"
BACKEND_CONTAINER_NAME="banbury-backend"
BACKEND_PORT=8080
FRONTEND_PORT=3000
USE_LOCAL_API=false
BUILD_ONLY=false
RUN_BACKEND=true
RUN_FRONTEND=true

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
    --no-backend)
      RUN_BACKEND=false
      shift
      ;;
    --no-frontend)
      RUN_FRONTEND=false
      shift
      ;;
    --backend-port)
      BACKEND_PORT="${2:-8080}"
      shift 2
      ;;
    --frontend-port)
      FRONTEND_PORT="${2:-3000}"
      shift 2
      ;;
    *)
      echo "Unknown option: $1" >&2
      exit 1
      ;;
  esac
done

cleanup() {
  # Stop backend container on exit if running
  if docker ps --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER_NAME}$"; then
    docker stop "$BACKEND_CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

echo "[1/4] Backend: build Docker image ($BACKEND_IMAGE)"
if [[ "$RUN_BACKEND" == "true" ]]; then
  docker build -f "$ROOT_DIR/backend/Dockerfile" -t "$BACKEND_IMAGE" "$ROOT_DIR/backend"
else
  echo "  Skipped (per --no-backend)"
fi

echo "[2/4] Backend: run container ($BACKEND_CONTAINER_NAME on :$BACKEND_PORT -> :80)"
if [[ "$RUN_BACKEND" == "true" && "$BUILD_ONLY" == "false" ]]; then
  # Stop existing container if present
  if docker ps -a --format '{{.Names}}' | grep -q "^${BACKEND_CONTAINER_NAME}$"; then
    docker rm -f "$BACKEND_CONTAINER_NAME" >/dev/null 2>&1 || true
  fi
  docker run -d --name "$BACKEND_CONTAINER_NAME" -p "$BACKEND_PORT:80" "$BACKEND_IMAGE" >/dev/null
else
  echo "  Skipped (per --no-backend or --build-only)"
fi

echo "[3/4] Frontend: install deps and build"
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
  npm run build --silent

  if [[ "$RESTORE_CONFIG" == "true" ]]; then
    mv -f "$BACKUP_CONFIG" "$ORIGINAL_CONFIG"
  fi

  popd >/dev/null
else
  echo "  Skipped (per --no-frontend)"
fi

if [[ "$BUILD_ONLY" == "true" ]]; then
  echo "[4/4] Build-only mode: not starting frontend server"
  exit 0
fi

echo "[4/4] Frontend: serve build on :$FRONTEND_PORT"
if [[ "$RUN_FRONTEND" == "true" ]]; then
  pushd "$ROOT_DIR/frontend" >/dev/null
  npx --yes serve -s build -l "$FRONTEND_PORT"
  popd >/dev/null
else
  echo "  Skipped (per --no-frontend)"
fi


