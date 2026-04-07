import { ReactiveCache } from '/imports/reactiveCache';
import { Exporter } from './exporter';
import { Meteor } from 'meteor/meteor';
import ImpersonatedUsers from '/models/impersonatedUsers';

if (Meteor.isServer) {
  const { WebApp } = require('meteor/webapp');
  const { sendJsonResult } = require('/server/apiMiddleware');
  const { Authentication } = require('/server/authentication');

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
  WebApp.handlers.get('/api/boards/:boardId/export', async function (req, res) {
    const boardId = req.params.boardId;
    let user = null;
    let impersonateDone = false;
    let adminId = null;

    // First check if board exists and is public to avoid unnecessary authentication
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      sendJsonResult(res, 404);
      return;
    }

    // If board is public, skip expensive authentication operations
    if (board.isPublic()) {
      // Public boards don't require authentication - skip hash operations
      const exporter = new Exporter(boardId);
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
        sendJsonResult(res, 400);
        return;
      }

      const hashToken = Accounts._hashLoginToken(loginToken);
      user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      adminId = user._id.toString();
      impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId: adminId });
    } else if (!Meteor.settings.public.sandstorm) {
      Authentication.checkUserId(req.userId);
      user = await ReactiveCache.getUser({ _id: req.userId, isAdmin: true });
    }

    const exporter = new Exporter(boardId);
    if (await exporter.canExport(user) || impersonateDone) {
      if (impersonateDone) {
        await ImpersonatedUsers.insertAsync({
          adminId: adminId,
          boardId: boardId,
          reason: 'exportJSON',
        });
      }

      sendJsonResult(res, {
        code: 200,
        data: await exporter.build(),
      });
    } else {
      // we could send an explicit error message, but on the other hand the only
      // way to get there is by hacking the UI so let's keep it raw.
      sendJsonResult(res, 403);
    }
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
    async function (req, res) {
      const boardId = req.params.boardId;
      const attachmentId = req.params.attachmentId;
      let user = null;
      let impersonateDone = false;
      let adminId = null;

      // First check if board exists and is public to avoid unnecessary authentication
      const board = await ReactiveCache.getBoard(boardId);
      if (!board) {
        sendJsonResult(res, 404);
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
          sendJsonResult(res, 400);
          return;
        }

        const hashToken = Accounts._hashLoginToken(loginToken);
        user = await ReactiveCache.getUser({
          'services.resume.loginTokens.hashedToken': hashToken,
        });
        adminId = user._id.toString();
        impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId: adminId });
      } else if (!Meteor.settings.public.sandstorm) {
        Authentication.checkUserId(req.userId);
        user = await ReactiveCache.getUser({ _id: req.userId, isAdmin: true });
      }

      const exporter = new Exporter(boardId, attachmentId);
      if (await exporter.canExport(user) || impersonateDone) {
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
        sendJsonResult(res, 403);
      }
    },
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
  WebApp.handlers.get('/api/boards/:boardId/export/csv', async function (req, res) {
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
      res.write(await exporter.buildCsv(req.query.delimiter, 'en'));
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
      adminId = user._id.toString();
      impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId: adminId });
    } else if (!Meteor.settings.public.sandstorm) {
      Authentication.checkUserId(req.userId);
      user = await ReactiveCache.getUser({
        _id: req.userId,
        isAdmin: true,
      });
    }

    const exporter = new Exporter(boardId);
    if (await exporter.canExport(user) || impersonateDone) {
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
      res.write(await exporter.buildCsv(req.query.delimiter, userLanguage));
      res.end();
    } else {
      res.writeHead(403);
      res.end('Permission Error');
    }
  });
}
