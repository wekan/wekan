import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { runOnServer } from './runOnServer';
import ImpersonatedUsers from '/models/impersonatedUsers';

runOnServer(function() {
  // the ExporterExcel class is only available on server and in order to import
  // it here we use runOnServer to have it inside a function instead of an
  // if (Meteor.isServer) block
  const { ExporterExcel } = require('./server/ExporterExcel');
  const { ExporterExcelBoard } = require('./server/ExporterExcelBoard');
  const { BOARD_EXPORT_FIELD_KEYS, parseExportFields, parseExportScope } =
    require('/models/lib/exportFields');

  // What formatDateByUserPreference understands, and nothing else.
  const DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];

  // The export the request asks for (#1173). `card-details` - every card in the
  // CARD export's layout - is what the popup ticks by default, and it needs an
  // in-memory workbook: a card block merges and styles cells and comes back to
  // earlier rows, which the streaming writer cannot do. Untick it and the old
  // STREAMING table exporter answers instead, which is the one to use on a board
  // too large to hold in memory. Both are real exports; the checkbox chooses.
  const boardExcelExporter = (req, boardId, user) => {
    const fields = parseExportFields(req.query && req.query.fields, BOARD_EXPORT_FIELD_KEYS);
    const language = (user && user.profile && user.profile.language)
      || (req.query && req.query.lang) || 'en';
    const requested = req.query && req.query.dateFormat;
    const dateFormat = DATE_FORMATS.includes(requested)
      ? requested
      : ((user && user.profile && user.profile.dateFormat) || 'YYYY-MM-DD');
    const timezone = (req.query && typeof req.query.tz === 'string' && req.query.tz.length <= 64)
      ? req.query.tz : '';
    const scope = parseExportScope(req.query);

    if (fields && !fields.includes('card-details')) {
      return new ExporterExcel(boardId, language, scope);
    }
    return new ExporterExcelBoard(boardId, language, fields, dateFormat, timezone, scope);
  };
  const { WebApp } = require('meteor/webapp');
  const { safeRoute } = require('/server/apiMiddleware');
  const { Authentication } = require('/server/authentication');

  // todo XXX once we have a real API in place, move that route there
  // todo XXX also  share the route definition between the client and the server
  // so that we could use something like
  // `ApiRoutes.path('boards/exportExcel', boardId)``
  // on the client instead of copy/pasting the route path manually between the
  // client and the server.
  /**
   * @operation exportExcel
   * @tag Boards
   *
   * @summary This route is used to export the board Excel.
   *
   * @description If user is already logged-in, pass loginToken as param
   * "authToken": '/api/boards/:boardId/exportExcel?authToken=:token'
   *
   * See https://blog.kayla.com.au/server-side-route-authentication-in-meteor/
   * for detailed explanations
   *
   * @param {string} boardId the ID of the board we are exporting
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/exportExcel', safeRoute(async function (req, res) {
    const boardId = req.params.boardId;
    let user = null;
    let impersonateDone = false;
    let adminId = null;

    // First check if board exists and is public to avoid unnecessary authentication
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      res.end('Board not found');
      return;
    }

    // If board is public, skip expensive authentication operations
    if (board.isPublic()) {
      // Public boards don't require authentication - skip hash operations
      const exporterExcel = boardExcelExporter(req, boardId, null);
      await exporterExcel.build(res);
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
        await Authentication.checkUserId(req.userId);
      } catch (error) {
        res.writeHead(error.statusCode || 403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unauthorized');
        return;
      }
      user = await ReactiveCache.getUser({
        _id: req.userId,
        isAdmin: true,
      });
    }

    const exporterExcel = boardExcelExporter(req, boardId, user);
    if ((await exporterExcel.canExport(user))) {
      if (impersonateDone) {
        await ImpersonatedUsers.insertAsync({
          adminId: adminId,
          boardId: boardId,
          reason: 'exportExcel',
        });
      }
      // AWAITED, and that is #6591's other half. `build(res)` is async: without
      // the await its rejection went nowhere - no 500, no log line, and a
      // response that was never written or ended, so the browser waited for an
      // export that had already failed. "The Board Settings -> Export board ->
      // export/Excel didn't work", with nothing in the logs to say why.
      try {
        await exporterExcel.build(res);
      } catch (error) {
        console.error('exportExcel failed for board', boardId, error);
        if (!res.headersSent) {
          res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
          res.end(`Excel export failed: ${error && error.message ? error.message : error}`);
        } else {
          // Bytes are already on the wire, so the file is truncated whatever we
          // do; end it rather than leave the request open forever.
          res.end();
        }
      }
    } else {
      res.end(TAPi18n.__('user-can-not-export-excel'));
    }
  }));
});
