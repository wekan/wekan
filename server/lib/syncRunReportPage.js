const STATUSES = ['all', 'unfinished', 'failed', 'completed-with-warnings', 'completed', 'review-only', 'skipped'];
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Shared raw query for the admin Recovery view. Search is literal, never a
// user-provided expression, and old diagnostics are excluded even without TTL.
async function syncRunReportPage(collection, { search = '', status = 'unfinished', page = 1 } = {}, now = new Date()) {
  if (typeof search !== 'string' || search.length > 100 || !STATUSES.includes(status) ||
    !Number.isSafeInteger(page) || page < 1 || page > 100000) throw new Error('Invalid Sync report query');
  const selector = { startedAt: { $gte: new Date(now.getTime() - 30 * 86400000) } };
  if (status !== 'all') selector.status = status;
  if (search.trim()) {
    const pattern = new RegExp(escape(search.trim()), 'i');
    selector.$or = [{ listId: pattern }, { boardId: pattern }];
  }
  const total = await collection.countDocuments(selector);
  const selectedPage = Math.min(page, Math.max(1, Math.ceil(total / 10)));
  const rows = await collection.find(selector, { projection: {
    _id: 1, listId: 1, boardId: 1, startedAt: 1, finishedAt: 1, status: 1,
    created: 1, updated: 1, archived: 1, coverage: 1,
  } }).sort({ startedAt: -1, _id: -1 }).skip((selectedPage - 1) * 10).limit(10).toArray();
  return { rows, total, page: selectedPage };
}
module.exports = { syncRunReportPage, STATUSES };
