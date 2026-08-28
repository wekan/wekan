// Opt-in performance diagnostics for a local JSONL file.
//
// DEBUGSPEED=true is deliberately required: sampling and wrapping DDP handlers
// adds work of its own.  Query values, arguments, user ids and URLs are never
// recorded; a speed report must be safe to share with a bug report. These
// diagnostics never write to Admin Panel -> Problems.

import { Meteor } from 'meteor/meteor';
import { appendFileSync } from 'node:fs';
import { monitorEventLoopDelay, performance } from 'node:perf_hooks';

const ENABLED = process.env.DEBUGSPEED === 'true';
const LOG_FILE = process.env.DEBUGSPEED_LOG_FILE || '';
const SLOW_MS = Math.max(1, Number.parseInt(process.env.DEBUGSPEED_SLOW_MS || '250', 10));
const SAMPLE_MS = Math.max(5000, Number.parseInt(process.env.DEBUGSPEED_SAMPLE_MS || '30000', 10));

// One folded event per source per sampling window keeps the diagnostic itself
// from becoming a database workload during a traffic run.
const lastRecorded = new Map();
function recordBounded(source, detail, severity = 'low') {
  const now = Date.now();
  if (now - (lastRecorded.get(source) || 0) < SAMPLE_MS) return;
  lastRecorded.set(source, now);
  if (!LOG_FILE) return;
  try {
    appendFileSync(LOG_FILE, `${JSON.stringify({
      timestamp: new Date(now).toISOString(),
      category: 'debug-speed',
      action: 'measured',
      source,
      detail,
      severity,
    })}\n`, { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    // Report a fixed message only; paths and error objects may expose local
    // details. The diagnostic must never disrupt the measured operation.
    console.error('[DEBUGSPEED] Could not append the diagnostic log.'); // eslint-disable-line no-console
  }
}

function wrapHandlers(registry, kind) {
  if (!registry || typeof registry !== 'object') return;
  for (const [name, handler] of Object.entries(registry)) {
    if (typeof handler !== 'function' || handler.__wekanDebugSpeedWrapped) continue;
    const wrapped = function debugSpeedHandler(...args) {
      const started = performance.now();
      let result;
      try {
        result = handler.apply(this, args);
      } catch (error) {
        const ms = performance.now() - started;
        if (ms >= SLOW_MS) recordBounded(`${kind}:${name}`, `${kind} ${name}: ${Math.round(ms)}ms (failed)`);
        throw error;
      }
      if (!result || typeof result.then !== 'function') {
        const ms = performance.now() - started;
        if (ms >= SLOW_MS) recordBounded(`${kind}:${name}`, `${kind} ${name}: ${Math.round(ms)}ms`);
        return result;
      }
      return result.then(value => {
        const ms = performance.now() - started;
        if (ms >= SLOW_MS) recordBounded(`${kind}:${name}`, `${kind} ${name}: ${Math.round(ms)}ms`);
        return value;
      }, error => {
        const ms = performance.now() - started;
        if (ms >= SLOW_MS) recordBounded(`${kind}:${name}`, `${kind} ${name}: ${Math.round(ms)}ms (failed)`);
        throw error;
      });
    };
    wrapped.__wekanDebugSpeedWrapped = true;
    registry[name] = wrapped;
  }
}

if (ENABLED) {
  Meteor.startup(() => {
    // Meteor registers all application methods/publications before startup
    // callbacks run. These registries are internal, hence this is debug-only.
    wrapHandlers(Meteor.server && Meteor.server.method_handlers, 'method');
    wrapHandlers(Meteor.server && Meteor.server.publish_handlers, 'publication');

    const loop = monitorEventLoopDelay({ resolution: 20 });
    loop.enable();
    let previousCpu = process.cpuUsage();
    let previousAt = process.hrtime.bigint();

    recordBounded('wekan.startup', `DEBUGSPEED enabled; slow=${SLOW_MS}ms sample=${SAMPLE_MS}ms database=${process.env.MONGO_URL ? 'external' : 'meteor-mongodb'}`, 'info');

    Meteor.setInterval(() => {
      const now = process.hrtime.bigint();
      const cpu = process.cpuUsage(previousCpu);
      const elapsedMicros = Number(now - previousAt) / 1000;
      previousCpu = process.cpuUsage();
      previousAt = now;
      const memory = process.memoryUsage();
      const cpuPercent = elapsedMicros > 0 ? ((cpu.user + cpu.system) / elapsedMicros) * 100 : 0;
      const p99ms = Number(loop.percentile(99)) / 1e6;
      const detail = `cpu=${cpuPercent.toFixed(1)}% rss=${Math.round(memory.rss / 1048576)}MiB heap=${Math.round(memory.heapUsed / 1048576)}MiB event-loop-p99=${p99ms.toFixed(1)}ms`;
      recordBounded('wekan.process', detail, cpuPercent >= 100 || p99ms >= 250 ? 'medium' : 'info');
      loop.reset();
    }, SAMPLE_MS);
  });
}
