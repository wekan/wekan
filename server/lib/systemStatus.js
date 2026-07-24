import RecoveryStatus from '/models/recoveryStatus';
import AttachmentMigrationStatus from '/models/attachmentMigrationStatus';
import TextMigrationStatus from '/models/textMigrationStatus';
import Cards from '/models/cards';
import { loginProblemChecks } from '/models/lib/loginProblems';
import { buildProblemsOverview } from '/models/lib/problemsOverview';
import { brokenCardsSelector } from '/models/lib/brokenCardsRepair';
import { isStatusActive } from '/models/lib/statusActive';

// Server hub for the Admin Panel / Problems "Status" overview and the
// `snap run wekan.problems` command. It PERSISTS the text-migration and
// board-repair progress (so a separate process can see "a migration/repair is in
// progress") and AGGREGATES every in-progress migration/repair plus the detected
// problems into one overview.

const TEXT_MIGRATION_ID = 'text-migration';
const BOARD_REPAIR_ID = 'board-repair';
const REPAIR_MARKER_ID = 'startup-repair-version';

async function upsertStatusDoc(id, fields) {
  try {
    await TextMigrationStatus.upsertAsync(
      { _id: id },
      { $set: { ...fields, _id: id, updatedAt: new Date() } },
    );
  } catch (error) {
    console.error('[systemStatus] persist', id, error);
  }
}

// Persist the MongoDB <-> SQLite text-migration progress snapshot.
export async function setTextMigrationStatus(fields) {
  await upsertStatusDoc(TEXT_MIGRATION_ID, fields);
}

// Persist the server-side board data-repair progress snapshot.
export async function setBoardRepairStatus(fields) {
  await upsertStatusDoc(BOARD_REPAIR_ID, fields);
}

// Version marker so the startup board-repair pass runs once per version, not on
// every boot (a full scan is expensive). Board open still repairs per board.
export async function getRepairMarkerVersion() {
  const doc = await TextMigrationStatus.findOneAsync({ _id: REPAIR_MARKER_ID });
  return doc && Number.isFinite(doc.version) ? doc.version : 0;
}
export async function setRepairMarkerVersion(version, summary) {
  await upsertStatusDoc(REPAIR_MARKER_ID, { version, summary: summary || null });
}

function describeTextMigration(tm) {
  let where = '';
  if (tm.phase === 'migrating') {
    where = `: ${tm.collection || ''} (${tm.collectionsDone || 0}/${tm.collectionsTotal || 0} collections)`;
  } else if (tm.phase === 'repairing') {
    where = `: repairing ${tm.boardsDone || 0}/${tm.boardsTotal || 0} boards`;
  }
  return `Database migration (${tm.direction || '?'}) — ${tm.phase || 'running'}${where}`;
}

// Everything currently in progress, as [{ kind, active, message }].
export async function getInProgress() {
  const items = [];

  // #6520: use isStatusActive, not the raw `running` flag, so a stale
  // running:true (a completion write that lost a race with a late progress write,
  // or a process killed mid-run) does not show the migration/repair "in progress"
  // forever — e.g. "Board data-repair — 146/146 boards" that never clears.
  const tm = await TextMigrationStatus.findOneAsync({ _id: TEXT_MIGRATION_ID });
  if (isStatusActive(tm)) {
    items.push({ kind: 'database-migration', active: true, message: describeTextMigration(tm) });
  }

  const br = await TextMigrationStatus.findOneAsync({ _id: BOARD_REPAIR_ID });
  if (isStatusActive(br)) {
    items.push({
      kind: 'board-repair',
      active: true,
      message: `Board data-repair — ${br.boardsDone || 0}/${br.boardsTotal || 0} boards`,
    });
  }

  try {
    const rec = await RecoveryStatus.findOneAsync({});
    if (rec && rec.active) {
      items.push({ kind: 'recovery', active: true, message: rec.message || 'Data recovery / maintenance in progress' });
    }
  } catch (_) {}

  // The cron-driven migration subsystem that wrote `cronJobStatus` docs is gone (it
  // never ran and had no UI), so this no longer looks there. Leaving the check in
  // would have been worse than useless: a leftover status:'running' doc from an older
  // version has nothing to clear it now, so Problems would show "Migration job X
  // running" forever.

  try {
    const att = await AttachmentMigrationStatus.findOneAsync({ $or: [{ running: true }, { status: 'running' }] });
    if (att) {
      items.push({ kind: 'attachment-migration', active: true, message: att.message || 'Attachment migration / repair in progress' });
    }
  } catch (_) {}

  return items;
}

// The login-page "Must be logged in" cause checklist (detected values).
export async function getLoginProblems() {
  const inProgress = await getInProgress();
  return loginProblemChecks({
    migrationActive: inProgress.length > 0,
    migrationMessage: inProgress.map(x => x.message).join('; '),
    rootUrl: process.env.ROOT_URL || '',
    ldapEnabled: process.env.LDAP_ENABLE === 'true' || process.env.LDAP_ENABLE === true,
    sandstorm: !!(process.env.SANDSTORM || process.env.SANDSTORM_SMTP_SEND),
  });
}

// What counts as broken lives in models/lib/brokenCardsRepair.js, shared with
// the Repair button on the Summary page, so the count and the repair can never
// disagree about which cards they mean.
async function countBrokenCards() {
  try {
    return await Cards.find(brokenCardsSelector()).countAsync();
  } catch (_) {
    return 0;
  }
}

// The Problems "Status" overview: everything in progress + detected problems.
export async function getProblemsOverview() {
  const [inProgress, loginProblems, brokenCards] = await Promise.all([
    getInProgress(),
    getLoginProblems(),
    countBrokenCards(),
  ]);
  return buildProblemsOverview({ inProgress, loginProblems, brokenCards });
}
