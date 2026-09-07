import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { ReactiveCache } from '/imports/reactiveCache';
import { impersonationQuery } from '/models/lib/impersonationReportQuery';

async function requireAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1 },
  });
  if (!user?.isAdmin) throw new Meteor.Error('not-authorized', 'Admin only');
}

// One bounded source of truth for both the reactive HTML5 report and the
// no-cookie HTML4 report. Keeping the user lookup here also makes deleted users
// degrade to their recorded id instead of making either renderer fail.
export async function impersonationReportForAdmin(userId, options = {}) {
  check(options, {
    search: Match.Optional(String),
    limit: Match.Optional(Number),
    skip: Match.Optional(Number),
  });
  await requireAdmin(userId);
  const search = String(options.search || '').trim().slice(0, 500);
  const limit = Math.min(Math.max(options.limit || 10, 1), 200);
  const skip = Math.min(Math.max(options.skip || 0, 0), 1000000);
  const selector = impersonationQuery(search);
  const countCursor = await ReactiveCache.getImpersonatedUsers(selector, {}, true);
  const total = typeof countCursor.countAsync === 'function'
    ? await countCursor.countAsync() : countCursor.count();
  const rows = await ReactiveCache.getImpersonatedUsers(selector, {
    sort: { createdAt: -1 }, limit, skip,
  }, false);
  const userIds = [...new Set(rows.flatMap(row => [row.adminId, row.userId]).filter(Boolean))];
  const users = userIds.length ? await ReactiveCache.getUsers(
    { _id: { $in: userIds } },
    { fields: {
      username: 1, 'profile.fullname': 1, 'profile.initials': 1,
      'profile.avatarUrl': 1, isAdmin: 1, emails: 1, createdAt: 1,
      loginDisabled: 1, authenticationMethod: 1, importUsernames: 1,
      orgs: 1, teams: 1,
    } }, false,
  ) : [];
  return { total, rows, users, search, limit, skip };
}

export async function impersonationReportCountForAdmin(userId, search = '') {
  await requireAdmin(userId);
  const boundedSearch = String(search || '').trim().slice(0, 500);
  const cursor = await ReactiveCache.getImpersonatedUsers(
    impersonationQuery(boundedSearch), {}, true,
  );
  return typeof cursor.countAsync === 'function'
    ? await cursor.countAsync() : cursor.count();
}
