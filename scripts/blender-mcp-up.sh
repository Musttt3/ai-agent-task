#!/usr/bin/env bash
# Install (if needed) and start a headless Blender with the "MCP for Blender"
# add-on, so the `blender` MCP server in .mcp.json has something to talk to.
#
# Blender runs under a virtual X display (Xvfb) because the add-on refuses to
# start its socket server in `blender -b` background mode: commands are run by
# a timer on Blender's main loop, which only exists with a window.
#
# Usage:  scripts/blender-mcp-up.sh          # install if missing, then start
#         scripts/blender-mcp-up.sh install  # install only (for an environment setup script)
#         scripts/blender-mcp-up.sh stop     # stop the running Blender
set -euo pipefail

BLENDER_VERSION="${BLENDER_VERSION:-4.2.23}"          # 4.2 LTS
BLENDER_SERIES="${BLENDER_VERSION%.*}"                # 4.2
BLENDER_DIR="/opt/blender-${BLENDER_VERSION}-linux-x64"
BLENDER_BIN="${BLENDER_DIR}/blender"
ADDONS_DIR="${HOME}/.config/blender/${BLENDER_SERIES}/scripts/addons"
PORT="${BLENDER_PORT:-9876}"
LOG="${BLENDER_MCP_LOG:-/tmp/blender-mcp.log}"
PIDFILE="/tmp/blender-mcp.pid"

if [[ "${1:-}" == "stop" ]]; then
  if [[ -f "$PIDFILE" ]] && kill -0 "$(cat "$PIDFILE")" 2>/dev/null; then
    kill -- -"$(cat "$PIDFILE")" 2>/dev/null || kill "$(cat "$PIDFILE")"
    echo "Stopped Blender (process group $(cat "$PIDFILE"))."
  else
    echo "Blender is not running."
  fi
  rm -f "$PIDFILE"
  exit 0
fi

port_open() { (exec 3<>"/dev/tcp/127.0.0.1/${PORT}") 2>/dev/null; }

# Fast path for the PreToolUse hook: already up, nothing to do.
if [[ "${1:-}" != "install" ]] && port_open; then
  exit 0
fi

# Serialise installs/launches: parallel tool calls each fire the hook.
exec 9>/tmp/blender-mcp.lock
flock 9

if [[ "${1:-}" != "install" ]] && port_open; then
  echo "Something is already listening on port ${PORT}; assuming Blender MCP is up."
  exit 0
fi

# 1. Blender itself
if [[ ! -x "$BLENDER_BIN" ]]; then
  echo "Downloading Blender ${BLENDER_VERSION}..."
  tmp="$(mktemp -d)"
  curl -fsSL --retry 3 -o "${tmp}/blender.tar.xz" \
    "https://download.blender.org/release/Blender${BLENDER_SERIES}/blender-${BLENDER_VERSION}-linux-x64.tar.xz"
  tar -xf "${tmp}/blender.tar.xz" -C /opt
  rm -rf "$tmp"
fi

# 2. Virtual display + software OpenGL (Mesa llvmpipe; Blender aborts without libEGL)
if ! command -v xvfb-run >/dev/null || ! ldconfig -p | grep -q 'libEGL.so.1'; then
  echo "Installing Xvfb and Mesa GL/EGL..."
  apt-get update -qq
  apt-get install -y -qq xvfb libgl1 libglx-mesa0 libegl1 libegl-mesa0 libgl1-mesa-dri \
    libxkbcommon0 libsm6 libxi6 libxxf86vm1 libxfixes3 libxrender1
fi

# 3. Add-on, taken from the same package version the MCP server runs
if [[ ! -f "${ADDONS_DIR}/blender_mcp.py" ]]; then
  mkdir -p "$ADDONS_DIR"
  uvx mcp-for-blender install-addon --addons-dir "$ADDONS_DIR"
fi
# Pre-fetch the MCP server package: on a cold cache uvx can take longer than
# Claude Code's 30 s MCP connect timeout, and the server is then skipped.
uvx mcp-for-blender --help >/dev/null

if [[ "${1:-}" == "install" ]]; then
  echo "Blender ${BLENDER_VERSION}, Xvfb and the MCP add-on are installed."
  exit 0
fi

# 4. Launch, detached, in its own process group so `stop` can end Xvfb too
echo "Starting Blender ${BLENDER_VERSION} with the MCP add-on (log: ${LOG})..."
export XDG_RUNTIME_DIR="${XDG_RUNTIME_DIR:-/tmp/runtime-$(id -u)}"
mkdir -p -m 700 "$XDG_RUNTIME_DIR"
# Empty WAYLAND_DISPLAY + an X DISPLAY from xvfb-run makes Blender's GHOST use X11.
setsid nohup env -u WAYLAND_DISPLAY xvfb-run -a -s "-screen 0 1920x1080x24" \
  "$BLENDER_BIN" --addons blender_mcp >"$LOG" 2>&1 < /dev/null 9>&- &   # 9>&-: don't let Blender keep the lock
echo $! > "$PIDFILE"

for _ in $(seq 1 60); do
  if port_open; then
    echo "Blender MCP add-on is listening on localhost:${PORT}."
    exit 0
  fi
  sleep 1
done

echo "Blender did not open port ${PORT} within 60 s. Last log lines:" >&2
tail -n 30 "$LOG" >&2
exit 1
