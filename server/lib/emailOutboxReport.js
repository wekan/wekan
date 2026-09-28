const { EMAIL_FAILURE_REASONS } = require('./emailRetryPolicy');
const escape = value => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// One row per recipient, not per notification. Payloads and recipient addresses
// are never selected or returned. Paused empty queues stay visible for resume.
async function emailOutboxReport({ jobs, controls, users }, { search = '', page = 1 } = {}) {
  if (typeof search !== 'string' || search.length > 100 || !Number.isSafeInteger(page) || page < 1 || page > 100000) {
    throw new Error('invalid-email-report');
  }
  const pattern = search.trim() ? new RegExp(escape(search.trim()), 'i') : null;
  const match = { state: { $in: ['pending', 'failed'] }, ...(pattern ? { userId: pattern } : {}) };
  const group = { $group: { _id: '$userId', queued: { $sum: 1 }, oldest: { $min: '$createdAt' },
    nextAttemptAt: { $min: '$nextAttemptAt' }, attempts: { $max: '$attempts' },
    failed: { $sum: { $cond: [{ $eq: ['$state', 'failed'] }, 1, 0] } },
    retrying: { $sum: { $cond: [{ $and: [{ $eq: ['$state', 'pending'] }, { $gt: ['$attempts', 0] }] }, 1, 0] } } } };
  EMAIL_FAILURE_REASONS.forEach((reason, index) => {
    group.$group[`reason${index}`] = { $sum: { $cond: [{ $eq: ['$lastFailure', reason] }, 1, 0] } };
  });
  // Merge two sorted cursors rather than depending on $unionWith support in
  // database adapters. Count exactly while retaining only the requested/last
  // ten rows; empty paused recipients remain available to resume.
  const pending = jobs.aggregate([{ $match: match }, group, { $sort: { _id: 1 } }]).batchSize(50);
  const paused = controls.find({ paused: true, ...(pattern ? { _id: pattern } : {}) },
    { projection: { _id: 1 } }).sort({ _id: 1 }).batchSize(50);
  let total = 0, selected = [], last = [];
  try {
    let left = await pending.next(), right = await paused.next();
    while (left || right) {
      const order = !left ? 1 : !right ? -1 : Buffer.compare(Buffer.from(left._id), Buffer.from(right._id));
      let row;
      if (order <= 0) {
        row = left; left = await pending.next();
        if (order === 0) right = await paused.next();
      } else {
        row = { _id: right._id, queued: 0, retrying: 0, failed: 0, attempts: 0, oldest: null, nextAttemptAt: null };
        right = await paused.next();
      }
      if (total % 10 === 0) last = [];
      last.push(row);
      if (Math.floor(total / 10) + 1 === page) selected.push(row);
      total++;
    }
  } finally { await Promise.all([pending.close(), paused.close()]); }
  const selectedPage = Math.min(page, Math.max(1, Math.ceil(total / 10)));
  const rows = selectedPage === page ? selected : last;
  const ids = rows.map(row => row._id);
  const stateRows = await controls.find({ _id: { $in: ids } }, { projection: {
    _id: 1, paused: 1, lastAction: 1, changedAt: 1, changedBy: 1,
  } }).toArray();
  const accounts = await users.find({ _id: { $in: ids } }, { projection: { _id: 1, username: 1 } }).toArray();
  const state = new Map(stateRows.map(row => [row._id, row])), names = new Map(accounts.map(row => [row._id, row.username]));
  return { total, page: selectedPage, rows: rows.map(row => ({ userId: row._id, username: names.get(row._id) || '',
    queued: row.queued, retrying: row.retrying, failed: row.failed,
    failures: EMAIL_FAILURE_REASONS.map((reason, index) => ({ reason, count: row[`reason${index}`] || 0 })).filter(row => row.count > 0),
    attempts: row.attempts, oldest: row.oldest,
    nextAttemptAt: row.nextAttemptAt, paused: state.get(row._id)?.paused === true,
    lastAction: state.get(row._id)?.lastAction, changedAt: state.get(row._id)?.changedAt,
    changedBy: state.get(row._id)?.changedBy,
  })) };
}
module.exports = { emailOutboxReport };
