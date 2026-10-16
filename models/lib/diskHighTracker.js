'use strict';

// Disk-usage monitor, the pure half (docs/Features/Admin-Panel/Problems/Disk-usage.md):
// turn fs.statfs() numbers into a used percentage, decide which filesystems to
// watch, and follow each one's high-usage episodes. server/lib/diskMonitor.js
// feeds it. The episode hysteresis is the CPU monitor's, one tracker per
// filesystem, so a full disk on one mount never hides another.

const { HighCpuTracker } = require('./cpuHighTracker');

// statfs: bsize x blocks is the size, bsize x bavail what a non-root process
// may still write. null when the numbers are missing or the size is zero.
function statfsUsage(stat) {
  if (!stat) return null;
  const bsize = Number(stat.bsize);
  const blocks = Number(stat.blocks);
  const bavail = Number(stat.bavail);
  if (!(bsize > 0) || !(blocks > 0) || !Number.isFinite(bavail) || bavail < 0) return null;
  const total = bsize * blocks;
  const available = Math.min(total, bsize * bavail);
  return { total, available, usedPct: Math.round(((total - available) / total) * 100) };
}

// The paths to watch, each once, with what it holds. `filesRoot` is the
// directory WeKan stores files under (WRITABLE_PATH or its files/). `override` is
// WEKAN_DISK_WATCH_PATHS (':'-separated) and replaces the defaults.
function watchedPaths({ override, dataPath, filesRoot }) {
  const entries = [];
  if (override && String(override).trim()) {
    String(override).split(':').map(p => p.trim()).filter(Boolean)
      .forEach(p => entries.push({ path: p, role: 'watched' }));
  } else {
    if (dataPath) entries.push({ path: dataPath, role: 'database' });
    // Uploads are sanitized in <files root>/temp, beside attachments/ and
    // avatars/ (server/lib/fileStatusAudit.js, models/lib/fileTypeCorrection.js).
    if (filesRoot) {
      entries.push({ path: filesRoot, role: 'attachments' });
      entries.push({ path: `${filesRoot.replace(/\/+$/, '')}/temp`, role: 'uploads' });
    }
  }
  const seen = new Set();
  return entries.filter(e => (seen.has(e.path) ? false : seen.add(e.path)));
}

// One HighCpuTracker per filesystem. `fsKey` identifies the filesystem (the
// device id when it is known, so two paths on one disk share an episode).
class DiskEpisodes {
  constructor(opts = {}) {
    this.opts = {
      highPct: opts.highPct != null ? opts.highPct : 90,
      lowPct: opts.lowPct != null ? opts.lowPct : 85,
      enterSamples: opts.enterSamples != null ? opts.enterSamples : 2,
      exitSamples: opts.exitSamples != null ? opts.exitSamples : 2,
    };
    this.trackers = new Map();
  }

  update(fsKey, usedPct, now) {
    if (!this.trackers.has(fsKey)) this.trackers.set(fsKey, new HighCpuTracker(this.opts));
    return this.trackers.get(fsKey).update(usedPct, now);
  }

  isHigh(fsKey) {
    const t = this.trackers.get(fsKey);
    return !!(t && t.isHigh());
  }
}

module.exports = { statfsUsage, watchedPaths, DiskEpisodes };
