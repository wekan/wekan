import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { runOnServer } from './runOnServer';
import ImpersonatedUsers from '/models/impersonatedUsers';

runOnServer(function() {
  // the ExporterCardPDF class is only available on server and in order to import
  // it here we use runOnServer to have it inside a function instead of an
  // if (Meteor.isServer) block
  const { ExporterCardPDF, ExporterBoardPDF } = require('./server/ExporterCardPDF');

  const { CARD_EXPORT_FIELD_KEYS, BOARD_EXPORT_FIELD_KEYS, parseExportFields, parseExportScope } =
    require('/models/lib/exportFields');

  // What formatDateByUserPreference understands, and nothing else.
  const DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];

  // #1173: the popup's checkboxes, and - for the board export - which swimlane
  // or list was asked for, since those menus offer the same export.
  const exportSelection = (req, allowed) => ({
    fields: parseExportFields(req.query && req.query.fields, allowed),
    scope: parseExportScope(req.query),
  });

  // #6586: the two things the export needs about the reader and the server
  // cannot know on its own.
  //
  // The LANGUAGE is the profile's, and `?lang=` is the fallback - a PUBLIC board
  // has no logged-in user to read one off. Loading the bundle is what makes the
  // labels come out translated; an unsupported tag falls back to English rather
  // than failing the download. Same order, and the same silent fallback, as the
  // Excel card export.
  //
  // The TIMEZONE is `?tz=` and nothing else: dates are stored in UTC, a WeKan
  // profile carries no zone, and printing UTC to a reader in Berlin is the
  // reported "-2h wrong". The browser sends its IANA name; an export URL
  // without it prints UTC and says UTC.
  const exportLocale = async (req, user) => {
    let language = (user && user.profile && user.profile.language)
      || (req.query && req.query.lang)
      || 'en';
    try {
      await TAPi18n.loadLanguage(language);
    } catch (error) {
      language = 'en';
    }
    const timezone = (req.query && typeof req.query.tz === 'string' && req.query.tz.length <= 64)
      ? req.query.tz
      : '';

    // The DATE FORMAT the opened card is showing. The client sends it because
    // for a reader who is not logged in it lives in localStorage, which no
    // profile lookup here can reach; the profile is the fallback. Only the three
    // formats formatDateByUserPreference understands are accepted, so a query
    // string cannot put arbitrary text where a date belongs.
    const requested = req.query && req.query.dateFormat;
    const dateFormat = DATE_FORMATS.includes(requested)
      ? requested
      : ((user && user.profile && user.profile.dateFormat) || 'YYYY-MM-DD');

    return { language, timezone, dateFormat };
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
  WebApp.handlers.get('/api/boards/:boardId/lists/:listId/cards/:cardId/exportPDF', safeRoute(async function (req, res) {
    const boardId = req.params.boardId;
    const paramListId = req.params.listId;
    const paramCardId = req.params.cardId;
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
      const { language, timezone, dateFormat } = await exportLocale(req, null);
      const exporterCardPDF = new ExporterCardPDF(
        boardId,
        paramListId,
        paramCardId,
        language,
        timezone,
        dateFormat,
        exportSelection(req, CARD_EXPORT_FIELD_KEYS).fields,
      );
      await exporterCardPDF.build(res);
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
        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid token');
        return;
      }
      adminId = user._id.toString();
      impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId: adminId });
    } else if (!Meteor.settings.public.sandstorm) {
      try {
        // Any logged-in user may request a PDF export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        res.writeHead(error.statusCode || 403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unauthorized');
        return;
      }
      user = await ReactiveCache.getUser({
        _id: req.userId,
      });
    }

    const { language, timezone, dateFormat } = await exportLocale(req, user);
    const exporterCardPDF = new ExporterCardPDF(
      boardId,
      paramListId,
      paramCardId,
      language,
      timezone,
      dateFormat,
      exportSelection(req, CARD_EXPORT_FIELD_KEYS).fields,
    );
    if (await exporterCardPDF.canExport(user)) {
      if (impersonateDone) {
        await ImpersonatedUsers.insertAsync({
          adminId: adminId,
          boardId: boardId,
          reason: 'exportCardPDF',
        });
      }

      await exporterCardPDF.build(res);
    } else {
      res.end(TAPi18n.__('user-can-not-export-card-to-pdf'));
    }
  }));

  /**
   * @operation exportBoardPDF
   * @tag Boards
   * @summary Export a whole board to PDF (board title, lists and their cards).
   * @description Pass the loginToken as the `authToken` query param for private
   * boards: `/api/boards/:boardId/exportPDF?authToken=:token`.
   * @param {string} boardId the ID of the board to export
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/exportPDF', safeRoute(async function (req, res) {
    const boardId = req.params.boardId;
    let user = null;

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      res.end('Board not found');
      return;
    }

    if (board.isPublic()) {
      const { language, timezone, dateFormat } = await exportLocale(req, null);
      const selection = exportSelection(req, BOARD_EXPORT_FIELD_KEYS);
      const publicExporter = new ExporterBoardPDF(
        boardId, language, timezone, dateFormat, selection.fields, selection.scope);
      // On ONE line, and awaited: tests/excelExport.test.cjs reads it line by
      // line because an un-awaited build(res) is #6591 - a rejection that goes
      // nowhere and a response that is never ended.
      await publicExporter.build(res);
      return;
    }

    const loginToken = req.query && req.query.authToken;
    if (loginToken) {
      if (loginToken.length > 10000) {
        res.end('Invalid token');
        return;
      }
      const hashToken = Accounts._hashLoginToken(loginToken);
      user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid token');
        return;
      }
    } else if (!Meteor.settings.public.sandstorm) {
      try {
        // Any logged-in user may request a PDF export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        res.writeHead(error.statusCode || 403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unauthorized');
        return;
      }
      user = await ReactiveCache.getUser({ _id: req.userId });
    }

    const { language, timezone, dateFormat } = await exportLocale(req, user);
    const selection = exportSelection(req, BOARD_EXPORT_FIELD_KEYS);
    const exporter = new ExporterBoardPDF(
      boardId, language, timezone, dateFormat, selection.fields, selection.scope);
    if (await exporter.canExport(user)) {
      await exporter.build(res);
    } else {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unauthorized');
    }
  }));
});
