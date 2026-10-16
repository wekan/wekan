// ============================================================================
// WeKan disk-usage monitor (Admin Panel → Problems → Disk usage).
// docs/Features/Admin-Panel/Problems/Disk-usage.md
// ----------------------------------------------------------------------------
// Samples how full each filesystem WeKan writes to is, and records only the
// START and END of each sustained high-usage period per filesystem to the
// 'disk' event stream. Observe-and-report only: nothing is deleted. A no-op
// where fs.statfs is not available or not permitted.
// ============================================================================

import { Meteor } from 'meteor/meteor';
import fs from 'fs';
import path from 'path';
const { intEnv } = require('/models/lib/intEnv');
const { isFilesRoot } = require('/models/lib/filesRoot');
const { statfsUsage, watchedPaths, DiskEpisodes } = require('/models/lib/diskHighTracker');

const ENABLED = String(process.env.WEKAN_DISK_MONITOR || 'true').toLowerCase() !== 'false';
const INTERVAL_MS = Math.max(5000, intEnv('WEKAN_DISK_SAMPLE_INTERVAL_MS', 30000));
const HIGH_PCT = intEnv('WEKAN_DISK_HIGH_PERCENT', 90);
const LOW_PCT = intEnv('WEKAN_DISK_LOW_PERCENT', 85);
const ENTER_SAMPLES = Math.max(1, intEnv('WEKAN_DISK_HIGH_SAMPLES', 2));
const EXIT_SAMPLES = Math.max(1, intEnv('WEKAN_DISK_LOW_SAMPLES', 2));

const episodes = new DiskEpisodes({
  highPct: HIGH_PCT, lowPct: LOW_PCT, enterSamples: ENTER_SAMPLES, exitSamples: EXIT_SAMPLES,
});
let lastSamples = [];

// The files root WeKan stores attachments under (as server/lib/selfChecks.js),
// and the snap's data directory, which holds the database.
function defaultPaths() {
  const base = process.env.WRITABLE_PATH || process.cwd();
  return watchedPaths({
    override: process.env.WEKAN_DISK_WATCH_PATHS,
    dataPath: process.env.SNAP_COMMON || '',
    filesRoot: isFilesRoot(base) ? base : path.join(base, 'files'),
  });
}

// One entry per filesystem: paths on the same device are measured once.
export function sampleDisks() {
  if (typeof fs.statfsSync !== 'function') return [];
  const byDevice = new Map();
  for (const watched of defaultPaths()) {
    try {
      if (!fs.existsSync(watched.path)) continue;
      const dev = String(fs.statSync(watched.path).dev);
      const usage = statfsUsage(fs.statfsSync(watched.path));
      if (!usage) continue;
      if (byDevice.has(dev)) byDevice.get(dev).roles.push(watched.role);
      else byDevice.set(dev, { fsKey: dev, path: watched.path, roles: [watched.role], ...usage });
    } catch (e) { /* not permitted or gone: skip this path */ }
  }
  return [...byDevice.values()];
}

const gb = bytes => {
  const v = bytes / (1024 ** 3);
  return v >= 10 ? Math.round(v).toString() : v.toFixed(1);
};
const where = d => `${d.path} (${d.roles.join(', ')})`;
// What WeKan is doing, as the CPU and RAM rows say it.
function activity() {
  try {
    const { currentActivityLabel } = require('/server/lib/cpuMonitor');
    const label = currentActivityLabel();
    return label ? `, WeKan: ${label}` : '';
  } catch (e) {
    return '';
  }
}
const duration = ms => {
  const s = Math.round(ms / 1000);
  return s >= 120 ? `${Math.round(s / 60)}m` : `${s}s`;
};

export function getCurrentDisks() {
  const disks = ENABLED && lastSamples.length ? lastSamples : sampleDisks();
  return {
    disks: disks.map(d => ({ ...d, high: episodes.isHigh(d.fsKey) })),
    highPercent: HIGH_PCT,
    monitored: ENABLED,
  };
}

if (Meteor.isServer && ENABLED) {
  Meteor.startup(() => {
    const { record } = require('/server/lib/diskLog');
    Meteor.setInterval(() => {
      try {
        const now = Date.now();
        lastSamples = sampleDisks();
        for (const d of lastSamples) {
          const res = episodes.update(d.fsKey, d.usedPct, now);
          if (res.event === 'start') {
            record({
              action: 'detected',
              severity: d.usedPct >= 95 ? 'high' : 'medium',
              detail: `high disk usage started (>= ${HIGH_PCT}%) on ${where(d)}: ${d.usedPct}% used, ` +
                `${gb(d.available)} GB free of ${gb(d.total)} GB${activity()}`,
            });
          } else if (res.event === 'end') {
            record({
              action: 'remediated',
              severity: 'info',
              at: new Date(now),
              detail: `high disk usage ended after ${duration(res.durationMs || 0)} on ${d.path} ` +
                `(peak ${res.peak}%, back under ${LOW_PCT}%): ${d.usedPct}% used, ` +
                `${gb(d.available)} GB free of ${gb(d.total)} GB`,
            });
          }
        }
      } catch (e) {
        if (process.env.DEBUG === 'true') console.warn('diskMonitor sample failed:', e && e.message);
      }
    }, INTERVAL_MS);
  });
}

export default { getCurrentDisks, sampleDisks };
