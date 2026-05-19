#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
APP_DIR="${APP_DIR:-$ROOT_DIR/daily-app}"
EVENHUB_BIN="${EVENHUB_BIN:-$ROOT_DIR/node_modules/.bin/evenhub}"

DEV_PORT="${DEV_PORT:-5173}"
DEV_IP="${DEV_IP:-}"
DEV_URL="${DEV_URL:-}"
DEV_PATH="${DEV_PATH:-/}"
OPEN_QR_EXTERNAL="${OPEN_QR_EXTERNAL:-0}"
START_SIMULATOR="${START_SIMULATOR:-1}"
SIMULATOR_CMD="${SIMULATOR_CMD:-evenhub-simulator}"
SIMULATOR_AUTOMATION_PORT="${SIMULATOR_AUTOMATION_PORT:-9898}"
WAIT_SECONDS="${WAIT_SECONDS:-45}"

DEV_PID=""
SIMULATOR_PID=""

print_info() {
  printf '[even-start] %s\n' "$1"
}

print_error() {
  printf '[even-start] ERROR: %s\n' "$1" >&2
}

cleanup() {
  local code=$?
  if [[ -n "$SIMULATOR_PID" ]] && kill -0 "$SIMULATOR_PID" 2>/dev/null; then
    kill "$SIMULATOR_PID" >/dev/null 2>&1 || true
  fi
  if [[ -n "$DEV_PID" ]] && kill -0 "$DEV_PID" 2>/dev/null; then
    kill "$DEV_PID" >/dev/null 2>&1 || true
    wait "$DEV_PID" >/dev/null 2>&1 || true
  fi
  exit "$code"
}
trap cleanup INT TERM EXIT

resolve_ip() {
  if [[ -n "$DEV_IP" ]]; then
    printf '%s' "$DEV_IP"
    return
  fi

  local ip
  local default_iface

  default_iface="$(route get default 2>/dev/null | awk '/interface:/{print $2}' || true)"
  if [[ -n "$default_iface" ]]; then
    ip="$(ipconfig getifaddr "$default_iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      printf '%s' "$ip"
      return
    fi
  fi

  ip="$(ipconfig getifaddr en0 2>/dev/null || true)"
  if [[ -n "$ip" ]]; then
    printf '%s' "$ip"
    return
  fi

  ip="$(ipconfig getifaddr en1 2>/dev/null || true)"
  if [[ -n "$ip" ]]; then
    printf '%s' "$ip"
    return
  fi

  ip="$(ifconfig 2>/dev/null | awk '/inet / && $2 != "127.0.0.1" {print $2; exit}' || true)"
  if [[ -n "$ip" ]]; then
    printf '%s' "$ip"
    return
  fi

  ip="$(hostname -I 2>/dev/null | awk '{print $1}' || true)"
  if [[ -n "$ip" ]]; then
    printf '%s' "$ip"
    return
  fi

  return 1
}

wait_for_url() {
  local url="$1"
  local max_wait="$2"
  local dev_pid="$3"
  local i

  for ((i = 1; i <= max_wait; i++)); do
    if ! kill -0 "$dev_pid" 2>/dev/null; then
      return 2
    fi
    if curl -fsS "$url" >/dev/null 2>&1; then
      return 0
    fi
    sleep 1
  done
  return 1
}

if [[ ! -x "$EVENHUB_BIN" ]]; then
  print_error "EvenHub CLI not found at $EVENHUB_BIN. Run: npm install"
  exit 1
fi

if [[ ! -f "$APP_DIR/package.json" ]]; then
  print_error "Could not find app package.json in $APP_DIR"
  exit 1
fi

if [[ -z "$DEV_URL" ]]; then
  HOST_IP="$(resolve_ip || true)"
  if [[ -z "$HOST_IP" ]]; then
    print_error "Could not determine local IP. Set DEV_IP or DEV_URL manually."
    exit 1
  fi
  DEV_URL="http://$HOST_IP:$DEV_PORT$DEV_PATH"
fi

print_info "Starting Vite dev server in $APP_DIR on port $DEV_PORT ..."
(
  cd "$APP_DIR"
  npm run dev -- --port "$DEV_PORT"
) &
DEV_PID=$!

print_info "Waiting for dev server at $DEV_URL ..."
wait_status=0
wait_for_url "$DEV_URL" "$WAIT_SECONDS" "$DEV_PID" || wait_status=$?
if [[ "$wait_status" -ne 0 ]]; then
  if [[ "$wait_status" -eq 2 ]]; then
    print_error "Dev server exited before becoming reachable."
  else
    print_error "Dev server did not become ready within ${WAIT_SECONDS}s."
  fi
  exit 1
fi

print_info "Dev server reachable: $DEV_URL"
print_info "QR Code for Even app:"
"$EVENHUB_BIN" qr --url "$DEV_URL"

if [[ "$OPEN_QR_EXTERNAL" == "1" ]]; then
  print_info "Opening external QR window ..."
  "$EVENHUB_BIN" qr --url "$DEV_URL" --external || print_error "Could not open external QR window."
fi

if [[ "$START_SIMULATOR" == "1" ]]; then
  if command -v "$SIMULATOR_CMD" >/dev/null 2>&1; then
    simulator_args=("$DEV_URL")
    if [[ -n "$SIMULATOR_AUTOMATION_PORT" ]]; then
      simulator_args+=(--automation-port "$SIMULATOR_AUTOMATION_PORT")
      print_info "Simulator automation API: http://127.0.0.1:$SIMULATOR_AUTOMATION_PORT"
    fi

    print_info "Starting simulator: $SIMULATOR_CMD ${simulator_args[*]}"
    "$SIMULATOR_CMD" "${simulator_args[@]}" >/tmp/evenhub-simulator.log 2>&1 &
    SIMULATOR_PID=$!
  else
    print_error "Simulator command not found: $SIMULATOR_CMD"
    print_error "Install globally: npm i -g @evenrealities/evenhub-simulator"
  fi
fi

print_info "Ready. Scan QR in the app. Press Ctrl+C to stop everything."
wait "$DEV_PID"
