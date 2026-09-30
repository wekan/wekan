'use strict';
// A History adapter for the Sync integration tests that behaves like the
// production legacy path (server/lib/storedHistoryChain.js): one writer, and
// each appended row linked after the chain's TIP - the newest hashed row, then
// its successors, because the rows of one Sync batch share a planned createdAt.
const { hashHistoryRow } = require('../../models/lib/changeHistoryIntegrity');
function linkingHistory(events, extra = {}) {
  const history = {
    admitHistoryWriter: ({ work }) => work({ mode: 'legacy', assertCurrent: async () => {} }),
    // `this` is the adapter the caller built, so its own insertAsync (which a
    // test may make fail or lose its reply) is the one used.
    async appendSyncHistoryRow({ row }) {
      if (await events.findOne({ _id: row._id })) return row._id;
      let previous = await events.findOne({ boardId: row.boardId, integrityHash: { $nin: [null, ''] } }, { sort: { createdAt: -1 } });
      for (let next; previous && (next = await events.findOne({ boardId: row.boardId, previousHash: previous.integrityHash }));) previous = next;
      const saved = { ...row, previousHash: previous ? previous.integrityHash : null };
      saved.integrityHash = hashHistoryRow(saved);
      await this.insertAsync(saved);
      return row._id;
    },
    findOneAsync: query => events.findOne(typeof query === 'string' ? { _id: query } : query),
    insertAsync: async row => { await events.insertOne(row); return row._id; },
    updateAsync: async (selector, modifier) => (await events.updateOne(selector, modifier)).modifiedCount,
    ...extra,
  };
  return history;
}
module.exports = { linkingHistory };
