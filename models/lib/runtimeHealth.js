'use strict';

const DEFAULT_HEAP_RATIO = 0.9;
const DEFAULT_DISK_BYTES = 256 * 1024 * 1024;

function heapHealth(used, limit, ratio = DEFAULT_HEAP_RATIO) {
  if (!Number.isFinite(used) || !Number.isFinite(limit) || limit <= 0) return { ok: false, detail: 'heap statistics unavailable' };
  const usedRatio = used / limit;
  return { ok: usedRatio < ratio, detail: `V8 heap ${Math.round(used / 1048576)} MiB of ${Math.round(limit / 1048576)} MiB (${Math.round(usedRatio * 100)}%)` };
}

function diskHealth(blocksAvailable, blockSize, minimum = DEFAULT_DISK_BYTES) {
  const available = Number(blocksAvailable) * Number(blockSize);
  if (!Number.isFinite(available) || available < 0) return { ok: false, detail: 'free disk space unavailable' };
  return { ok: available >= minimum, detail: `filesystem has ${Math.round(available / 1048576)} MiB free; minimum ${Math.round(minimum / 1048576)} MiB` };
}

module.exports = { heapHealth, diskHealth, DEFAULT_HEAP_RATIO, DEFAULT_DISK_BYTES };
