// "Download my data" (WP-5, docs/Compliance/README.md row 1.1):
//
//   GET /api/user/export?authToken=…            the signed-in person's own data
//   GET /api/user/export?authToken=…&userId=…   an administrator, for another
//                                                account - recorded in the Audit log
//
// A ZIP of JSON: manifest.json, user.json and data/<collection>.json. The
// right of access cannot be switched off, so the board-export switch does not
// apply to it: it holds the person's own data, not board content.
import { WebApp } from 'meteor/webapp';
import { ReactiveCache } from '/imports/reactiveCache';
import { buildPersonalDataExport } from '/server/lib/personalDataExport';
import { recordAdminRouteAction } from '/server/lib/adminRouteAudit';
import { attachmentDisposition } from '/models/lib/exportFilename';

const { sendJsonResult, safeRoute } = require('/server/apiMiddleware');
const { resolveClientKey } = require('/server/lib/loginAttemptThrottle');
const { decideExportTarget } = require('/models/lib/personalDataExportAccess');

WebApp.handlers.get('/api/user/export', safeRoute(async function (req, res) {
  const token = req.query && req.query.authToken;
  const requester = token && String(token).length <= 10000
    ? await require('/server/lib/activeUser').activeUserByToken(token, 'export', req) : null;
  const wanted = req.query && typeof req.query.userId === 'string' ? req.query.userId : '';
  const decision = decideExportTarget(requester, wanted);
  if (!decision.allowed) {
    sendJsonResult(res, { code: decision.code, data: { error: decision.error } });
    return;
  }
  const target = decision.self ? requester : await ReactiveCache.getUser(decision.userId);
  const ip = resolveClientKey({ headers: req.headers, socketAddress: req.socket && req.socket.remoteAddress,
    forwardedCount: process.env.HTTP_FORWARDED_COUNT }) || '';
  if (!target) {
    if (!decision.self) await recordAdminRouteAction(requester, 'exportUserPersonalData', [decision.userId], ip, new Error('user-not-found'));
    sendJsonResult(res, { code: 404, data: { error: 'user-not-found' } });
    return;
  }
  const files = await buildPersonalDataExport(target);
  if (!decision.self) await recordAdminRouteAction(requester, 'exportUserPersonalData', [target._id], ip);
  const { zipSync, strToU8 } = require('fflate');
  const zip = zipSync(Object.fromEntries(Object.entries(files)
    .map(([name, value]) => [name, strToU8(JSON.stringify(value, null, 2))])), { level: 6 });
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', attachmentDisposition(`wekan-personal-data-${target.username || target._id}.zip`));
  res.setHeader('Cache-Control', 'no-store');
  res.end(Buffer.from(zip));
}));
