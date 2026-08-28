#!/usr/bin/env bash
# Sample host and relevant process resource use for debug-speed-server.sh.
# Output is TSV on stdout. Command arguments and environments are deliberately
# excluded because they may contain database URLs, passwords or other user data.

set -euo pipefail

INTERVAL="${DEBUGSPEED_WATCH_INTERVAL:-2}"
case "$INTERVAL" in *[!0-9]*|'') INTERVAL=2 ;; esac
[ "$INTERVAL" -gt 0 ] || INTERVAL=2
WATCH_PATH="${DEBUGSPEED_WATCH_PATH:-.}"

printf 'timestamp\tload\tmem_available_kb\tdisk_available_kb\n'
while :; do
  timestamp="$(date --iso-8601=seconds 2>/dev/null || date)"
  load="$(cut -d' ' -f1-3 /proc/loadavg 2>/dev/null || echo unavailable)"
  mem_available="$(awk '/^MemAvailable:/{print $2}' /proc/meminfo 2>/dev/null || true)"
  disk_available="$(df -Pk "$WATCH_PATH" 2>/dev/null | awk 'NR==2{print $4}')"
  printf '%s\t%s\t%s\t%s\n' \
    "$timestamp" "$load" "${mem_available:-unavailable}" \
    "${disk_available:-unavailable}"
  ps -eo pid=,ppid=,pcpu=,pmem=,rss=,vsz=,stat=,comm= 2>/dev/null |
    awk '$8 == "ferretdb" || $8 == "node" || $8 == "mongod" || $8 == "meteor" { print "process\t" $0 }'
  sleep "$INTERVAL"
done
