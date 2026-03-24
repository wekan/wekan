import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { runOnServer } from './runOnServer';
import ImpersonatedUsers from '/models/impersonatedUsers';

runOnServer(function() {
  const { ExporterExcelCard, ALL_FIELDS } = require('./server/ExporterExcelCard');
  const { WebApp } = require('meteor/webapp');
  const { Authentication } = require('/server/authentication');

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
        const fieldsParam = req.query.fields;
        const fields = fieldsParam
          ? fieldsParam.split(',').map(f => f.trim()).filter(f => ALL_FIELDS.includes(f))
          : null;
        const exporter = new ExporterExcelCard(boardId, paramListId, paramCardId, 'en', fields);
        await exporter.build(res);
        return;
      }

      // Authenticate for private boards
      const loginToken = req.query.authToken;
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

      // Determine language: prefer the active UI language sent by the client
      // (?lang=fi), then the profile setting, then English.  The client-side
      // param is necessary because WeKan may use the browser locale without
      // ever writing it to profile.language.
      let userLanguage =
        req.query.lang ||
        (user && user.profile && user.profile.language) ||
        'en';

      // Ensure the chosen language bundle is loaded into i18next.
      try {
        await TAPi18n.loadLanguage(userLanguage);
      } catch (_) {
        // Unknown / unsupported language – fall back to English silently.
        userLanguage = 'en';
      }

      const dateFormat = (user && user.profile && user.profile.dateFormat) || 'YYYY-MM-DD';

      // Parse optional ?fields=people,dates,... query param
      const fieldsParam = req.query.fields;
      const fields = fieldsParam
        ? fieldsParam.split(',').map(f => f.trim()).filter(f => ALL_FIELDS.includes(f))
        : null;

      const exporter = new ExporterExcelCard(boardId, paramListId, paramCardId, userLanguage, fields, dateFormat);
      if ((await exporter.canExport(user)) || impersonateDone) {
        if (impersonateDone) {
          await ImpersonatedUsers.insertAsync({
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
