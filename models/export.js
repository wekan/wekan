import { ReactiveCache } from '/imports/reactiveCache';
import { Exporter } from './exporter';
import { buildExternalExport, EXTERNAL_EXPORT_FORMATS } from './lib/externalExporters';
import {
  BOARD_EXPORT_FIELD_KEYS,
  parseExportFields,
  parseExportScope,
} from './lib/exportFields';
import { Meteor } from 'meteor/meteor';
import ImpersonatedUsers from '/models/impersonatedUsers';

if (Meteor.isServer) {
  const { WebApp } = require('meteor/webapp');
  const { sendJsonResult, safeRoute } = require('/server/apiMiddleware');
  const { Authentication } = require('/server/authentication');

  // Record an export authorization denial to the Admin Panel security log
  // (best-effort, never breaks the response). See docs/Security/Remediation/WeKan.md.
  function logExportDenied() {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.export', action: 'blocked', source: 'export',
        detail: 'export denied (no board visibility)',
      });
    } catch (e) { /* logging must never break the response */ }
  }

  // Stream a full board export straight to the response (a card/attachment at a
  // time) instead of buffering the whole board object — see Exporter.buildStream.
  async function streamJsonBoardExport(res, exporter) {
    res.statusCode = 200;
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Content-Type', 'application/json');
    try {
      await exporter.buildStream(res);
      res.end();
    } catch (error) {
      if (process.env.DEBUG === 'true') console.error('board export stream failed:', error);
      // If we have not flushed any body yet the headers are still mutable, so we
      // can return a clean JSON error; otherwise the partial body is already on
      // the wire and all we can do is end it.
      if (!res.headersSent) sendJsonResult(res, { code: 500, data: { error: 'Export failed' } });
      else try { res.end(); } catch (_) {}
    }
  }

  // Build a Kanboard-style export object from a WeKan board: lists -> columns,
  // swimlanes -> swimlanes, cards -> tasks (this is the inverse of the Kanboard
  // importer, so a board round-trips through this format).
  async function buildKanboardExport(boardId) {
    const board = await ReactiveCache.getBoard(boardId);
    const lists = await ReactiveCache.getLists({ boardId, archived: false }, { sort: { sort: 1 } });
    const swimlanes = await ReactiveCache.getSwimlanes({ boardId, archived: false }, { sort: { sort: 1 } });
    const cards = await ReactiveCache.getCards({ boardId, archived: false }, { sort: { sort: 1 } });
    const listById = {};
    lists.forEach(l => { listById[l._id] = l.title; });
    const swById = {};
    swimlanes.forEach(s => { swById[s._id] = s.title; });
    const labelById = {};
    (board.labels || []).forEach(l => { labelById[l._id] = l.name; });
    return {
      board: { name: board.title },
      columns: lists.map(l => ({ title: l.title })),
      swimlanes: swimlanes.map(s => ({ name: s.title })),
      tasks: cards.map(c => ({
        title: c.title,
        description: c.description || '',
        column_name: listById[c.listId] || '',
        swimlane_name: swById[c.swimlaneId] || 'Default',
        date_due: c.dueAt ? new Date(c.dueAt).toISOString() : undefined,
        tags: (c.labelIds || []).map(id => labelById[id]).filter(Boolean),
      })),
    };
  }

  // todo XXX once we have a real API in place, move that route there
  // todo XXX also  share the route definition between the client and the server
  // so that we could use something like
  // `ApiRoutes.path('boards/export', boardId)``
  // on the client instead of copy/pasting the route path manually between the
  // client and the server.
  /**
   * @operation exportJson
   * @tag Boards
   *
   * @summary This route is used to export the board to a json file format.
   *
   * @description If user is already logged-in, pass loginToken as param
   * "authToken": '/api/boards/:boardId/export?authToken=:token'
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/export', safeRoute(async function (req, res) {
    const boardId = req.params.boardId;
    let user = null;
    let impersonateDone = false;
    let adminId = null;

    // First check if board exists and is public to avoid unnecessary authentication
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      sendJsonResult(res, { code: 404, data: { error: 'Not found' } });
      return;
    }

    // #5870: ?attachments=false exports the board without the base64 attachment
    // file data, so very large boards can be exported without overflowing the
    // JSON serializer. Default (omitted/any other value) keeps the full export.
    // #1173: the same two the PDF, Excel and .zip exports read - WHICH cards
    // (a swimlane, a list, a card, a checklist, or the whole board) and WHICH
    // PARTS of them, from the one selection popup. Parsed by the shared reader
    // so a menu's `listId` means the same thing at every export route.
    const exportOptions = {
      excludeAttachments: req.query.attachments === 'false',
      scope: parseExportScope(req.query),
      fields: parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS),
    };

    // If board is public, skip expensive authentication operations
    if (board.isPublic()) {
      // Public boards don't require authentication - skip hash operations
      const exporter = new Exporter(boardId, undefined, exportOptions);
      await streamJsonBoardExport(res, exporter);
      return;
    }

    // Only perform expensive authentication for private boards
    const loginToken = req.query.authToken;
    if (loginToken) {
      // Validate token length to prevent resource abuse
      if (loginToken.length > 10000) {
        if (process.env.DEBUG === 'true') {
          console.warn('Suspiciously long auth token received, rejecting to prevent resource abuse');
        }
        sendJsonResult(res, { code: 400, data: { error: 'Bad request' } });
        return;
      }

      const hashToken = Accounts._hashLoginToken(loginToken);
      user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      if (!user) {
        // GHSA-3gcg-g6rf-w2rx: an authToken that matches no login token makes the
        // lookup answer `undefined`, and `user._id` on that threw a TypeError out of
        // an async route handler - an unhandled rejection, which this app turns into
        // a process crash (see the note in server/ldapGroupSync.js). One crafted GET
        // took the whole server down. The same guard already existed in
        // models/exportPDF.js and models/exportExcelCard.js; these handlers were
        // missed.
        sendJsonResult(res, { code: 401, data: { error: 'Invalid token' } });
        return;
      }
      adminId = user._id.toString();
      impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId: adminId });
    } else if (!Meteor.settings.public.sandstorm) {
      try {
        // Any logged-in user may request an export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        sendJsonResult(res, { code: error.statusCode || 403, data: { error: (error && error.reason) || 'Forbidden' } });
        return;
      }
      user = await ReactiveCache.getUser({ _id: req.userId });
    }

    // Anonymized user placeholders ("user1"/"käyttäjä1") follow the exporting
    // user's language.
    exportOptions.userLanguage = (user && user.profile && user.profile.language) || 'en';
    const exporter = new Exporter(boardId, undefined, exportOptions);
    if (await exporter.canExport(user)) {
      if (impersonateDone && adminId) {
        await ImpersonatedUsers.insertAsync({
          adminId: adminId,
          boardId: boardId,
          reason: 'exportJSON',
        });
      }

      await streamJsonBoardExport(res, exporter);
    } else {
      // we could send an explicit error message, but on the other hand the only
      // way to get there is by hacking the UI so let's keep it raw.
      logExportDenied();
      sendJsonResult(res, { code: 403, data: { error: 'Forbidden' } });
    }
  }));

  /**
   * @operation exportZip
   * @tag Boards
   * @summary Export as a .zip - the JSON document, and the attachments as files.
   * @description The same export the JSON route produces, with the attachments
   * beside it as the files they are instead of base64 inside the document, so a
   * board whose attachments are too large for one JSON string still exports.
   * Takes the same `fields`, `swimlaneId`, `listId`, `cardId` and `checklistId`
   * parameters as every other export.
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/exportZip', safeRoute(async function (req, res) {
    const boardId = req.params.boardId;
    let user = null;

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      sendJsonResult(res, { code: 404, data: { error: 'Not found' } });
      return;
    }

    const options = {
      scope: parseExportScope(req.query),
      fields: parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS),
    };

    if (!board.isPublic()) {
      const loginToken = req.query.authToken;
      if (loginToken) {
        if (loginToken.length > 10000) {
          sendJsonResult(res, { code: 400, data: { error: 'Bad request' } });
          return;
        }
        const hashToken = Accounts._hashLoginToken(loginToken);
        user = await ReactiveCache.getUser({
          'services.resume.loginTokens.hashedToken': hashToken,
        });
        if (!user) {
          sendJsonResult(res, { code: 401, data: { error: 'Invalid token' } });
          return;
        }
      } else if (!Meteor.settings.public.sandstorm) {
        try {
          Authentication.checkLoggedIn(req.userId);
        } catch (error) {
          sendJsonResult(res, {
            code: error.statusCode || 403,
            data: { error: (error && error.reason) || 'Forbidden' },
          });
          return;
        }
        user = await ReactiveCache.getUser({ _id: req.userId });
      }
    }

    options.userLanguage = (user && user.profile && user.profile.language) || 'en';
    const { ExporterZip } = require('./server/ExporterZip');
    const exporter = new ExporterZip(boardId, options);
    if (await exporter.canExport(user)) {
      const name = String(board.title || 'export-board')
        .replace(/[^a-z0-9._-]+/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
        .slice(0, 80) || 'export-board';
      // AWAITED: an un-awaited build(res) is #6591 - a rejection that goes
      // nowhere and a response that is never ended.
      await exporter.build(res, `${name}.zip`);
    } else {
      logExportDenied();
      sendJsonResult(res, { code: 403, data: { error: 'Forbidden' } });
    }
  }));

  /**
   * @operation exportKanboard
   * @tag Boards
   * @summary Export the board as a Kanboard-style JSON (columns + tasks).
   * @description Pass the loginToken as the `authToken` query param for private
   * boards: `/api/boards/:boardId/export/kanboard?authToken=:token`.
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/export/kanboard', safeRoute(async function (req, res) {
    const boardId = req.params.boardId;
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      sendJsonResult(res, { code: 404, data: { error: 'Not found' } });
      return;
    }
    if (board.isPublic()) {
      sendJsonResult(res, { code: 200, data: await buildKanboardExport(boardId) });
      return;
    }
    let user = null;
    const loginToken = req.query.authToken;
    if (loginToken) {
      if (loginToken.length > 10000) {
        sendJsonResult(res, { code: 400, data: { error: 'Bad request' } });
        return;
      }
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      if (!user) {
        // GHSA-3gcg-g6rf-w2rx: this handler does not dereference the user - it hands
        // it to canExport(), which answers false - so an unknown token got a 403
        // rather than a crash. It is guarded all the same: one rule for every token
        // lookup is what keeps the next handler from being the one that is missed,
        // and "your token is invalid" is the honest answer to an invalid token.
        sendJsonResult(res, { code: 401, data: { error: 'Invalid token' } });
        return;
      }
    } else if (!Meteor.settings.public.sandstorm) {
      try {
        // Any logged-in user may request an export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        sendJsonResult(res, { code: error.statusCode || 403, data: { error: (error && error.reason) || 'Forbidden' } });
        return;
      }
      user = await ReactiveCache.getUser({ _id: req.userId });
    }
    const exporter = new Exporter(boardId);
    if (await exporter.canExport(user)) {
      sendJsonResult(res, { code: 200, data: await buildKanboardExport(boardId) });
    } else {
      logExportDenied();
      sendJsonResult(res, { code: 403, data: { error: 'Forbidden' } });
    }
  }));

  // Generalized export to other tools: NextCloud Deck, OpenProject, GitHub,
  // GitLab, Gitea, Forgejo. One shared auth handler, one route per format.
  async function serveExternalExport(req, res, format) {
    const boardId = req.params.boardId;
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      sendJsonResult(res, { code: 404, data: { error: 'Not found' } });
      return;
    }
    const respond = async () =>
      sendJsonResult(res, { code: 200, data: await buildExternalExport(boardId, format,
        parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS)) });
    if (board.isPublic()) {
      await respond();
      return;
    }
    let user = null;
    const loginToken = req.query.authToken;
    if (loginToken) {
      if (loginToken.length > 10000) {
        sendJsonResult(res, { code: 400, data: { error: 'Bad request' } });
        return;
      }
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      if (!user) {
        // GHSA-3gcg-g6rf-w2rx: this handler does not dereference the user - it hands
        // it to canExport(), which answers false - so an unknown token got a 403
        // rather than a crash. It is guarded all the same: one rule for every token
        // lookup is what keeps the next handler from being the one that is missed,
        // and "your token is invalid" is the honest answer to an invalid token.
        sendJsonResult(res, { code: 401, data: { error: 'Invalid token' } });
        return;
      }
    } else if (!Meteor.settings.public.sandstorm) {
      try {
        // Any logged-in user may request an export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        sendJsonResult(res, { code: error.statusCode || 403, data: { error: (error && error.reason) || 'Forbidden' } });
        return;
      }
      user = await ReactiveCache.getUser({ _id: req.userId });
    }
    const exporter = new Exporter(boardId);
    if (await exporter.canExport(user)) {
      await respond();
    } else {
      logExportDenied();
      sendJsonResult(res, { code: 403, data: { error: 'Forbidden' } });
    }
  }

  EXTERNAL_EXPORT_FORMATS.forEach(format => {
    /**
     * @operation exportExternal
     * @tag Boards
     * @summary Export the board as a NextCloud Deck / OpenProject / GitHub /
     * GitLab / Gitea / Forgejo style JSON.
     * @param {string} boardId the ID of the board we are exporting
     * @param {string} authToken the loginToken
     */
    WebApp.handlers.get(`/api/boards/:boardId/export/${format}`, safeRoute(async function (req, res) {
      await serveExternalExport(req, res, format);
    }));
  });

  // todo XXX once we have a real API in place, move that route there
  // todo XXX also  share the route definition between the client and the server
  // so that we could use something like
  // `ApiRoutes.path('boards/export', boardId)``
  // on the client instead of copy/pasting the route path manually between the
  // client and the server.
  /**
   * @operation exportJson
   * @tag Boards
   *
   * @summary This route is used to export a attachement to a json file format.
   *
   * @description If user is already logged-in, pass loginToken as param
   * "authToken": '/api/boards/:boardId/attachments/:attachmentId/export?authToken=:token'
   *
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} attachmentId the ID of the attachment we are exporting
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get(
    '/api/boards/:boardId/attachments/:attachmentId/export',
    safeRoute(async function (req, res) {
      const boardId = req.params.boardId;
      const attachmentId = req.params.attachmentId;
      let user = null;
      let impersonateDone = false;
      let adminId = null;

      // First check if board exists and is public to avoid unnecessary authentication
      const board = await ReactiveCache.getBoard(boardId);
      if (!board) {
        sendJsonResult(res, { code: 404, data: { error: 'Not found' } });
        return;
      }

      // If board is public, skip expensive authentication operations
      if (board.isPublic()) {
        // Public boards don't require authentication - skip hash operations
        const exporter = new Exporter(boardId, attachmentId);
        sendJsonResult(res, {
          code: 200,
          data: await exporter.build(),
        });
        return;
      }

      // Only perform expensive authentication for private boards
      const loginToken = req.query.authToken;
      if (loginToken) {
        // Validate token length to prevent resource abuse
        if (loginToken.length > 10000) {
          if (process.env.DEBUG === 'true') {
            console.warn('Suspiciously long auth token received, rejecting to prevent resource abuse');
          }
          sendJsonResult(res, { code: 400, data: { error: 'Bad request' } });
          return;
        }

        const hashToken = Accounts._hashLoginToken(loginToken);
        user = await ReactiveCache.getUser({
          'services.resume.loginTokens.hashedToken': hashToken,
        });
        if (!user) {
          // GHSA-3gcg-g6rf-w2rx: an authToken that matches no login token makes the
          // lookup answer `undefined`, and `user._id` on that threw a TypeError out of
          // an async route handler - an unhandled rejection, which this app turns into
          // a process crash (see the note in server/ldapGroupSync.js). One crafted GET
          // took the whole server down. The same guard already existed in
          // models/exportPDF.js and models/exportExcelCard.js; these handlers were
          // missed.
          sendJsonResult(res, { code: 401, data: { error: 'Invalid token' } });
          return;
        }
        adminId = user._id.toString();
        impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId: adminId });
      } else if (!Meteor.settings.public.sandstorm) {
        try {
          // Any logged-in user may request an export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
        } catch (error) {
          sendJsonResult(res, { code: error.statusCode || 403, data: { error: (error && error.reason) || 'Forbidden' } });
          return;
        }
        user = await ReactiveCache.getUser({ _id: req.userId, isAdmin: true });
      }

      const exporter = new Exporter(boardId, attachmentId);
      if (await exporter.canExport(user)) {
        if (impersonateDone) {
          await ImpersonatedUsers.insertAsync({
            adminId: adminId,
            boardId: boardId,
            attachmentId: attachmentId,
            reason: 'exportJSONattachment',
          });
        }
        sendJsonResult(res, {
          code: 200,
          data: await exporter.build(),
        });
      } else {
        // we could send an explicit error message, but on the other hand the only
        // way to get there is by hacking the UI so let's keep it raw.
        logExportDenied();
        sendJsonResult(res, { code: 403, data: { error: 'Forbidden' } });
      }
    }),
  );

  /**
   * @operation exportCSV/TSV
   * @tag Boards
   *
   * @summary This route is used to export the board to a CSV or TSV file format.
   *
   * @description If user is already logged-in, pass loginToken as param
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   * @param {string} delimiter delimiter to use while building export. Default is comma ','
   */
  WebApp.handlers.get('/api/boards/:boardId/export/csv', safeRoute(async function (req, res) {
    const boardId = req.params.boardId;
    let user = null;
    let impersonateDone = false;
    let adminId = null;

    // First check if board exists and is public to avoid unnecessary authentication
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      res.writeHead(404);
      res.end('Board not found');
      return;
    }

    // If board is public, skip expensive authentication operations
    if (board.isPublic()) {
      // Public boards don't require authentication - skip hash operations
      const exporter = new Exporter(boardId);

      if( req.query.delimiter == "\t" ) {
        // TSV file
        res.writeHead(200, {
          'Content-Type': 'text/tsv',
        });
      }
      else {
        // CSV file (comma or semicolon)
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
        });
        // Adding UTF8 BOM to quick fix MS Excel issue
        // use Uint8Array to prevent from converting bytes to string
        res.write(new Uint8Array([0xEF, 0xBB, 0xBF]));
      }
      await exporter.buildCsvStream(res, req.query.delimiter, 'en');
      res.end();
      return;
    }

    // Only perform expensive authentication for private boards
    const loginToken = req.query.authToken;
    if (loginToken) {
      // Validate token length to prevent resource abuse
      if (loginToken.length > 10000) {
        if (process.env.DEBUG === 'true') {
          console.warn('Suspiciously long auth token received, rejecting to prevent resource abuse');
        }
        res.writeHead(400);
        res.end('Invalid token');
        return;
      }

      const hashToken = Accounts._hashLoginToken(loginToken);
      user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      if (!user) {
        // GHSA-3gcg-g6rf-w2rx - see the note in models/export.js: an unknown token
        // answers `undefined`, and dereferencing it crashed the server.
        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid token');
        return;
      }
      adminId = user._id.toString();
      impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId: adminId });
    } else if (!Meteor.settings.public.sandstorm) {
      try {
        // Any logged-in user may request an export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        sendJsonResult(res, { code: error.statusCode || 403, data: { error: (error && error.reason) || 'Forbidden' } });
        return;
      }
      user = await ReactiveCache.getUser({
        _id: req.userId,
        isAdmin: true,
      });
    }

    // #1173: the same selection every other board export honours - on a CSV it
    // lands on COLUMNS, since that is what a CSV has.
    const exporter = new Exporter(boardId, undefined, {
      fields: parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS),
    });
    if (await exporter.canExport(user)) {
      if (impersonateDone) {
        let exportType = 'exportCSV';
        if( req.query.delimiter == "\t" ) {
          exportType = 'exportTSV';
        }
        await ImpersonatedUsers.insertAsync({
          adminId: adminId,
          boardId: boardId,
          reason: exportType,
        });
      }

      let userLanguage = 'en';
      if (user && user.profile) {
        userLanguage = user.profile.language
      }

      if( req.query.delimiter == "\t" ) {
        // TSV file
        res.writeHead(200, {
          'Content-Type': 'text/tsv',
        });
      }
      else {
        // CSV file (comma or semicolon)
        res.writeHead(200, {
          'Content-Type': 'text/csv; charset=utf-8',
        });
        // Adding UTF8 BOM to quick fix MS Excel issue
        // use Uint8Array to prevent from converting bytes to string
        res.write(new Uint8Array([0xEF, 0xBB, 0xBF]));
      }
      await exporter.buildCsvStream(res, req.query.delimiter, userLanguage);
      res.end();
    } else {
      res.writeHead(403);
      res.end('Permission Error');
    }
  }));
}
