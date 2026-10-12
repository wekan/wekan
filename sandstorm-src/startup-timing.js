// Grain startup diagnostics. No files, polling, or database writes: stdout goes
// to the grain log. hrtime is monotonic and shared by processes on this host.
'use strict';

module.exports = function startupTiming(component, fresh = false) {
  if (process.env.WEKAN_STARTUP_TIMING !== '1') return () => {};
  const now = process.hrtime.bigint();
  const inherited = process.env.WEKAN_STARTUP_ORIGIN_NS || '';
  const origin = !fresh && /^\d+$/.test(inherited) && BigInt(inherited) <= now
    ? BigInt(inherited) : now;
  process.env.WEKAN_STARTUP_ORIGIN_NS = String(origin);
  let previous = now;
  let previousCpu = process.cpuUsage();
  return function mark(event) {
    // Diagnostics must never prevent the app from starting.
    try {
      const at = process.hrtime.bigint();
      const cpu = process.cpuUsage();
      const ms = ns => Math.round(Number(ns) / 1e3) / 1e3;
      console.log('[sandstorm-startup] ' + JSON.stringify({
        component, event, pid: process.pid,
        elapsedMs: ms(at - origin), deltaMs: ms(at - previous),
        cpuUserMs: (cpu.user - previousCpu.user) / 1000,
        cpuSystemMs: (cpu.system - previousCpu.system) / 1000,
      }));
      previous = at;
      previousCpu = cpu;
    } catch (_) { /* best-effort diagnostics */ }
  };
};
