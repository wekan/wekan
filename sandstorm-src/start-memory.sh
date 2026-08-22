#!/bin/sh
set -eu
_memory_mb=$(awk '/^MemTotal:/{print int($2/1024)}' /proc/meminfo 2>/dev/null || echo 2048)
for _f in /sys/fs/cgroup/memory.max /sys/fs/cgroup/memory/memory.limit_in_bytes; do
  [ -r "$_f" ] || continue
  _b=$(cat "$_f" 2>/dev/null || true)
  case "$_b" in ''|max|*[!0-9]*) continue;; esac
  _m=$((_b/1048576))
  [ "$_m" -gt 0 ] && [ "$_m" -lt "$_memory_mb" ] && _memory_mb=$_m
  break
done
_heap_mb=$((_memory_mb*3/5))
[ "$_heap_mb" -gt 4096 ] && _heap_mb=4096
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=$_heap_mb}"
exec node start.js
