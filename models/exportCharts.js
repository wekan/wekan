import { Meteor } from 'meteor/meteor';
import { ReactiveCache } from '/imports/reactiveCache';
import { TAPi18n } from '/imports/i18n';
import { runOnServer } from './runOnServer';

const CHART_KEYS = new Set([
  'dashboard', 'burndown', 'burnup', 'cumulativeFlow', 'controlChart',
  'cycleTime', 'flowEfficiency', 'leadTime', 'throughputHistogram', 'wipRun',
  'gantt',
]);

runOnServer(function() {
  const { ExporterChartPDF } = require('./server/ExporterChartPDF');
  const { ExporterChartExcel } = require('./server/ExporterChartExcel');
  const { WebApp } = require('meteor/webapp');
  const { safeRoute } = require('/server/apiMiddleware');
  const { Authentication } = require('/server/authentication');

  function logExportDenied() {
    try {
      require('/server/lib/securityLog').record({
        key: 'authz.export', action: 'blocked', source: 'export',
        detail: 'chart export denied (no board visibility)',
      });
    } catch (e) { /* logging must never break the response */ }
  }

  const DATE_FORMATS = ['YYYY-MM-DD', 'DD-MM-YYYY', 'MM-DD-YYYY'];
  const exportLocale = async (req, user) => {
    let language = (user && user.profile && user.profile.language)
      || (req.query && req.query.lang) || 'en';
    try {
      await TAPi18n.loadLanguage(language);
    } catch (error) {
      language = 'en';
    }
    const timezone = (req.query && typeof req.query.tz === 'string' && req.query.tz.length <= 64)
      ? req.query.tz : '';
    const requested = req.query && req.query.dateFormat;
    const dateFormat = DATE_FORMATS.includes(requested)
      ? requested
      : ((user && user.profile && user.profile.dateFormat) || 'YYYY-MM-DD');
    return { language, timezone, dateFormat };
  };

  async function authenticate(req, res) {
    const boardId = req.params.boardId;
    const board = await ReactiveCache.getBoard(boardId);
    if (!board) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Board not found');
      return { board: null };
    }
    if (board.isPublic()) return { board, user: null };

    const loginToken = req.query && req.query.authToken;
    if (loginToken) {
      if (loginToken.length > 10000) {
        res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid token');
        return { board: null };
      }
      const hashToken = Accounts._hashLoginToken(loginToken);
      const user = await ReactiveCache.getUser({
        'services.resume.loginTokens.hashedToken': hashToken,
      });
      if (!user) {
        res.writeHead(401, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Invalid token');
        return { board: null };
      }
      return { board, user };
    }
    if (!Meteor.settings.public.sandstorm) {
      try {
        // Any logged-in user may request a chart export; board-level access is
        // enforced below by exporter.canExport() (board.isVisibleBy).
        Authentication.checkLoggedIn(req.userId);
      } catch (error) {
        res.writeHead(error.statusCode || 403, { 'Content-Type': 'text/plain; charset=utf-8' });
        res.end('Unauthorized');
        return { board: null };
      }
    }
    const user = await ReactiveCache.getUser({ _id: req.userId });
    return { board, user };
  }

  /**
   * @operation exportChartPDF
   * @tag Boards
   * @summary Export one board report chart (Dashboard, Burndown, Burnup, CFD,
   * Control Chart, Cycle/Lead Time, Flow Efficiency, Throughput, WIP Run) to PDF.
   * @description Pass the loginToken as the `authToken` query param for private
   * boards: `/api/boards/:boardId/charts/:chartKey/exportPDF?authToken=:token`.
   * @param {string} boardId the ID of the board
   * @param {string} chartKey one of dashboard, burndown, burnup, cumulativeFlow,
   * controlChart, cycleTime, flowEfficiency, leadTime, throughputHistogram, wipRun
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/charts/:chartKey/exportPDF', safeRoute(async function (req, res) {
    if (!CHART_KEYS.has(req.params.chartKey)) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unknown chart');
      return;
    }
    const { board, user } = await authenticate(req, res);
    if (!board) return;
    const { language, timezone, dateFormat } = await exportLocale(req, user);
    const exporter = new ExporterChartPDF(board._id, req.params.chartKey, language, timezone, dateFormat);
    if (await exporter.canExport(user)) {
      await exporter.build(res);
    } else {
      logExportDenied();
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unauthorized');
    }
  }));

  /**
   * @operation exportChartExcel
   * @tag Boards
   * @summary Export one board report chart to Excel (.xlsx).
   * @description Pass the loginToken as the `authToken` query param for private
   * boards: `/api/boards/:boardId/charts/:chartKey/exportExcel?authToken=:token`.
   * @param {string} boardId the ID of the board
   * @param {string} chartKey one of dashboard, burndown, burnup, cumulativeFlow,
   * controlChart, cycleTime, flowEfficiency, leadTime, throughputHistogram, wipRun
   * @param {string} authToken the loginToken
   */
  WebApp.handlers.get('/api/boards/:boardId/charts/:chartKey/exportExcel', safeRoute(async function (req, res) {
    if (!CHART_KEYS.has(req.params.chartKey)) {
      res.writeHead(400, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unknown chart');
      return;
    }
    const { board, user } = await authenticate(req, res);
    if (!board) return;
    const { language } = await exportLocale(req, user);
    const exporter = new ExporterChartExcel(board._id, req.params.chartKey, language);
    if (await exporter.canExport(user)) {
      await exporter.build(res);
    } else {
      logExportDenied();
      res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Unauthorized');
    }
  }));
});
