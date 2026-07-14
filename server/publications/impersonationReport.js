import { ReactiveCache } from '/imports/reactiveCache';

// Admin Panel / Reports / Impersonation. Impersonation events are already written
// to the impersonatedUsers collection whenever an admin impersonates a user (e.g.
// to export a private board). This report lists them newest-first, with the same
// server-side search + pagination the other admin reports use.

// Build the Mongo query for the impersonation report: match the search term (if
// any) against the admin/user/board ids and the reason, case-insensitively.
function impersonationQuery(searchTerm) {
  const query = {};
  if (searchTerm) {
    const rx = new RegExp(searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.$or = [
      { adminId: rx },
      { userId: rx },
      { boardId: rx },
      { attachmentId: rx },
      { reason: rx },
    ];
  }
  return query;
}

Meteor.publish('impersonationReport', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
    return this.ready();
  }

  // Newest first, one page at a time (server-side limit/skip).
  const rows = await ReactiveCache.getImpersonatedUsers(
    impersonationQuery(searchTerm),
    { sort: { createdAt: -1 }, limit, skip: skip || 0 },
    false,
  );

  // Also publish the referenced admin/impersonated user docs (same fields the
  // People panel exposes) so the report can show usernames and open the same
  // "Edit user" popup when a username is clicked.
  const userIds = [];
  rows.forEach(r => {
    if (r.adminId) userIds.push(r.adminId);
    if (r.userId) userIds.push(r.userId);
  });

  return [
    await ReactiveCache.getImpersonatedUsers(
      impersonationQuery(searchTerm),
      { sort: { createdAt: -1 }, limit, skip: skip || 0 },
      true,
    ),
    await ReactiveCache.getUsers(
      { _id: { $in: [...new Set(userIds)] } },
      {
        fields: {
          username: 1,
          'profile.fullname': 1,
          'profile.initials': 1,
          'profile.avatarUrl': 1,
          isAdmin: 1,
          emails: 1,
          createdAt: 1,
          loginDisabled: 1,
          authenticationMethod: 1,
          importUsernames: 1,
          orgs: 1,
          teams: 1,
        },
      },
      true,
    ),
  ];
});

Meteor.methods({
  async getImpersonationReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    if (!this.userId || !(await ReactiveCache.getUser(this.userId)).isAdmin) {
      throw new Meteor.Error('not-authorized');
    }
    const cursor = await ReactiveCache.getImpersonatedUsers(
      impersonationQuery(searchTerm),
      {},
      true,
    );
    return typeof cursor.countAsync === 'function'
      ? await cursor.countAsync()
      : cursor.count();
  },
});
