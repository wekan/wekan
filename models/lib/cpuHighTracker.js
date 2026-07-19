'use strict';

// Turn a stream of CPU-usage samples into ONLY "start" and "end" events for
// sustained high-CPU periods — so the Admin Panel → Problems → CPU usage report
// gets two rows per episode (when it began, when it ended), never a flood.
//
// Hysteresis: enter the high state only after `enterSamples` consecutive samples
// at/above `highPct`, and leave it only after `exitSamples` consecutive samples
// below `lowPct` (lowPct < highPct). This keeps a value hovering around the
// threshold from flapping start/end/start/end. Pure and unit-testable (no timers,
// no os calls) — the caller feeds it samples and timestamps.

class HighCpuTracker {
  constructor(opts = {}) {
    this.highPct = opts.highPct != null ? opts.highPct : 85;
    this.lowPct = opts.lowPct != null ? opts.lowPct : 70;
    this.enterSamples = opts.enterSamples != null ? opts.enterSamples : 3;
    this.exitSamples = opts.exitSamples != null ? opts.exitSamples : 3;
    this.high = false;
    this.aboveCount = 0;
    this.belowCount = 0;
    this.startedAt = null;
    this.peak = 0;
  }

  // Feed one CPU% sample (0..100) taken at time `now` (ms). Returns:
  //   { event: 'start', at, pct }                         when a high period begins
  //   { event: 'end', at, startedAt, durationMs, peak }   when it ends
  //   { event: null }                                     otherwise
  update(pct, now) {
    const value = Number(pct) || 0;
    if (!this.high) {
      this.aboveCount = value >= this.highPct ? this.aboveCount + 1 : 0;
      if (this.aboveCount >= this.enterSamples) {
        this.high = true;
        this.belowCount = 0;
        this.startedAt = now;
        this.peak = value;
        return { event: 'start', at: now, pct: value };
      }
      return { event: null };
    }
    if (value > this.peak) this.peak = value;
    this.belowCount = value < this.lowPct ? this.belowCount + 1 : 0;
    if (this.belowCount >= this.exitSamples) {
      const startedAt = this.startedAt;
      const peak = this.peak;
      this.high = false;
      this.aboveCount = 0;
      this.startedAt = null;
      this.peak = 0;
      return { event: 'end', at: now, startedAt, durationMs: now - startedAt, peak };
    }
    return { event: null };
  }

  isHigh() {
    return this.high;
  }
}

module.exports = { HighCpuTracker };
