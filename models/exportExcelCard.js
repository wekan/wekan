import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { runOnServer } from './runOnServer';
import ImpersonatedUsers from '/models/impersonatedUsers';

runOnServer(function() {
  const { ExporterExcelCard, ALL_FIELDS } = require('./server/ExporterExcelCard');
  const { WebApp } = require('meteor/webapp');
  const { safeRoute } = require('/server/apiMiddleware');
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
    safeRoute(async function (req, res) {
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

      // GHSA-6p5m-f9p2-wqm5: the card has to BELONG to the board being
      // authorised. Every check below is about `board` - isPublic() on one
      // branch, canExport() on the other - and both were deciding access to one
      // object while the export read a different one, named by a path parameter
      // the caller also controls. Bound here, at the routing layer, as well as in
      // the exporter's own query: the two identifiers arrive together, so this is
      // where their relationship is cheapest to state, and it holds for the
      // public branch too, which skips authentication entirely.
      //
      // 404, not 403: whether a given card id exists at all is not something an
      // unauthorised caller should learn from the difference.
      const containedCard = await ReactiveCache.getCard({
        _id: paramCardId,
        boardId,
        listId: paramListId,
      });
      if (!containedCard) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Card not found');
        return;
      }

      // Public boards skip authentication
      if (board.isPublic()) {
        const fieldsParam = req.query.fields;
        const fields = fieldsParam
          ? fieldsParam.split(',').map(f => f.trim()).filter(f => ALL_FIELDS.includes(f))
          : null;
        let publicLanguage = (req.query && req.query.lang) || 'en';
        try {
          await TAPi18n.loadLanguage(publicLanguage);
        } catch (_) {
          publicLanguage = 'en';
        }
        const exporter = new ExporterExcelCard(
          boardId, paramListId, paramCardId, publicLanguage, fields,
        );
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

      // A saved profile language is authoritative. The browser language sent
      // in ?lang= is used only when the account has no saved language.
      let userLanguage =
        (user && user.profile && user.profile.language) ||
        (req.query && req.query.lang) ||
        'en';

      // Ensure the chosen language bundle is loaded into i18next.
      try {
        await TAPi18n.loadLanguage(userLanguage);
      } catch (_) {
        // Unknown / unsupported language – fall back to English silently.
        userLanguage = 'en';
      }

      // #6586: the date format the OPENED CARD is showing, sent by the export
      // link - for a reader who is not logged in it lives in localStorage, which
      // this lookup cannot reach. The profile is the fallback, and only the
      // three formats formatDateByUserPreference understands are accepted.
      const DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];
      const requestedFormat = req.query && req.query.dateFormat;
      const dateFormat = DATE_FORMATS.includes(requestedFormat)
        ? requestedFormat
        : ((user && user.profile && user.profile.dateFormat) || 'YYYY-MM-DD');

      // #6586: the reader's IANA zone, sent by the export link. Without it the
      // dates come out in the server's zone, which is the "-2h wrong for
      // Europe/Berlin" the PDF export was reported for and this export shared.
      const timezone = (req.query && typeof req.query.tz === 'string' && req.query.tz.length <= 64)
        ? req.query.tz
        : '';

      // Parse optional ?fields=people,dates,... query param
      const fieldsParam = req.query.fields;
      const fields = fieldsParam
        ? fieldsParam.split(',').map(f => f.trim()).filter(f => ALL_FIELDS.includes(f))
        : null;

      const exporter = new ExporterExcelCard(boardId, paramListId, paramCardId, userLanguage, fields, dateFormat, timezone);
      if ((await exporter.canExport(user))) {
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
    }),
  );
});
