// Board import runs (server/lib/importRuns.js): the record each import writes
// before its first write, the scan that flags the ones that stopped, and the
// Admin Panel -> Problems -> Recovery methods that keep or discard them.
// Instance administrators only, checked before and after every read and write.
import { Meteor } from 'meteor/meteor';
import { Mongo, MongoInternals } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import Boards from '/models/boards';
import RecoveryEvents from '/models/recoveryEvents';
import { SyncedCron } from '/server/cron/syncedCron';
import { ensureIndex } from '/server/lib/mongoStartup';
import { recordRecoveryAudit } from '/server/lib/recoveryAudit';

const runsLib = require('/server/lib/importRuns');

// Private: never published, never written by a client.
export const ImportRuns = new Mongo.Collection('importRuns');
ImportRuns.deny({ insert: () => true, update: () => true, remove: () => true });

const REFUSALS = ['missing', 'not-interrupted', 'foreign-board', 'scrum-busy', 'invalid'];
const RunId = Match.Where(value => typeof value === 'string' && runsLib.RUN_ID.test(value));

function staleMs() {
  const ms = parseInt(process.env.WEKAN_IMPORT_RUN_STALE_MS, 10);
  return Number.isFinite(ms) && ms >= 60000 ? ms : runsLib.DEFAULT_STALE_MS;
}
const db = () => MongoInternals.defaultRemoteCollectionDriver().mongo.db;

// Called by models/import.js around creator.create(). Fails closed: an import
// whose run cannot be recorded does not start.
export function trackImport({ userId, source, creator, execute }) {
  const name = String(source || 'unknown').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/^[^a-z]+/, '')
    .slice(0, 32) || 'unknown';
  return runsLib.trackImport({ runs: ImportRuns.rawCollection(), boards: Boards.rawCollection(),
    userId, source: name, creator, execute });
}

// Flag stopped runs; one Recovery event per run, written by whichever server
// flagged it.
export async function scanImportRuns() {
  const flagged = await runsLib.scanRuns({ runs: ImportRuns.rawCollection(), staleMs: staleMs() });
  for (const run of flagged) {
    try {
      const described = await runsLib.describeBoard({ db: db(), boardId: run.boardId });
      const user = run.userId ? await Meteor.users.findOneAsync(run.userId, { fields: { username: 1 } }) : null;
      await RecoveryEvents.record(RecoveryEvents.types.IMPORT_INTERRUPTED, {
        detail: runsLib.describeInterruption(run, described), severity: 'warning', source: 'server', done: false,
        userId: run.userId || undefined, username: user?.username || undefined,
        boardIds: described.board ? [run.boardId] : undefined,
        boardTitles: described.board ? [String(described.board.title || '(unknown title)')] : undefined,
      });
    } catch (e) { /* the run stays flagged and listed; the event is evidence only */ }
  }
  return flagged.length;
}

async function assertAdmin(userId) {
  const user = userId && await Meteor.users.findOneAsync(userId, { fields: { isAdmin: 1, loginDisabled: 1, username: 1 } });
  if (!user?.isAdmin || user.loginDisabled) throw new Meteor.Error('not-authorized');
  return user;
}
// Known refusals keep their reason so the page can say why; anything else is
// reported without its text.
function translate(error) {
  if (error?.error === 'not-authorized') return error;
  if (REFUSALS.includes(error?.reason) && error.message === `import-run-${error.reason}`) {
    return new Meteor.Error(`import-run-${error.reason}`);
  }
  return new Meteor.Error('import-run-failed');
}

