import {
  impersonationReportCountForAdmin,
  impersonationReportForAdmin,
} from '/server/lib/impersonationReport';

// Admin Panel / Reports / Impersonation. Impersonation events are already written
// to the impersonatedUsers collection whenever an admin impersonates a user (e.g.
// to export a private board). This report lists them newest-first, with the same
// server-side search + pagination the other admin reports use. The search-selector
// builder lives in /models/lib/impersonationReportQuery so it can be unit-tested.

Meteor.publish('impersonationReport', async function(searchTerm = '', limit, skip = 0) {
  check(searchTerm, Match.OneOf(String, null, undefined));
  check(limit, Number);
  check(skip, Match.OneOf(Number, null, undefined));
  if (!this.userId) return this.ready();

  // Newest first, one page at a time (server-side limit/skip). Publish the page
  // MANUALLY (fetch + this.added + this.ready): a returned sorted+limited cursor
  // triggers a LIMITED live observe that hangs on FerretDB's OpLog, leaving the
  // report stuck on the loading spinner (same as attachmentsList). The report re-
  // subscribes on every page/search change, so it needs no live cursor.
  let report;
  try {
    report = await impersonationReportForAdmin(this.userId, {
      search: searchTerm || '', limit, skip: skip || 0,
    });
  } catch (error) {
    if (error?.error === 'not-authorized') return this.ready();
    throw error;
  }
  const { rows, users } = report;

  // Also publish the referenced admin/impersonated user docs (same fields the
  // People panel exposes) so the report can show usernames and open the same
  // "Edit user" popup when a username is clicked.
  for (const doc of rows) { const { _id, ...fields } = doc; this.added('impersonatedUsers', _id, fields); }
  for (const doc of users) { const { _id, ...fields } = doc; this.added('users', _id, fields); }
  this.ready();
});

Meteor.methods({
  async getImpersonationReportCount(searchTerm = '') {
    check(searchTerm, Match.OneOf(String, null, undefined));
    return impersonationReportCountForAdmin(this.userId, searchTerm || '');
  },
});
