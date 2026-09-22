// Bounded, process-local counters for Meteor's read-only instrumentation events.
// Keep only operation names and numbers. Never retain event payloads: they may
// contain user IDs, connection IDs, addresses, arguments or error previews.
const TYPES = [
  'method.start', 'method.end', 'method.error',
  'publication.start', 'publication.ready', 'publication.stop', 'publication.error',
  'ddp.connection.open', 'ddp.connection.close',
];

function createInstrumentationSummary({ now = Date.now, maxOperations = 200 } = {}) {
  const startedAt = now();
  const operations = new Map();
  const connections = { opened: 0, closed: 0, active: 0 };

  function record(event) {
    if (!event || !TYPES.includes(event.type)) return;
    if (event.type === 'ddp.connection.open') {
      connections.opened += 1;
      connections.active += 1;
      return;
    }
    if (event.type === 'ddp.connection.close') {
      connections.closed += 1;
      connections.active = Math.max(0, connections.active - 1);
      return;
    }

    // The dashboard's own poll would otherwise be the most frequent method.
    if (event.type.startsWith('method.') && event.name === 'getInstrumentationReport') return;
    const kind = event.type.startsWith('method.') ? 'Method' : 'Publication';
    const name = typeof event.name === 'string' && event.name
      ? event.name.slice(0, 120) : '(unnamed)';
    const key = `${kind}:${name}`;
    if (!operations.has(key) && operations.size >= maxOperations) return;
    const row = operations.get(key) || {
      kind, name, calls: 0, completed: 0, errors: 0,
      totalMs: 0, timed: 0, maxMs: 0, lastAt: null,
    };
    const phase = event.type.split('.')[1];
    if (phase === 'start') row.calls += 1;
    if (phase === 'end' || phase === 'ready') row.completed += 1;
    if (phase === 'error') row.errors += 1;
    if (['end', 'ready', 'error'].includes(phase) &&
      Number.isFinite(event.durationMs) && event.durationMs >= 0) {
      row.timed += 1;
      row.totalMs += event.durationMs;
      row.maxMs = Math.max(row.maxMs, event.durationMs);
    }
    row.lastAt = now();
    operations.set(key, row);
  }

  function snapshot() {
    return {
      startedAt,
      asOf: now(),
      connections: { ...connections },
      operations: [...operations.values()].map(row => ({
        kind: row.kind, name: row.name, calls: row.calls,
        completed: row.completed, errors: row.errors,
        averageMs: row.timed ? Math.round(row.totalMs / row.timed) : null,
        maxMs: row.timed ? Math.round(row.maxMs) : null,
        lastAt: row.lastAt,
      })).sort((a, b) => b.calls - a.calls || a.kind.localeCompare(b.kind) || a.name.localeCompare(b.name)),
    };
  }
  return { record, snapshot };
}

module.exports = { TYPES, createInstrumentationSummary };
