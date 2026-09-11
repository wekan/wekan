import { Meteor } from 'meteor/meteor';
import { WebApp } from 'meteor/webapp';
import { DDP } from 'meteor/ddp';
import { Authentication } from '/server/authentication';
import { sendJsonResult } from '/server/apiMiddleware';
import { publicErrorData } from '/server/lib/apiResponseHelpers';
import { EVENT_STREAMS } from '/models/eventLog';
import { getProblemsOverview } from '/server/lib/systemStatus';

// REST API for Admin Panel / Problems. Read-only apart from acknowledging a
// stream, and admin-only throughout - Authentication.checkUserId() is the
// REST API's "must be a global admin" check. Every stream read goes through
// the SAME Meteor methods the Admin Panel pages call (models/eventLog.js:
// eventLogProblemAreas, eventLogCount, eventLogPage, acknowledgeEventLog), run
// as the request's user, so the API can never show a row the panel would not.

function callAsUser(userId, name, ...args) {
  return DDP._CurrentMethodInvocation.withValue(
    { userId },
    async () => Meteor.callAsync(name, ...args),
  );
}

function clampInt(value, fallback, min, max) {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.max(min, Math.min(max, parsed));
}

/**
 * @operation get_admin_problems
 * @tag Problems
 * @summary Get the Admin Panel / Problems status overview
 *
 * @description What Admin Panel / Problems / Summary shows: every migration or
 * repair in progress, the detected problems (broken cards, lists missing their
 * swimlane, failing login-page checks), and for each event stream (`security`,
 * `speed`, `tests`, `cpu`, `database`, `integrity`) how many problems are newer
 * than its acknowledgment. The same overview `snap run wekan.problems` prints.
 * Only the global admin can call this.
 *
 * @return_type {inProgress: [{kind: string, active: boolean, message: string}], problems: [{id: string, severity: string, title: string, detail: string, count: number}], newProblems: [{stream: string, count: number}], streams: [string]}
 */
WebApp.handlers.get('/api/admin/problems', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const overview = await getProblemsOverview();
    const newProblems = await callAsUser(req.userId, 'eventLogProblemAreas');
    sendJsonResult(res, {
      code: 200,
      data: { ...overview, newProblems, streams: EVENT_STREAMS.slice() },
    });
  } catch (error) {
    sendJsonResult(res, publicErrorData(error));
  }
});

/**
 * @operation get_admin_problem_stream
 * @tag Problems
 * @summary Get one page of an Admin Panel / Problems event stream
 *
 * @description One page of a stream's rows, newest first (the `api` usage
 * stream sorts by count): `security` (Security Report), `speed`, `tests`,
 * `cpu`, `database` (restarts, storage and disk-space findings, indexes
 * created), `integrity` and `api`. Each row is a SUMMARY that accumulates -
 * `count`, `firstAt`..`at`, `actors` - never a row per event. Only the global
 * admin can call this.
 *
 * @param {string} stream the stream name: security, speed, tests, cpu, database, integrity or api
 * @param {number} [limit] rows per page, 1..200 (default 50)
 * @param {number} [skip] rows to skip (default 0)
 * @param {string} [search] case-insensitive text to filter the rows by
 * @return_type {stream: string, total: number, limit: number, skip: number, rows: [object]}
 */
WebApp.handlers.get('/api/admin/problems/:stream', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const stream = String(req.params.stream || '');
    if (!EVENT_STREAMS.includes(stream) && stream !== 'api') {
      sendJsonResult(res, { code: 404, data: { error: 'Unknown event stream' } });
      return;
    }
    const query = req.query || {};
    const limit = clampInt(query.limit, 50, 1, 200);
    const skip = clampInt(query.skip, 0, 0, Number.MAX_SAFE_INTEGER);
    const search = typeof query.search === 'string' && query.search ? query.search : undefined;
    const total = await callAsUser(req.userId, 'eventLogCount', stream, search);
    const rows = await callAsUser(req.userId, 'eventLogPage', stream, limit, skip, search);
    sendJsonResult(res, { code: 200, data: { stream, total, limit, skip, rows } });
  } catch (error) {
    sendJsonResult(res, publicErrorData(error));
  }
});

/**
 * @operation acknowledge_admin_problem_stream
 * @tag Problems
 * @summary Acknowledge the new problems of an event stream
 *
 * @description Marks everything currently in the stream as seen, the way the
 * Admin Panel's acknowledge button does, so `get_admin_problems` reports zero
 * new problems for it until the next one is recorded. Only the global admin
 * can call this.
 *
 * @param {string} stream the stream name: security, speed, tests, cpu, database or integrity
 * @return_type {acknowledged: string}
 */
WebApp.handlers.post('/api/admin/problems/:stream/acknowledge', async function(req, res) {
  try {
    await Authentication.checkUserId(req.userId);
    const stream = String(req.params.stream || '');
    if (!EVENT_STREAMS.includes(stream)) {
      sendJsonResult(res, { code: 404, data: { error: 'Unknown event stream' } });
      return;
    }
    await callAsUser(req.userId, 'acknowledgeEventLog', stream);
    sendJsonResult(res, { code: 200, data: { acknowledged: stream } });
  } catch (error) {
    sendJsonResult(res, publicErrorData(error));
  }
});
