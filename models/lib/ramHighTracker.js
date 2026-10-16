'use strict';

// RAM-usage monitor, the pure half (docs/Features/Admin-Panel/Problems/RAM-usage.md):
// read /proc/meminfo, turn it into used percentages, and turn a stream of
// samples into only the "start" and "end" of each sustained high-memory period.
// No timers, no os calls - server/lib/ramMonitor.js feeds it.

// /proc/meminfo is "Key:   1234 kB" lines. Returns { key: bytes } for the lines
// it understands; an unreadable or empty text gives {}.
function parseMeminfo(text) {
  const out = {};
  for (const line of String(text || '').split('\n')) {
    const m = /^(\w+):\s+(\d+)(?:\s+kB)?\s*$/.exec(line.trim());
    if (m) out[m[1]] = Number(m[2]) * 1024;
  }
  return out;
}

function percent(used, total) {
  if (!(total > 0) || !Number.isFinite(used)) return null;
  return Math.max(0, Math.min(100, Math.round((used / total) * 100)));
}

// The numbers a sample is made of. RAM counts as available what the kernel says
// is available (MemAvailable: free memory plus the cache it can drop); without
// it - an old kernel, not Linux - the free memory Node reports. Swap is null when
// the machine has none or it cannot be read, and then only RAM decides.
function memoryUsage({ totalmem, freemem, meminfo = {} }) {
  const total = meminfo.MemTotal || totalmem;
  const available = meminfo.MemAvailable != null ? meminfo.MemAvailable : freemem;
  const ramPct = percent(total - available, total);
  const swapTotal = meminfo.SwapTotal || 0;
  const swapUsed = swapTotal > 0 && meminfo.SwapFree != null ? swapTotal - meminfo.SwapFree : null;
  return {
    ramTotal: total || 0,
    ramUsed: total && available != null ? total - available : 0,
    ramPct,
    swapTotal,
    swapUsed,
    swapPct: swapUsed == null ? null : percent(swapUsed, swapTotal),
  };
}

// Start/end of sustained memory pressure. High begins after `enterSamples`
// samples in a row with RAM at/above `highPct` OR swap at/above `swapHighPct`;
// it ends after `exitSamples` in a row with RAM below `lowPct` AND swap below
// `swapHighPct`. Tracks the peak of both.
class HighRamTracker {
  constructor(opts = {}) {
    this.highPct = opts.highPct != null ? opts.highPct : 90;
    this.lowPct = opts.lowPct != null ? opts.lowPct : 80;
    this.swapHighPct = opts.swapHighPct != null ? opts.swapHighPct : 25;
    this.enterSamples = opts.enterSamples != null ? opts.enterSamples : 3;
    this.exitSamples = opts.exitSamples != null ? opts.exitSamples : 3;
    this.high = false;
    this.aboveCount = 0;
    this.belowCount = 0;
    this.startedAt = null;
    this.peakRam = 0;
    this.peakSwap = null;
  }

  // Feed one sample { ramPct, swapPct } (swapPct may be null). Returns
  //   { event: 'start', at, ramPct, swapPct }
  //   { event: 'end', at, startedAt, durationMs, peakRam, peakSwap }
  //   { event: null }
  update(sample, now) {
    const ram = Number(sample && sample.ramPct) || 0;
    const swap = sample && Number.isFinite(sample.swapPct) ? sample.swapPct : null;
    const pressured = ram >= this.highPct || (swap != null && swap >= this.swapHighPct);
    if (!this.high) {
      this.aboveCount = pressured ? this.aboveCount + 1 : 0;
      if (this.aboveCount >= this.enterSamples) {
        this.high = true;
        this.belowCount = 0;
        this.startedAt = now;
        this.peakRam = ram;
        this.peakSwap = swap;
        return { event: 'start', at: now, ramPct: ram, swapPct: swap };
      }
      return { event: null };
    }
    if (ram > this.peakRam) this.peakRam = ram;
    if (swap != null && (this.peakSwap == null || swap > this.peakSwap)) this.peakSwap = swap;
    const calm = ram < this.lowPct && (swap == null || swap < this.swapHighPct);
    this.belowCount = calm ? this.belowCount + 1 : 0;
    if (this.belowCount >= this.exitSamples) {
      const res = { event: 'end', at: now, startedAt: this.startedAt,
        durationMs: now - this.startedAt, peakRam: this.peakRam, peakSwap: this.peakSwap };
      this.high = false;
      this.aboveCount = 0;
      this.startedAt = null;
      this.peakRam = 0;
      this.peakSwap = null;
      return res;
    }
    return { event: null };
  }

  isHigh() {
    return this.high;
  }
}

module.exports = { parseMeminfo, memoryUsage, HighRamTracker };
