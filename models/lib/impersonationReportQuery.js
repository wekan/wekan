// Pure, Meteor-free helper for the Admin Panel / Reports / Impersonation report.
// Builds the Mongo selector that matches a search term (if any) against the
// admin/user/board/attachment ids and the reason, case-insensitively. Kept in its
// own module so it can be unit-tested without importing the publication (which
// would re-register the 'impersonationReport' publish and throw).
export function impersonationQuery(searchTerm) {
  const query = {};
  if (searchTerm) {
    // Escape regex metacharacters so a search term is matched literally.
    const rx = new RegExp(String(searchTerm).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
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
