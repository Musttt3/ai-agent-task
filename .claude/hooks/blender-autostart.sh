#!/usr/bin/env bash
# PreToolUse hook for mcp__blender__* tools: make sure a Blender with the
# MCP add-on is listening before the tool call goes out. Installs Blender on
# first use in a fresh container (1-2 min), then starts it; afterwards it is a
# no-op port check.
#
# Exit 0 lets the tool run. Exit 2 blocks it and shows stderr to Claude, so a
# failed start reports the real reason instead of "Connection refused".
cat >/dev/null  # hook input (JSON on stdin) is not needed

LOG=/tmp/blender-mcp-hook.log
if "${CLAUDE_PROJECT_DIR:-$(dirname "$0")/../..}/scripts/blender-mcp-up.sh" >"$LOG" 2>&1; then
  exit 0
fi

{
  echo "Could not start Blender for the MCP tool call. Last lines of ${LOG}:"
  tail -n 20 "$LOG"
  echo "Blender's own log: /tmp/blender-mcp.log"
} >&2
exit 2
