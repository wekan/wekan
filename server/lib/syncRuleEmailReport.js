'use strict';
const PAGE_SIZE = 10;
const hash = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const uuid = value => typeof value === 'string' && /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(value);
const date = value => value instanceof Date && Number.isFinite(value.getTime());
// Metadata only. A sending row may still be in flight; the report cannot infer
// SMTP delivery or authorize a retry from elapsed time. No command/mail read.
async function syncRuleEmailReport(attempts, { search, page, status }) {
  if (typeof search !== 'string' || search.length > 128 || !Number.isSafeInteger(page) || page < 0 ||
      !['all', 'unconfirmed', 'sent'].includes(status)) throw new Error('sync-rule-email-report-invalid');
  const query = {};
  if (status !== 'all') query.state = status === 'unconfirmed' ? 'sending' : 'sent';
  if (search.trim()) {
    const pattern = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = ['_id', 'invocationId', 'attemptId'].map(key => ({ [key]: pattern }));
  }
  const total = await attempts.countDocuments(query);
  page = Math.min(page, Math.max(0, Math.ceil(total / PAGE_SIZE) - 1));
  const saved = await attempts.find(query, { projection: { _id: 1, version: 1, commandHash: 1,
    invocationId: 1, attemptId: 1, state: 1, startedAt: 1, finishedAt: 1 } })
    .sort({ startedAt: -1, _id: 1 }).skip(page * PAGE_SIZE).limit(PAGE_SIZE).toArray();
  const rows = saved.map(row => {
    const valid = hash(row._id) && hash(row.commandHash) && hash(row.invocationId) && uuid(row.attemptId) &&
      row.version === 1 && date(row.startedAt) && ['sending', 'sent'].includes(row.state) &&
      (row.state === 'sent' ? date(row.finishedAt) : row.finishedAt === undefined);
    return { commandId: hash(row._id) ? row._id : null, invocationId: hash(row.invocationId) ? row.invocationId : null,
      attemptId: uuid(row.attemptId) ? row.attemptId : null,
      status: valid ? (row.state === 'sent' ? 'sent' : 'unconfirmed') : 'invalid',
      startedAt: date(row.startedAt) ? row.startedAt : null, finishedAt: date(row.finishedAt) ? row.finishedAt : null };
  });
  return { total, page, pageSize: PAGE_SIZE, rows };
}
module.exports = { syncRuleEmailReport };
