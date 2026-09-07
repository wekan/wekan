import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { runOnServer } from './runOnServer';
import {
  BOARD_EXPORT_FIELD_KEYS,
  parseExportFields,
  parseExportScope,
} from './lib/exportFields';
import { pruneImportDocument } from './lib/importParts';
const { safeEntryPath } = require('./lib/backupPaths');

runOnServer(function () {
  const fs = Npm.require('fs');
  const os = Npm.require('os');
  const path = Npm.require('path');
  const { WebApp } = require('meteor/webapp');
  const { safeRoute } = require('/server/apiMiddleware');
  const { Authentication } = require('/server/authentication');
  const { assertImportEnabled } = require('./lib/importExportSecurity');

  // A .zip import that does not hold the archive in memory (#1173).
  //
  // The browser used to unpack an archive and send its attachments as base64
  // over DDP, which is fine for a card and wrong for a board: a 2 GB archive
  // became 2.7 GB of base64 in one message. This route takes the file itself.
  //
  // Nothing is ever whole in memory on the way in:
  //   * the request body is streamed to a temp file as it arrives;
  //   * `unzipper.Open.file` reads the archive's central directory, so entries
  //     are opened on demand rather than inflated together - the same thing the
  //     backup restore does (server/methods/backup.js);
  //   * each attachment is piped from the archive into the attachments
  //     collection by `addAttachmentFromStream`, which writes it to a temp file
  //     and hands the PATH to Meteor-Files rather than a Buffer.
  //
  // Where the files END UP is not decided here: `addFile` fires the collection's
  // onAfterUpload, which validates the file and moves it to the default storage
  // configured in the Admin Panel, exactly as an ordinary upload does.
  //
  // ZipBleed: an entry's name is data, so `attachments/` is matched literally
  // and the name is never used as a path - a temp name is generated instead, so
  // an entry called `../../etc/cron.d/x` can only ever be an attachment called
  // that.
  const MAX_ZIP_BYTES = (() => {
    const configured = parseInt(process.env.WEKAN_IMPORT_ZIP_MAX_BYTES, 10);
    return Number.isFinite(configured) && configured > 0 ? configured : 5 * 1024 * 1024 * 1024;
  })();

  const receiveToTempFile = req => new Promise((resolve, reject) => {
    // The name is ours, not the archive's - but it is still built with
    // safeEntryPath, which resolves the result and requires it to be BENEATH the
    // temp directory. A generated name that cannot escape is worth as much as
    // the check that proves it, and tests/fixedVulnerabilityClasses.test.cjs
    // asks every file that reads an archive to show one (ZipBleed).
    const tempPath = safeEntryPath(os.tmpdir(),
      [`wekan-import-${Date.now()}-${Math.random().toString(36).slice(2)}.zip`]);
    if (!tempPath) {
      reject(new Error('import-temp-path'));
      return;
    }
    const out = fs.createWriteStream(tempPath);
    let received = 0;
    let aborted = false;

    const fail = error => {
      if (aborted) return;
      aborted = true;
      try { req.destroy(); } catch (e) { /* already gone */ }
      try { out.destroy(); } catch (e) { /* already gone */ }
      fs.promises.unlink(tempPath).catch(() => {});
      reject(error);
    };

    req.on('data', chunk => {
      received += chunk.length;
      // A cap that is checked as it arrives, not after: the point of streaming
      // is that an oversized upload never lands.
      if (received > MAX_ZIP_BYTES) fail(new Error('import-zip-too-large'));
    });
    req.on('error', fail);
    out.on('error', fail);
    out.on('finish', () => (aborted ? undefined : resolve({ tempPath, received })));
    req.pipe(out);
  });

  /**
   * @operation importZip
   * @tag Boards
   * @summary Import a .zip export - the document and its attachment files.
   * @description POST the .zip as the request body. Takes the same `fields`,
   * `swimlaneId`, `listId`, `cardId` and `checklistId` parameters as the
   * exports: with one of those ids it imports beside that thing, without one it
   * imports the whole document into the board named by `boardId`.
   * @param {string} boardId the board to import into
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.post('/api/import/zip', safeRoute(async function (req, res) {
    const answer = (code, data) => {
      res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8' });
      res.end(JSON.stringify(data));
    };

    let user = null;
    const loginToken = req.query && req.query.authToken;
    if (loginToken) {
      if (String(loginToken).length > 10000) {
        answer(400, { error: 'Bad request' });
        return;
      }
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      if (!user) {
        answer(401, { error: 'Invalid token' });
        return;
      }
    } else {
      try {
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        answer(error.statusCode || 403, { error: 'Unauthorized' });
        return;
      }
      user = await ReactiveCache.getUser({ _id: req.userId });
    }

    const boardId = req.query && req.query.boardId;
    const board = boardId ? await ReactiveCache.getBoard(boardId) : null;
    if (!board) {
      answer(404, { error: 'Not found' });
      return;
    }
    // Importing WRITES, so this is "may you change it", not "may you see it" -
    // the same check the DDP import method makes.
    if (!board.isVisibleBy(user) || !(board.members || [])
      .some(member => member.userId === user._id && member.isActive)) {
      answer(403, { error: 'Forbidden' });
      return;
    }

    try {
      await assertImportEnabled();
    } catch (error) {
      answer(403, { error: 'Import is disabled' });
      return;
    }

    let tempPath = null;
    try {
      const received = await receiveToTempFile(req);
      tempPath = received.tempPath;

      const unzipper = require('unzipper');
      const directory = await unzipper.Open.file(tempPath);
      const documentEntry = directory.files.find(entry =>
        entry.type === 'File' && /(^|\/)wekan\.json$/.test(entry.path));
      if (!documentEntry) {
        answer(400, { error: 'import-not-wekan-export' });
        return;
      }

      const parsedDoc = JSON.parse((await documentEntry.buffer()).toString('utf8'));
      const doc = require('/server/lib/secureTransfer').secureTransfer(parsedDoc, {
        direction: 'import', source: 'import:zip', userId: user._id,
        ip: req.connection && req.connection.remoteAddress,
      });
      if (doc._format && doc._format !== 'wekan-board-1.0.0') {
        answer(400, { error: 'invalid-format' });
        return;
      }

      const fields = parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS);
      pruneImportDocument(doc, fields);

      // attachmentId -> the entry holding its bytes. The name is
      // `attachments/<id>-<name>`, and only the id before the first dash is
      // read: the rest is a filename from another machine and is not used as
      // one here.
      const entriesById = new Map();
      for (const entry of directory.files) {
        if (entry.type !== 'File') continue;
        const match = /(?:^|\/)attachments\/([^/]+)$/.exec(entry.path);
        if (!match) continue;
        const base = match[1];
        const dash = base.indexOf('-');
        entriesById.set(dash === -1 ? base : base.slice(0, dash), entry);
      }

      // Each attachment as a fresh read stream, opened only when the importer
      // asks for it - which is what keeps one attachment in flight at a time.
      const attachmentStream = attachment => {
        const entry = entriesById.get(attachment && attachment._id);
        return entry ? entry.stream() : null;
      };

      const scope = parseExportScope(req.query);
      const { ScopedImporter } = require('./server/scopedImporter');
      const importer = new ScopedImporter(
        { boardId, ...scope },
        doc,
        { userId: user._id, fields, attachmentStream },
      );
      const counts = await importer.run();
      answer(200, { ok: true, counts });
    } catch (error) {
      const message = error && error.message === 'import-zip-too-large'
        ? 'import-zip-too-large'
        : 'import-failed';
      console.error('importZip failed', error);
      answer(message === 'import-zip-too-large' ? 413 : 500, { error: message });
    } finally {
      if (tempPath) fs.promises.unlink(tempPath).catch(() => {});
    }
  }));
});
