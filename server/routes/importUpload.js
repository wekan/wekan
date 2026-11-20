// POST /api/import/upload/:source - the Import page's chosen file, streamed to
// the local disk a part at a time (server/lib/importUpload.js) instead of
// being sent whole, as text or base64, through the importBoard method. The
// answer is { uploadId, size }; importBoard then reads the file by that id
// (data.uploadId). The body is the file's bytes (application/octet-stream),
// which the JSON body parser leaves alone.
import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { getUserIdFromRequest } from '/server/lib/requestUser';
import { assertImportEnabled } from '/models/lib/importExportSecurity';
import { importSource } from '/models/lib/importSources';

const { receiveUpload, sweepUploads } = require('/server/lib/importUpload');
const { importLimitBytes } = require('/server/lib/importDiskSpace');

Meteor.startup(() => {
  // Expired uploads, and any a stopped server left, go once an hour.
  Meteor.setInterval(() => { sweepUploads().catch(() => {}); }, 60 * 60 * 1000);
  sweepUploads().catch(() => {});

  WebApp.handlers.use('/api/import/upload', async (req, res) => {
    const send = (code, body) => {
      if (res.headersSent) return;
      res.writeHead(code, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(body));
    };
    if (req.method !== 'POST') return send(405, { error: 'method-not-allowed' });
    const source = String(req.url || '').replace(/^\/+/, '').split(/[/?#]/)[0];
    if (!importSource(source)) return send(404, { error: 'invalid-import-source' });
    const userId = await getUserIdFromRequest(req);
    if (!userId) return send(401, { error: 'error-notAuthorized' });
    try { await assertImportEnabled(); } catch (error) { return send(403, { error: error.error || 'import-disabled' }); }
    const Settings = require('/models/settings').default;
    const limit = importLimitBytes(await Settings.findOneAsync({}, { fields: { importMaxMegabytes: 1 } }));
    try {
      const { uploadId, size } = await receiveUpload(req, { userId, source, limit });
      return send(200, { uploadId, size });
    } catch (error) {
      const code = error && error.code;
      const status = code === 'import-too-large' ? 413 : code === 'import-disk-full' ? 507 : 400;
      return send(status, { error: code || 'import-upload-failed', reason: error && error.message });
    }
  });
});
