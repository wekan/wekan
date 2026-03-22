import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { runOnServer } from './runOnServer';

runOnServer(function() {
  import { ExporterExcelCard, ALL_FIELDS } from './server/ExporterExcelCard';
  import { WebApp } from 'meteor/webapp';

  /**
   * @operation exportExcelCard
   * @tag Cards
   *
   * @summary Export a single card to Excel (.xlsx), formatted for DIN A4 Portrait printing.
   *
   * @description If user is already logged-in, pass loginToken as param
   * "authToken": '/api/boards/:boardId/lists/:listId/cards/:cardId/exportExcel?authToken=:token'
   *
   * Optional query param "fields" is a comma-separated list of sections to include.
   * Valid values: people, board-info, dates, description, checklists, subtasks, comments
   * Omitting "fields" includes all sections.
   *
   * @param {string} boardId the ID of the board
   * @param {string} listId the ID of the list
   * @param {string} cardId the ID of the card to export
   * @param {string} authToken the loginToken
   * @param {string} fields comma-separated list of sections to include
   */
  WebApp.handlers.get(
    '/api/boards/:boardId/lists/:listId/cards/:cardId/exportExcel',
    async function (req, res) {
      const boardId = req.params.boardId;
      const paramListId = req.params.listId;
      const paramCardId = req.params.cardId;
      let user = null;
      let impersonateDone = false;
      let adminId = null;

      const board = await ReactiveCache.getBoard(boardId);
      if (!board) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Board not found');
        return;
      }

      // Public boards skip authentication
      if (board.isPublic()) {
        const fieldsParam = params.query.fields;
        const fields = fieldsParam
          ? fieldsParam.split(',').map(f => f.trim()).filter(f => ALL_FIELDS.includes(f))
          : null;
        const exporter = new ExporterExcelCard(boardId, paramListId, paramCardId, 'en', fields);
        await exporter.build(res);
        return;
      }

      // Authenticate for private boards
      const loginToken = params.query.authToken;
      if (loginToken) {
        if (loginToken.length > 10000) {
          res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
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
        impersonateDone = await ReactiveCache.getImpersonatedUser({ adminId });
      } else if (!Meteor.settings.public.sandstorm) {
        Authentication.checkUserId(req.userId);
        user = await ReactiveCache.getUser({
          _id: req.userId,
          isAdmin: true,
        });
      }

      let userLanguage = 'en';
      if (user && user.profile && user.profile.language) {
        userLanguage = user.profile.language;
      }

      // Parse optional ?fields=people,dates,... query param
      const fieldsParam = params.query.fields;
      const fields = fieldsParam
        ? fieldsParam.split(',').map(f => f.trim()).filter(f => ALL_FIELDS.includes(f))
        : null;

      const exporter = new ExporterExcelCard(boardId, paramListId, paramCardId, userLanguage, fields, user);
      if ((await exporter.canExport(user)) || impersonateDone) {
        if (impersonateDone) {
          ImpersonatedUsers.insert({
            adminId,
            boardId,
            reason: 'exportExcelCard',
          });
        }
        await exporter.build(res);
      } else {
        res.end(TAPi18n.__('user-can-not-export-card-to-excel'));
      }
    },
  );
});
