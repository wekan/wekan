// CSV exports for access reviews and incidents (WP-10, the datasets in
// models/lib/adminCsvExport.js):
//
//   GET /api/admin/export/<dataset>.csv?authToken=…
//
// A site administrator only; every download, refused ones included, is in
// Admin Panel / People / Audit log as exportAdminCsv. The rows are streamed
// from a cursor - the whole list, not the page on screen - up to MAX_ROWS.
import { WebApp } from 'meteor/webapp';
import { MongoInternals } from 'meteor/mongo';
import { recordAdminRouteAction } from '/server/lib/adminRouteAudit';
import { attachmentDisposition } from '/models/lib/exportFilename';

const { sendJsonResult, safeRoute } = require('/server/apiMiddleware');
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
const { isSiteAdmin } = require('/models/lib/tenantAdmin');
const { memberRoleOf } = require('/models/lib/boardRoleCapabilities');
const { MAX_ROWS, dataset, headerLine, rowLine, memberRows, filename } = require('/models/lib/adminCsvExport');

const collection = name => MongoInternals.defaultRemoteCollectionDriver().mongo.db.collection(name);

// Admin Panel can turn all export off (CrossBoardExportBleed); these lists
// are exports too, so the switch applies to them as well.
WebApp.handlers.get('/api/admin/export/:file', safeRoute(async function (req, res) {
  if (await require('/models/lib/importExportSecurity').refuseDisabledExport(res)) return;
  const match = /^([a-z-]+)\.csv$/.exec(String(req.params.file || ''));
  const spec = match ? dataset(match[1]) : null;
  if (!spec) {
    sendJsonResult(res, { code: 404, data: { error: 'not-found' } });
    return;
  }
  const token = req.query && req.query.authToken;
  const user = token && String(token).length <= 10000
    ? await require('/server/lib/activeUser').activeUserByToken(token, 'export', req) : null;
  const ip = resolveClientKey({ headers: req.headers, socketAddress: req.socket && req.socket.remoteAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT }) || '';
  if (!user || !isSiteAdmin(user)) {
    if (user) await recordAdminRouteAction(user, 'exportAdminCsv', [match[1]], ip, new Error('not-authorized'));
    sendJsonResult(res, { code: user ? 403 : 401, data: { error: 'not-authorized' } });
    return;
  }
  await recordAdminRouteAction(user, 'exportAdminCsv', [match[1]], ip);

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', attachmentDisposition(filename(match[1])));
  res.setHeader('Cache-Control', 'no-store');
  // A byte-order mark, so a spreadsheet reads the file as UTF-8.
  res.write(`\uFEFF${headerLine(spec)}`);
  const cursor = collection(spec.collection)
    .find(spec.query || {}, { projection: spec.fields, sort: spec.sort })
    .limit(MAX_ROWS);
  let usernames = null;
  if (spec.perMember) {
    usernames = new Map();
    for await (const u of collection('users').find({}, { projection: { username: 1 } })) usernames.set(u._id, u.username);
  }
  for await (const doc of cursor) {
    const rows = spec.perMember ? memberRows(doc, usernames, memberRoleOf) : [doc];
    for (const row of rows) {
      if (!res.write(rowLine(spec, row))) await new Promise(resolve => res.once('drain', resolve));
    }
  }
  res.end();
}));
