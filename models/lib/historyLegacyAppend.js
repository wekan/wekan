'use strict';

// Appending one row to a board's History chain on the legacy path (every board
// not migrated to the coordinated chain, server/lib/storedHistoryChain.js).
//
// Each row names the row before it (previousHash). The append used to read
// "the newest row" and insert after it as two separate steps, so two changes
// saved at the same moment on one board - two members, or one action whose
// hooks record twice at once - both named the same row: a fork. The audit
// then reported it as critical HistoryIntegrity tampering every hour, and
// undo, redo and restore were refused for both rows (requireHistoryIntegrity).
//
// Now a board's appends take turns within this server, and each links to the
// chain's TIP: from the newest row, following successors, as Sync History
// already did (a tie on createdAt no longer gives one row two successors).
// Servers that write the same board at once can still race; the coordinated
// chain is the fix for that, and the audit tells the two kinds of fork apart.

const queues = new Map();

// Runs `work` after every earlier append for this board in this server has
// finished; a failed append does not stop the next one.
function serializeHistoryAppend(boardId, work) {
  const key = String(boardId);
  const run = (queues.get(key) || Promise.resolve()).then(work, work);
  const tail = run.then(() => {}, () => {});
  queues.set(key, tail);
  tail.then(() => { if (queues.get(key) === tail) queues.delete(key); });
  return run;
}

const MAX_TIP_STEPS = 10000;

// The chain's last row: the newest hashed row, then its successors.
async function historyChainTip(history, boardId) {
  let tip = await history.findOneAsync({ boardId, integrityHash: { $nin: [null, ''] } },
    { sort: { createdAt: -1 }, transform: null });
  for (let steps = 0; tip && steps < MAX_TIP_STEPS; steps += 1) {
    const next = await history.findOneAsync({ boardId, previousHash: tip.integrityHash }, { transform: null });
    if (!next) break;
    tip = next;
  }
  return tip;
}

/**
 * Append `document` to the board's chain.
 *   history   findOneAsync(selector, options) and insertAsync(document)
 *   hash      hashHistoryRow (models/lib/changeHistoryIntegrity.js)
 *   prepare   optional: the document as saved, made at its turn (createdAt)
 * Resolves to what insertAsync resolves to.
 */
// #6797: the row is stored exactly as it was hashed. collection2 cleans an
// insert by default - an empty string is removed, then the schema's
// defaultValue null fills it - so a list moved with `swimlaneId: ''` (a list
// bound to no one swimlane) was hashed with "" and stored with null, and failed
// its own checksum at every audit: a critical HistoryIntegrity
// "checksum-mismatch" in Admin Panel / Problems / Security for every such move.
// The stored-chain path (server/lib/storedHistoryChain.js) inserts with the
// same options; this, the legacy path, did not.
const HISTORY_INSERT_OPTIONS = Object.freeze({ removeEmptyStrings: false, trimStrings: false });

function appendLegacyHistoryRow({ history, boardId, document, hash, prepare = doc => doc }) {
  return serializeHistoryAppend(boardId, async () => {
    const previous = await historyChainTip(history, boardId);
    const saved = { ...prepare(document), previousHash: previous ? previous.integrityHash : null };
    saved.integrityHash = hash(saved);
    return history.insertAsync(saved, HISTORY_INSERT_OPTIONS);
  });
}

module.exports = { serializeHistoryAppend, historyChainTip, appendLegacyHistoryRow, MAX_TIP_STEPS, HISTORY_INSERT_OPTIONS };
