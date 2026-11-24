// An administrator's action taken through an HTTP route rather than a Meteor
// method - the personal-data export of another account (WP-5) - recorded in
// the same Admin Panel / People / Audit log as the audited methods
// (server/adminAudit.js), with the address the request came from.

const { auditArgs } = require('/models/lib/adminAudit');

export function recordAdminRouteAction(actor, method, args, ip, error) {
  const failed = e => console.error('[admin-audit] could not record', method, e && e.message);
  try {
    const doc = {
      at: new Date(),
      actorId: actor._id,
      actorUsername: actor.username || '',
      method,
      args: auditArgs(method, args),
      ok: !error,
      error: error ? String(error.message || error).slice(0, 200) : undefined,
      ip: ip || '',
    };
    // AUDIT_LOG_STDOUT=json (WP-11): the same row, as stored, on stdout.
    require('/models/lib/auditStdout').writeStdout('audit', doc);
    // Hash-chained like every audit row (models/lib/auditChain.js, P3).
    return require('/server/lib/auditChainAppend').appendAuditRow(doc).catch(failed);
  } catch (e) {
    // The audit trail must never change what the route did or answered.
    failed(e);
    return Promise.resolve();
  }
}
