const { randomUUID } = require('node:crypto');

// Diagnostic records, not replay checkpoints. Incomplete writes must never be
// described as a successful run. Do not copy errors, source URLs or card values.
function reportScope(list) {
  return { listId: list._id, boardId: list.boardId,
    incarnation: list.syncCredentialIncarnation || null };
}
async function withSyncRunReport(collection, list, work, { now = () => new Date() } = {}) {
  const scope = reportScope(list);
  const id = randomUUID();
  await collection.insertOne({ _id: id, ...scope, startedAt: now(), status: 'unfinished' });
  const selector = { _id: id, status: 'unfinished' };
  const recordCoverage = async coverage => {
    await collection.updateOne(selector, { $set: { coverage } });
  };
  try {
    const result = await work(recordCoverage);
    const report = { finishedAt: now(), status: result?.error ? 'failed' : result?.skipped ? 'skipped' : result?.reviewOnly ? 'review-only' : 'completed' };
    if (report.status === 'completed') {
      for (const key of ['created', 'updated', 'archived']) {
        if (Number.isSafeInteger(result?.[key]) && result[key] >= 0) report[key] = result[key];
      }
    }
    const current = await collection.findOne(selector, { projection: { coverage: 1 } });
    if (report.status === 'completed' && (current?.coverage?.source?.occurrences ||
      current?.coverage?.fields || current?.coverage?.parserWarnings || current?.coverage?.parserUnsupported)) {
      report.status = 'completed-with-warnings';
    }
    await collection.updateOne(selector, { $set: report });
    return result;
  } catch (error) {
    // A failed database acknowledgement may mean that a card write committed.
    // No progress counters or error bodies are inferred from an exception.
    try { await collection.updateOne(selector, { $set: { status: 'failed', finishedAt: now() } }); } catch (_) { /* retain unfinished */ }
    throw error;
  }
}
module.exports = { reportScope, withSyncRunReport };
