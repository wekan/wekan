import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import RecoveryEvents from '/models/recoveryEvents';
import { recoveryReportQuery } from '/models/lib/recoveryReportQuery';

export const RECOVERY_REPORT_STATUSES = Object.freeze([
  'all', 'done', 'failed', 'deleted',
]);

async function requireAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) throw new Meteor.Error('not-authorized', 'Admin only');
}

function boundedOptions(options) {
  const search = String(options.search || '').trim().slice(0, 500);
  const status = RECOVERY_REPORT_STATUSES.includes(options.status)
    ? options.status : 'all';
  const limit = Math.min(Math.max(options.limit || 10, 1), 200);
  const skip = Math.min(Math.max(options.skip || 0, 0), 1000000);
  return { search, status, limit, skip };
}

// The Meteor publication and Legacy HTML4 page deliberately share this exact
// site-admin boundary, selector and bounded database window.
export async function recoveryReportForAdmin(userId, options = {}) {
  check(options, {
    search: Match.Optional(String), status: Match.Optional(String),
    limit: Match.Optional(Number), skip: Match.Optional(Number),
  });
  await requireAdmin(userId);
  const bounded = boundedOptions(options);
  const selector = recoveryReportQuery(bounded.search, bounded.status);
  const cursor = RecoveryEvents.find(selector, {
    sort: { createdAt: -1 }, limit: bounded.limit, skip: bounded.skip,
  });
  const rows = typeof cursor.fetchAsync === 'function'
    ? await cursor.fetchAsync() : cursor.fetch();
  return { rows: rows || [], ...bounded };
}

export async function recoveryReportCountForAdmin(userId, search = '', status = 'all') {
  await requireAdmin(userId);
  const bounded = boundedOptions({ search, status });
  const cursor = RecoveryEvents.find(
    recoveryReportQuery(bounded.search, bounded.status),
  );
  return typeof cursor.countAsync === 'function'
    ? await cursor.countAsync() : cursor.count();
}
