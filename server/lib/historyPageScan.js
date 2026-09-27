'use strict';

// Keep only the requested page, the final page (for out-of-range requests),
// one permission-check batch and per-author counts. Exact totals/search still
// require scanning the scope; this is not a constant-time pagination query.
async function scanHistoryPage({ cursor, readable, matches, paginate }) {
  const requested = paginate(Number.MAX_SAFE_INTEGER);
  let total = 0, batch = [], selected = [], last = [];
  const counts = new Map();
  async function consume() {
    const allowed = await readable(batch);
    for (const row of allowed) {
      if (!matches(row)) continue;
      if (total % requested.limit === 0) last = [];
      last.push(row);
      if (total >= requested.skip && total < requested.skip + requested.limit) selected.push(row);
      total++;
      counts.set(row.userId, (counts.get(row.userId) || 0) + 1);
    }
    batch = [];
  }
  try {
    for await (const row of cursor) {
      batch.push(row);
      if (batch.length === 100) await consume();
    }
    if (batch.length) await consume();
  } finally {
    await cursor.close();
  }
  const info = paginate(total);
  return { rows: info.page === requested.page ? selected : last, total, page: info.page,
    pageSize: info.limit,
    contributors: [...counts].map(([userId, count]) => ({ userId, count })).sort((a, b) => b.count - a.count) };
}
module.exports = { scanHistoryPage };