Meteor.methods({
  async importRunsInterrupted() {
    await assertAdmin(this.userId);
    let result;
    try { result = await runsLib.listInterruptedRuns({ db: db() }); } catch (error) { throw translate(error); }
    await assertAdmin(this.userId);
    return result;
  },
  async importRunDiscard({ runId } = {}) {
    check(runId, RunId);
    const admin = await assertAdmin(this.userId);
    const operator = admin.username || admin._id;
    let result, board;
    try {
      const run = await ImportRuns.rawCollection().findOne({ _id: runId }, { projection: { boardId: 1 } });
      board = run ? await Boards.findOneAsync(run.boardId, { fields: { title: 1 } }) : null;
      result = await runsLib.discardRun({ db: db(), runId, operator,
        // The application's own board removal: its hooks remove the card
        // tree, the attachments with their files (the one hard delete of
        // attachments, server/models/boards.js) and the Scrum stores, as a
        // permanent delete does.
        removeBoard: async boardId => { await assertAdmin(this.userId); await Boards.removeAsync(boardId); } });
    } catch (error) {
      if (error?.reason === 'not-interrupted' || error?.reason === 'missing' || error?.reason === 'invalid') throw translate(error);
      await recordRecoveryAudit({ type: RecoveryEvents.types.IMPORT_DISCARDED, user: admin, connection: this.connection,
        done: false, boards: board ? [{ _id: board._id, title: board.title }] : [],
        detail: `Admin ${operator} (${admin._id}) could not discard the interrupted board import ${runId}: ` +
          `${error?.reason || 'failed'}.` });
      throw translate(error);
    }
    // One audit row per decision; a retry that only finished the removal adds none.
    if (result.decidedNow) {
      const removed = Object.entries(result.removed).map(([name, count]) => `${count} ${name}`).join(', ') || 'nothing';
      await recordRecoveryAudit({ type: RecoveryEvents.types.IMPORT_DISCARDED, user: admin, connection: this.connection,
        done: true, deletedData: true, boards: board ? [{ _id: board._id, title: board.title }] : [],
        detail: `Admin ${operator} (${admin._id}) discarded the interrupted board import ${runId}: removed ${removed} ` +
          `of board ${result.boardId}.` + (result.attachmentsLeft ? ` ${result.attachmentsLeft} attachment records ` +
          'of that board id remain, as attachments are removed only with their board.' : '') });
    }
    return result;
  },
  async importRunKeep({ runId } = {}) {
    check(runId, RunId);
    const admin = await assertAdmin(this.userId);
    const operator = admin.username || admin._id;
    let result;
    try { result = await runsLib.keepRun({ db: db(), runId, operator }); } catch (error) { throw translate(error); }
    if (result.decidedNow) {
      const board = await Boards.findOneAsync(result.boardId, { fields: { title: 1 } });
      await recordRecoveryAudit({ type: RecoveryEvents.types.IMPORT_KEPT, user: admin, connection: this.connection,
        done: true, boards: board ? [{ _id: board._id, title: board.title }] : [],
        detail: `Admin ${operator} (${admin._id}) kept the partial board ${result.boardId} of the interrupted ` +
          `board import ${runId} as it is.` + (result.scrumPending ? ` Its Scrum stage checkpoint (${result.scrumPending}) ` +
          'remains for the board\'s Scrum import recovery.' : '') });
    }
    return result;
  },
});

for (const name of ['importRunsInterrupted', 'importRunDiscard', 'importRunKeep']) {
  DDPRateLimiter.addRule({ type: 'method', name, connectionId: () => true }, 10, 10000);
}

Meteor.startup(async () => {
  try {
    await ensureIndex(ImportRuns, { state: 1, touchedAt: 1 });
    await ensureIndex(ImportRuns, { state: 1, interruptedAt: 1 });
    await ensureIndex(ImportRuns, { boardId: 1, state: 1 });
    // A restart is when a run's writer most often disappears: look once now,
    // then every few minutes for runs whose heartbeat stopped elsewhere.
    Meteor.defer(() => { scanImportRuns().catch(() => {}); });
    SyncedCron.add({
      name: 'wekan-import-run-scan',
      schedule(parser) { return parser.text('every 5 minutes'); },
      async job() {
        try { return await scanImportRuns(); }
        catch (_) { console.error('importRuns: scan failed; retrying on the next pass.'); return { failed: true }; }
      },
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('importRuns: startup failed', e && e.message);
  }
});
