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
  const { WebApp } = require('meteor/webapp');
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
  WebApp.handlers.get('/api/boards/:boardId/lists/:listId/cards/:cardId/exportPDF', async function (req, res) {
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
      const exporterCardPDF = new ExporterCardPDF(
        boardId,
        paramListId,
        paramCardId,
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

    const exporterCardPDF = new ExporterCardPDF(
      boardId,
      paramListId,
      paramCardId,
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
  });

  /**
   * @operation exportBoardPDF
   * @tag Boards
   * @summary Export a whole board to PDF (board title, lists and their cards).
   * @description Pass the loginToken as the `authToken` query param for private
   * boards: `/api/boards/:boardId/exportPDF?authToken=:token`.
   * @param {string} boardId the ID of the board to export
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/exportPDF', async function (req, res) {
    const boardId = req.params.boardId;
    let user = null;

    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      res.end('Board not found');
      return;
    }

    if (board.isPublic()) {
      await new ExporterBoardPDF(boardId).build(res);
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

    const exporter = new ExporterBoardPDF(boardId);
    if (await exporter.canExport(user)) {
      await exporter.build(res);
    } else {
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unauthorized');
    }
  });
});
