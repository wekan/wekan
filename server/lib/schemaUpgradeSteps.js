// ============================================================================
// Startup schema upgrade (#6473 follow-up): bring TEXT DATA from EVERY old
// WeKan version to the newest database structure — on all platforms (Snap,
// Docker, Sandstorm, source) and regardless of database (MongoDB or
// FerretDB/SQLite, both speak the same wire protocol via the driver `Db`
// handle this module receives).
//
// WeKan v0.9–v8.00 ran `Migrations.add(...)` steps at startup; v8.01 disabled
// them (large databases caused long downtime) in favour of read-time
// compatibility — which covers the swimlane era but NOT everything. Data that
// jumped straight from an old version (or an old backup/Sandstorm grain) to
// current WeKan can still hold pre-migration shapes that today's code simply
// does not show: the text is in the database, but invisible.
//
// This module reinstates the safety net WITHOUT the downtime problem:
//  - VERSION-GATED: the `_wekan_migration` marker stores the WeKan version and
//    datetime of the last successful re-check. While the version is unchanged,
//    a boot costs ONE findOne — the re-check is mandatory only after a new
//    WeKan release (or WEKAN_FORCE_SCHEMA_UPGRADE=true).
//  - After a version change it RE-CHECKS everything and migrates ONLY what is
//    missing, using the fastest available query shapes for big databases
//    (thousands of cards): bounded findOne/countDocuments existence probes,
//    distinct() joins instead of full scans, and server-side updateMany
//    batches instead of per-document round trips.
//  - Every step is idempotent, so an interrupted boot resumes safely, and a
//    step failure never blocks WeKan from starting.
//  - Progress is published (getUpgradeState) for the migration dashboard,
//    which shows the Admin Panel product name when one is set.
//
// Steps (each replicates a v8.00 `server/migrations.js` step that has no
// replacement in current WeKan, verified against `git show v8.00:server/migrations.js`):
//   archived-flag-backfill   old docs missing `archived` never match the
//                            archived:false view queries -> invisible
//   swimlane-structure       add-swimlanes (v0.65) + dangling-listId rescue +
//                            #1959/#1971 Swimlanes-view visibility rescue
//                            (cards under deleted/archived/foreign swimlanes)
//   checklist-items-embedded add-checklist-items (v0.79): embedded
//                            checklist.items[] -> ChecklistItems collection
//   customfields-boardIds    mutate-boardIds-in-customfields (v2.49):
//                            scalar boardId -> boardIds array
//   board-allows-defaults    the add-*-allowed steps (v2.9–v5.43): missing
//                            allows* flags render as undefined=false and HIDE
//                            existing description/checklist/comment text
//   board-members-isactive   add-member-isactive-field: members without
//                            isActive are denied board access by
//                            isActiveMember()
//   board-permission-lowercase lowercase-board-permission: 'PUBLIC' boards
//                            silently became member-only
//   nonfinite-sort-repair    ±Infinity/NaN `sort` values (pre-#6472) break card
//                            ordering (board stuck on the spinner) and are
//                            rejected by FerretDB ("infinity values are not
//                            allowed"), aborting MongoDB->FerretDB migration ->
//                            reset to a finite 0
//   fs-path-heal             filesystem attachments/avatars whose recorded
//                            path predates the current WRITABLE_PATH layout
//                            (v6.10-18 uploads/<coll>, v6.19-v8.4x
//                            WRITABLE_PATH/<coll>, CFS->ostrio temp files):
//                            locate the binary and repoint/copy it
//
// Pure, dependency-free (no Meteor imports) so it can be unit tested with
// plain Node against a driver-compatible Db object. The Meteor wrapper (and
// the /schema-upgrade-status dashboard) is server/startupSchemaUpgrade.js.
// ============================================================================

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { computeStoragePaths } = require('../../models/lib/attachmentStoragePath');

const MARKER_COLL = '_wekan_migration';
const MARKER_ID = 'schema-upgrade';

// Meteor-style random document ids (Random.id(): 17 chars, unmistakable set),
// so upgraded documents look exactly like app-created ones.
const ID_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
function randomId(len = 17) {
  // Rejection sampling: 256 is not a multiple of ID_CHARS.length (55), so a
  // plain `byte % 55` skews toward the first characters (CodeQL
  // js/biased-cryptographic-random). Accept only bytes below the largest
  // multiple of the alphabet size and resample the rest.
  const limit = 256 - (256 % ID_CHARS.length);
  let out = '';
  while (out.length < len) {
    const bytes = crypto.randomBytes(len - out.length);
    for (let i = 0; i < bytes.length && out.length < len; i++) {
      if (bytes[i] < limit) out += ID_CHARS[bytes[i] % ID_CHARS.length];
    }
  }
  return out;
}

// ── live progress state for the migration dashboard ─────────────────────────
const upgradeState = {
  running: false,
  product: 'WeKan',        // Admin Panel product name when set
  appVersion: '',
  startedAt: null,
  finishedAt: null,
  currentStep: '',
  gated: false,            // true = skipped because the version was unchanged
  steps: {},               // name -> {status: pending|checking|running|done|skipped|error, fixed, unresolved, error}
  lastCheck: null,         // {version, at} of the previous successful re-check
};
function getUpgradeState() { return upgradeState; }
function resetState(appVersion) {
  upgradeState.running = true;
  upgradeState.product = 'WeKan';
  upgradeState.appVersion = appVersion || '';
  upgradeState.startedAt = new Date();
  upgradeState.finishedAt = null;
  upgradeState.currentStep = '';
  upgradeState.gated = false;
  upgradeState.steps = {};
  for (const s of steps) upgradeState.steps[s.name] = { status: 'pending', fixed: 0, unresolved: 0 };
}

// Board feature flags with schema defaultValue: true. SimpleSchema applies
// defaults ON INSERT ONLY, and the templates do raw property access — a board
// created before the flag existed reads `undefined`, which renders as FALSE
// and hides existing text (descriptions, checklists, comments, attachments).
// Kept in sync with models/boards.js by tests/schemaUpgradeSteps.test.cjs.
const BOARD_ALLOWS_TRUE_DEFAULTS = [
  'allowsSubtasks', 'allowsSubtasksOnMinicard',
  'allowsAttachments', 'allowsAttachmentsOnMinicard',
  'allowsChecklists', 'allowsChecklistsOnMinicard',
  'allowsComments',
  'allowsDescriptionTitle', 'allowsDescriptionTitleOnMinicard',
  'allowsDescriptionText',
  'allowsCoverAttachmentOnMinicard',
  'allowsActivities',
  'allowsLabels', 'allowsLabelsOnMinicard',
  'allowsCreator',
  'allowsAssignee', 'allowsAssigneeOnMinicard',
  'allowsMembers', 'allowsMembersOnMinicard',
  'allowsRequestedBy', 'allowsRequestedByOnMinicard',
  'allowsCardSortingByNumber',
  'allowsShowLists',
  'allowsAssignedBy', 'allowsAssignedByOnMinicard',
  'allowsReceivedDate', 'allowsReceivedDateOnMinicard',
  'allowsStartDate', 'allowsStartDateOnMinicard',
  'allowsEndDate', 'allowsEndDateOnMinicard',
  'allowsDueDate', 'allowsDueDateOnMinicard',
];

const MISSING_OR_EMPTY = { $in: [null, ''] };   // matches missing, null and ''

// #6481: match documents whose numeric `sort` is non-finite (+Infinity,
// -Infinity or NaN). A finite double satisfies BOTH bounds; +Inf fails $lte,
// -Inf fails $gte and NaN fails both, so the $nor selects exactly the non-finite
// numeric sorts. Crucially the predicate uses only FINITE literals
// (Number.MAX_VALUE), because FerretDB rejects Infinity/NaN even inside a query
// filter — so this is safe to run against FerretDB/SQLite as well as MongoDB.
const MAX_FINITE = 1.7976931348623157e308; // Number.MAX_VALUE
const NON_FINITE_SORT = {
  sort: { $type: 'number' },
  $nor: [{ sort: { $gte: -MAX_FINITE, $lte: MAX_FINITE } }],
};
// Collections that carry a numeric `sort` used for ordering.
const SORTED_COLLECTIONS = ['cards', 'lists', 'swimlanes', 'checklists', 'checklistItems'];

// ── individual steps ─────────────────────────────────────────────────────────
// Each step: { name, check(db,ctx) -> boolean (work exists),
//              run(db,ctx) -> {fixed, unresolved} } — all idempotent, and all
// using bounded/batched queries so big databases stay fast.

const steps = [
  {
    // Old (LibreBoard-era) documents can lack the `archived` field entirely —
    // and every board/list/card query in current WeKan filters with
    // `archived: false`, which a MISSING field does not match. Such boards,
    // swimlanes, lists and cards are invisible in BOTH the Swimlanes view and
    // the Lists view although their data is intact. One updateMany per
    // collection backfills the default. Must run FIRST: the visibility rescue
    // below relies on `archived: false` matching.
    name: 'archived-flag-backfill',
    async check(db) {
      for (const coll of ['boards', 'swimlanes', 'lists', 'cards']) {
        if (await db.collection(coll).findOne({ archived: { $exists: false } }, { projection: { _id: 1 } })) return true;
      }
      return false;
    },
    async run(db) {
      let fixed = 0;
      for (const coll of ['boards', 'swimlanes', 'lists', 'cards']) {
        const r = await db.collection(coll).updateMany(
          { archived: { $exists: false } },
          { $set: { archived: false } },
        );
        fixed += (r && r.modifiedCount) || 0;
      }
      return { fixed, unresolved: 0 };
    },
  },

  {
    // add-swimlanes (v0.65) + the dangling-listId rescue that the disabled
    // repair tools used to provide, PLUS the Swimlanes-view visibility rescue
    // of #1959/#1971: every board gets a swimlane, every list/card gets a
    // swimlaneId, cards whose listId points nowhere are rescued to a visible
    // list, and unarchived cards whose swimlaneId points at a DELETED,
    // ARCHIVED or other-board swimlane (invisible in Swimlanes view) are
    // reassigned to the board's first visible swimlane — so all lists and
    // cards are visible in both the Swimlanes view and the Lists view.
    name: 'swimlane-structure',
    async check(db) {
      // bounded existence probes — no scans. NOTE: lists with EMPTY swimlaneId
      // are deliberately NOT backfilled — a shared board-wide list ('') renders
      // in every swimlane via myLists()'s null/'' fallback, and stamping it to
      // one swimlane would HIDE it from all other swimlanes in Swimlanes view.
      if (await db.collection('cards').findOne({ swimlaneId: MISSING_OR_EMPTY }, { projection: { _id: 1 } })) return true;
      // set-joins via distinct(): result sizes are bounded by the number of
      // lists/swimlanes/boards, never by the number of cards
      const boardIds = (await db.collection('boards').distinct('_id')).map(String);
      const swimlaneBoards = new Set((await db.collection('swimlanes').distinct('boardId')).map(String));
      if (boardIds.some(b => !swimlaneBoards.has(b))) return true;
      const listIds = new Set((await db.collection('lists').distinct('_id')).map(String));
      const usedListIds = (await db.collection('cards').distinct('listId')).map(String);
      if (usedListIds.some(id => id && id !== 'null' && id !== 'undefined' && !listIds.has(id))) return true;
      // #1959/#1971: any unarchived card under a deleted/archived/foreign swimlane?
      const visibleSwimlaneOfBoard = await loadVisibleSwimlanes(db);
      const usedSwimlaneIds = (await db.collection('cards').distinct('swimlaneId', { archived: false })).map(String);
      for (const swId of usedSwimlaneIds) {
        if (!swId || swId === 'null' || swId === 'undefined') continue;
        const owner = visibleSwimlaneOfBoard.byId.get(swId);
        if (!owner) return true;   // deleted or archived swimlane
        // same-board check needs the referencing boards (bounded by board count)
        const boards = (await db.collection('cards').distinct('boardId', { swimlaneId: swId, archived: false })).map(String);
        if (boards.some(b => b !== owner)) return true;   // foreign swimlane
      }
      return false;
    },
    async run(db) {
      let fixed = 0;
      const now = new Date();
      // a VISIBLE (unarchived, non-template) default swimlane per board —
      // boards and swimlanes are few. #1959: assigning to any first swimlane
      // could pick an archived one, and the card stayed invisible.
      const boards = await db.collection('boards').find({}, { projection: { _id: 1 } }).toArray();
      let visible = await loadVisibleSwimlanes(db);
      const defaultSwimlaneOf = new Map(visible.firstOfBoard);
      for (const b of boards) {
        const boardId = String(b._id);
        if (!defaultSwimlaneOf.has(boardId)) {
          const sw = { _id: randomId(), title: 'Default', boardId, archived: false, sort: 0, type: 'swimlane', createdAt: now, modifiedAt: now, updatedAt: now };
          await db.collection('swimlanes').insertOne(sw);
          defaultSwimlaneOf.set(boardId, String(sw._id));
          visible.byId.set(String(sw._id), boardId);
          fixed++;
        }
      }
      // missing swimlaneId on CARDS: ONE server-side updateMany per board — no
      // per-document round trips, no matter how many thousands of cards.
      // Lists are NOT stamped (see check() note: '' means shared across swimlanes).
      for (const [boardId, swId] of defaultSwimlaneOf) {
        const r = await db.collection('cards').updateMany(
          { boardId, swimlaneId: MISSING_OR_EMPTY },
          { $set: { swimlaneId: swId } },
        );
        fixed += (r && r.modifiedCount) || 0;
      }
      // dangling listId rescue: distinct() finds the bad ids (bounded by the
      // number of lists ever referenced), then one updateMany per (bad id, board)
      const lists = await db.collection('lists').find({}, { projection: { _id: 1, boardId: 1, swimlaneId: 1, sort: 1 } }).toArray();
      const listIds = new Set(lists.map(l => String(l._id)));
      const firstListOf = new Map();
      for (const l of lists.sort((a, b2) => (a.sort || 0) - (b2.sort || 0))) {
        if (!firstListOf.has(String(l.boardId))) firstListOf.set(String(l.boardId), l);
      }
      const rescuedListOf = new Map();
      const badListIds = (await db.collection('cards').distinct('listId'))
        .map(String).filter(id => id && id !== 'null' && id !== 'undefined' && !listIds.has(id));
      for (const badId of badListIds) {
        const boardsOfBad = (await db.collection('cards').distinct('boardId', { listId: badId })).map(String);
        for (const boardId of boardsOfBad) {
          let target = firstListOf.get(boardId) || rescuedListOf.get(boardId);
          if (!target) {
            target = { _id: randomId(), title: 'Rescued Data', boardId, swimlaneId: defaultSwimlaneOf.get(boardId) || '', archived: false, sort: 0, type: 'list', createdAt: now, modifiedAt: now, updatedAt: now };
            await db.collection('lists').insertOne(target);
            rescuedListOf.set(boardId, target);
          }
          const r = await db.collection('cards').updateMany(
            { boardId, listId: badId },
            { $set: { listId: String(target._id), swimlaneId: String(target.swimlaneId || defaultSwimlaneOf.get(boardId) || '') } },
          );
          fixed += (r && r.modifiedCount) || 0;
        }
      }
      // #1959/#1971: unarchived cards whose swimlaneId points at a DELETED,
      // ARCHIVED or other-board swimlane never render in the Swimlanes view.
      // distinct() bounds the work by the number of referenced swimlanes; the
      // fix is one updateMany per (bad swimlane, board).
      const usedSwimlaneIds = (await db.collection('cards').distinct('swimlaneId', { archived: false })).map(String);
      for (const swId of usedSwimlaneIds) {
        if (!swId || swId === 'null' || swId === 'undefined') continue;
        const owner = visible.byId.get(swId);
        const boardsOfSw = (await db.collection('cards').distinct('boardId', { swimlaneId: swId, archived: false })).map(String);
        for (const boardId of boardsOfSw) {
          if (owner === boardId) continue;   // visible swimlane on the right board
          const target = defaultSwimlaneOf.get(boardId);
          if (!target || target === swId) continue;
          const r = await db.collection('cards').updateMany(
            { boardId, swimlaneId: swId, archived: false },
            { $set: { swimlaneId: target } },
          );
          fixed += (r && r.modifiedCount) || 0;
        }
      }
      return { fixed, unresolved: 0 };
    },
  },

  {
    // v7.98 'per-swimlane lists' era: the migrate-lists-to-per-swimlane step
    // stamped every list to the default swimlane (hiding it from every other
    // swimlane in today's Swimlanes view), and the v8.07–v8.19 board-open
    // repair DUPLICATED lists per swimlane (rendering duplicate columns per
    // title in today's board-wide Lists view). Current WeKan renders shared
    // lists (swimlaneId '') in every swimlane, so: merge same-title copies
    // back into ONE shared list — cards keep their own swimlaneId, preserving
    // per-swimlane grouping and order, and card/list drag between swimlanes
    // keeps working — then clear the stamped swimlaneIds. Copies the user
    // RENAMED differently per swimlane are deliberately kept as their own
    // lists (merging them would lose the distinct names). Boards are detected
    // by the era's own markers (fixMissingListsCompleted /
    // comprehensiveMigrationCompleted), duplicate titles, or a list whose
    // cards disagree with its stamped swimlane; healthy boards are untouched.
    name: 'merge-per-swimlane-lists',
    async check(db) {
      if (await db.collection('boards').findOne(
        { $or: [{ fixMissingListsCompleted: true }, { comprehensiveMigrationCompleted: true }] },
        { projection: { _id: 1 } },
      )) return true;
      const boardIds = (await db.collection('lists').distinct('boardId', { swimlaneId: { $nin: [null, ''] }, type: { $ne: 'template-list' } })).map(String);
      for (const boardId of boardIds) {
        const lists = await db.collection('lists').find(
          { boardId, type: { $ne: 'template-list' } },
          { projection: { title: 1, swimlaneId: 1, archived: 1 } },
        ).toArray();
        const seen = new Set();
        for (const l of lists) {
          if (l.archived === true) continue;
          if (seen.has(l.title)) return true;   // per-swimlane duplicate copies
          seen.add(l.title);
        }
        for (const l of lists) {
          if (!l.swimlaneId) continue;
          // Shape A (v7.98 stamp): cards of another swimlane point at this list
          if (await db.collection('cards').findOne(
            { listId: String(l._id), swimlaneId: { $nin: [String(l.swimlaneId), null, ''] } },
            { projection: { _id: 1 } },
          )) return true;
        }
      }
      return false;
    },
    async run(db) {
      let fixed = 0;
      const markerBoards = (await db.collection('boards').find(
        { $or: [{ fixMissingListsCompleted: true }, { comprehensiveMigrationCompleted: true }] },
        { projection: { _id: 1 } },
      ).toArray()).map(b => String(b._id));
      const stampedBoards = (await db.collection('lists').distinct('boardId', { swimlaneId: { $nin: [null, ''] }, type: { $ne: 'template-list' } })).map(String);
      for (const boardId of new Set([...markerBoards, ...stampedBoards])) {
        const lists = await db.collection('lists').find(
          { boardId, type: { $ne: 'template-list' } },
          { projection: { title: 1, swimlaneId: 1, archived: 1, sort: 1, createdAt: 1 } },
        ).toArray();
        // Only act on boards that actually show an era symptom (duplicate titles
        // or a card/list swimlane mismatch or the marker) — a healthy natively
        // per-swimlane board is left exactly as it is.
        const unarchived = lists.filter(l => l.archived !== true);
        const titleCount = new Map();
        for (const l of unarchived) titleCount.set(l.title, (titleCount.get(l.title) || 0) + 1);
        let mismatch = false;
        if (!markerBoards.includes(boardId) && ![...titleCount.values()].some(n => n > 1)) {
          for (const l of unarchived) {
            if (!l.swimlaneId) continue;
            if (await db.collection('cards').findOne(
              { listId: String(l._id), swimlaneId: { $nin: [String(l.swimlaneId), null, ''] } },
              { projection: { _id: 1 } },
            )) { mismatch = true; break; }
          }
          if (!mismatch) continue;
        }
        // merge same-title unarchived copies into one canonical shared list
        const groups = new Map();
        for (const l of unarchived) {
          const g = groups.get(l.title) || [];
          g.push(l);
          groups.set(l.title, g);
        }
        for (const group of groups.values()) {
          if (group.length < 2) continue;
          group.sort((a, b) =>
            ((a.swimlaneId ? 1 : 0) - (b.swimlaneId ? 1 : 0)) ||
            ((a.createdAt || 0) - (b.createdAt || 0)) ||
            ((a.sort || 0) - (b.sort || 0)));
          const canonical = group[0];
          for (const m of group.slice(1)) {
            // cards KEEP their swimlaneId — only the column pointer moves
            await db.collection('cards').updateMany({ listId: String(m._id) }, { $set: { listId: String(canonical._id) } });
            try { await db.collection('activities').updateMany({ listId: String(m._id) }, { $set: { listId: String(canonical._id) } }); } catch { /* history relink is best-effort */ }
            await db.collection('lists').deleteOne({ _id: m._id });
            fixed++;
          }
        }
        // shared lists render in EVERY swimlane via the '' fallback
        const r = await db.collection('lists').updateMany(
          { boardId, type: { $ne: 'template-list' }, swimlaneId: { $nin: [null, ''] } },
          { $set: { swimlaneId: '' } },
        );
        fixed += (r && r.modifiedCount) || 0;
        // drop the era markers so the on-demand repair tools are usable again
        await db.collection('boards').updateOne(
          { _id: boardId },
          { $unset: { fixMissingListsCompleted: 1, fixMissingListsCompletedAt: 1, comprehensiveMigrationCompleted: 1 } },
        );
      }
      return { fixed, unresolved: 0 };
    },
  },

  {
    // add-checklist-items (v0.79): before 2018 checklist items lived embedded
    // in checklist.items[]; current WeKan reads ONLY the ChecklistItems
    // collection, so embedded items are invisible although their text is in
    // the database. Extract them exactly like the original migration did,
    // then $unset the embedded array. The find is targeted ('items.0' exists),
    // so only affected checklists are ever read.
    name: 'checklist-items-embedded',
    async check(db) {
      return !!await db.collection('checklists').findOne({ 'items.0': { $exists: true } }, { projection: { _id: 1 } });
    },
    async run(db) {
      let fixed = 0;
      const now = new Date();
      const cursor = db.collection('checklists').find({ 'items.0': { $exists: true } });
      for await (const checklist of cursor) {
        const items = (checklist.items || []).slice().sort((a, b) => (a.sort || 0) - (b.sort || 0));
        // one query for already-extracted duplicates (interrupted-boot resume)
        const existing = await db.collection('checklistItems')
          .find({ checklistId: String(checklist._id) }, { projection: { title: 1, sort: 1, isFinished: 1 } }).toArray();
        const seen = new Set(existing.map(i => `${i.title}\u0000${i.sort}\u0000${!!i.isFinished}`));
        const docs = [];
        for (let index = 0; index < items.length; index++) {
          const item = items[index] || {};
          const doc = {
            _id: randomId(),
            title: item.title ? item.title : 'Checklist',
            sort: index,
            isFinished: !!item.isFinished,
            checklistId: String(checklist._id),
            cardId: String(checklist.cardId || ''),
            createdAt: now,
            modifiedAt: now,
          };
          if (seen.has(`${doc.title}\u0000${doc.sort}\u0000${doc.isFinished}`)) continue;
          docs.push(doc);
        }
        if (docs.length) {
          // batched insert — one round trip per checklist, not per item
          await db.collection('checklistItems').insertMany(docs, { ordered: false });
          fixed += docs.length;
        }
        await db.collection('checklists').updateOne({ _id: checklist._id }, { $unset: { items: 1 } });
      }
      await cursor.close();
      return { fixed, unresolved: 0 };
    },
  },

  {
    // mutate-boardIds-in-customfields (v2.49): custom field definitions used a
    // scalar boardId; everything in current WeKan queries the boardIds array,
    // so old definitions (names, dropdown texts) and their card values were
    // orphaned.
    name: 'customfields-boardIds',
    async check(db) {
      return !!await db.collection('customFields').findOne({ boardId: { $exists: true } }, { projection: { _id: 1 } });
    },
    async run(db) {
      let fixed = 0;
      const cursor = db.collection('customFields').find({ boardId: { $exists: true } });
      for await (const cf of cursor) {
        const update = { $unset: { boardId: '' } };
        if (!Array.isArray(cf.boardIds) || cf.boardIds.length === 0) {
          update.$set = { boardIds: [String(cf.boardId)] };
        }
        await db.collection('customFields').updateOne({ _id: cf._id }, update);
        fixed++;
      }
      await cursor.close();
      return { fixed, unresolved: 0 };
    },
  },

  {
    // The add-*-allowed steps (v2.9–v5.43): schema defaults fire on insert
    // only, and the card-details templates do raw property access — a missing
    // allows* flag hides existing description/checklist/comment/attachment
    // text even though it is all still in the database. Backfill the
    // defaultValue:true flags with server-side updateMany batches.
    name: 'board-allows-defaults',
    async check(db) {
      return !!await db.collection('boards').findOne(
        { $or: BOARD_ALLOWS_TRUE_DEFAULTS.map(f => ({ [f]: { $exists: false } })) },
        { projection: { _id: 1 } },
      );
    },
    async run(db) {
      let fixed = 0;
      for (const f of BOARD_ALLOWS_TRUE_DEFAULTS) {
        const r = await db.collection('boards').updateMany(
          { [f]: { $exists: false } },
          { $set: { [f]: true } },
        );
        fixed += (r && r.modifiedCount) || 0;
      }
      return { fixed, unresolved: 0 };
    },
  },

  {
    // add-member-isactive-field: members without isActive are treated as
    // INACTIVE by isActiveMember()/activeMembers — pre-2015 board members
    // were silently denied access. Explicit isActive:false is respected.
    // $elemMatch keeps the query server-side; if the backend rejects it we
    // fall back to a projection scan of boards (a small collection).
    name: 'board-members-isactive',
    async check(db, ctx) {
      try {
        return !!await db.collection('boards').findOne(
          { members: { $elemMatch: { isActive: { $exists: false } } } },
          { projection: { _id: 1 } },
        );
      } catch (e) {
        ctx.log(`board-members-isactive: $elemMatch probe unsupported (${e.message}); scanning boards`);
        const cursor = db.collection('boards').find({ 'members.0': { $exists: true } }, { projection: { members: 1 } });
        for await (const b of cursor) {
          if ((b.members || []).some(m => m && m.isActive === undefined)) { await cursor.close(); return true; }
        }
        return false;
      }
    },
    async run(db) {
      let fixed = 0;
      let cursor;
      try {
        cursor = db.collection('boards').find(
          { members: { $elemMatch: { isActive: { $exists: false } } } },
          { projection: { members: 1 } },
        );
        // touch the cursor so an unsupported operator throws HERE
        await cursor.hasNext?.();
      } catch {
        cursor = db.collection('boards').find({ 'members.0': { $exists: true } }, { projection: { members: 1 } });
      }
      for await (const b of cursor) {
        const members = b.members || [];
        if (!members.some(m => m && m.isActive === undefined)) continue;
        const patched = members.map(m => (m && m.isActive === undefined ? { ...m, isActive: true } : m));
        await db.collection('boards').updateOne({ _id: b._id }, { $set: { members: patched } });
        fixed++;
      }
      await cursor.close();
      return { fixed, unresolved: 0 };
    },
  },

  {
    // lowercase-board-permission: LibreBoard-era 'PUBLIC'/'PRIVATE' values —
    // current code compares permission === 'public', so an uppercase public
    // board silently became member-only.
    name: 'board-permission-lowercase',
    async check(db) {
      return !!await db.collection('boards').findOne(
        { permission: { $in: ['PUBLIC', 'PRIVATE', 'Public', 'Private'] } },
        { projection: { _id: 1 } },
      );
    },
    async run(db) {
      let fixed = 0;
      for (const [from, to] of [['PUBLIC', 'public'], ['Public', 'public'], ['PRIVATE', 'private'], ['Private', 'private']]) {
        const r = await db.collection('boards').updateMany({ permission: from }, { $set: { permission: to } });
        fixed += (r && r.modifiedCount) || 0;
      }
      return { fixed, unresolved: 0 };
    },
  },

  {
    // #6481: repair non-finite numeric `sort` values (±Infinity / NaN) written
    // by old WeKan versions before #6472 guarded the rule-move sort math
    // (Math.min/Math.max of an empty list returns ±Infinity). A corrupt sort
    // breaks client-side card ordering — a board can hang forever on the
    // loading spinner — and is REJECTED outright by FerretDB/SQLite ("invalid
    // value { sort: +Inf } (infinity values are not allowed)"), which aborted
    // MongoDB->FerretDB migrations part-way through the cards collection. Reset
    // every non-finite sort to 0: a valid, renderable value (ties break by _id,
    // and the user can re-sort). Idempotent and cheap once healed.
    name: 'nonfinite-sort-repair',
    async check(db) {
      for (const coll of SORTED_COLLECTIONS) {
        if (await db.collection(coll).findOne(NON_FINITE_SORT, { projection: { _id: 1 } })) return true;
      }
      return false;
    },
    async run(db) {
      let fixed = 0;
      for (const coll of SORTED_COLLECTIONS) {
        const r = await db.collection(coll).updateMany(NON_FINITE_SORT, { $set: { sort: 0 } });
        fixed += (r && r.modifiedCount) || 0;
      }
      return { fixed, unresolved: 0 };
    },
  },

  {
    // fs-path-heal: filesystem-stored attachments/avatars whose recorded path
    // predates the current layout. WeKan's historical fs locations/naming:
    //   v6.10-18  WRITABLE_PATH/uploads/<coll>/<name>       (Meteor-Files temp)
    //   v6.10     WRITABLE_PATH/<oldId>-<name>              (CFS->ostrio migration)
    //   v6.19-8.4x WRITABLE_PATH/<coll>/<id>[-original-...] (pre-/files layout)
    //   current   <files root>/<coll>/<id> or <id>_<name> or <id>-<version>-<name>
    // A record whose version.path no longer exists gets its binary located in
    // those places and copied/repointed into the current directory. Records
    // with NO storage flag and NO gridFsFileId (failed v6.10-18 GridFS copies)
    // are healed the same way. Marked done only when nothing is left broken,
    // so a temporarily-unmounted volume retries on the next boot.
    name: 'fs-path-heal',
    async check(db, ctx) {
      return (await findBrokenFsVersions(db, ctx, true)).length > 0;
    },
    async run(db, ctx) {
      const broken = await findBrokenFsVersions(db, ctx, false);
      let fixed = 0, unresolved = 0;
      for (const item of broken) {
        const healed = await healOne(db, ctx, item);
        if (healed) fixed++; else unresolved++;
      }
      return { fixed, unresolved };
    },
  },
];

// Visible swimlanes (not archived, not templates) — the ones the Swimlanes
// view actually renders. Swimlanes are few, so one projected fetch is cheap.
// byId: swimlaneId -> boardId; firstOfBoard: boardId -> swimlaneId (by sort).
async function loadVisibleSwimlanes(db) {
  const byId = new Map();
  const firstOfBoard = new Map();
  const all = await db.collection('swimlanes')
    .find({}, { projection: { _id: 1, boardId: 1, archived: 1, type: 1, sort: 1 } }).toArray();
  for (const s of all.sort((a, b) => (a.sort || 0) - (b.sort || 0))) {
    if (s.archived === true || s.type === 'template-swimlane') continue;
    byId.set(String(s._id), String(s.boardId));
    if (!firstOfBoard.has(String(s.boardId))) firstOfBoard.set(String(s.boardId), String(s._id));
  }
  return { byId, firstOfBoard };
}

// A version needs healing when it is (or defaults to) filesystem storage but
// its recorded path does not exist on disk.
function versionNeedsHeal(doc, version) {
  if (!version || typeof version !== 'object') return false;
  const hasGridRef = !!(version.meta && version.meta.gridFsFileId);
  const isFs = version.storage === 'fs' || (!version.storage && !hasGridRef);
  if (!isFs) return false;
  if (version.path && fs.existsSync(version.path)) return false;
  return true;
}

async function findBrokenFsVersions(db, ctx, firstOnly) {
  const out = [];
  for (const coll of ['attachments', 'avatars']) {
    // The disk check cannot be expressed as a query, but the scan reads only
    // the metadata fields it needs; attachments collections hold metadata
    // documents (small), not binaries.
    const cursor = db.collection(coll).find({}, { projection: { name: 1, versions: 1 } });
    for await (const doc of cursor) {
      for (const [versionName, version] of Object.entries(doc.versions || {})) {
        if (versionNeedsHeal(doc, version)) {
          out.push({ coll, doc, versionName, version });
          if (firstOnly) { await cursor.close(); return out; }
        }
      }
    }
    await cursor.close();
  }
  return out;
}

async function healOne(db, ctx, { coll, doc, versionName, version }) {
  const destDir = coll === 'avatars' ? ctx.paths.avatars : ctx.paths.attachments;
  const writable = ctx.paths.writablePath;
  const filesRoot = path.dirname(destDir);   // <writable>[/files]
  const id = String(doc._id);
  const name = doc.name || id;
  const base = version.path ? path.basename(String(version.path).replace(/\\/g, '/')) : '';

  const candidates = [];
  if (base) candidates.push(path.join(destDir, base));
  candidates.push(path.join(destDir, id));                                     // v6.85+ naming
  candidates.push(path.join(destDir, `${id}-${versionName}-${name}`));         // moveToStorage naming
  candidates.push(path.join(destDir, `${id}_${name}`));                        // importer naming
  // v6.10-18 temp dir and v6.10 CFS->ostrio temp files lived directly under
  // WRITABLE_PATH; on layouts where the current root added '/files', check both.
  for (const root of new Set([filesRoot, writable])) {
    if (base) candidates.push(path.join(root, 'uploads', coll, base));
    candidates.push(path.join(root, 'uploads', coll, id));
    candidates.push(path.join(root, `${id}-${name}`));
    if (base) candidates.push(path.join(root, coll, base));                    // pre-/files layout
    candidates.push(path.join(root, coll, id));
  }

  let found = null;
  for (const c of candidates) {
    try { if (fs.statSync(c).isFile()) { found = c; break; } } catch { /* next */ }
  }
  if (!found) {
    // last resort: prefix scan of the current directory
    try {
      const p1 = `${id}-${versionName}-`, p2 = `${id}-original-`, p3 = `${id}_`;
      const hit = fs.readdirSync(destDir).find(e => e === id || e.startsWith(p1) || e.startsWith(p2) || e.startsWith(p3));
      if (hit) found = path.join(destDir, hit);
    } catch { /* ignore */ }
  }
  if (!found) return false;

  let finalPath = found;
  if (path.resolve(path.dirname(found)) !== path.resolve(destDir)) {
    // copy (never move — the old dir may be shared/backed up) into the current layout
    finalPath = path.join(destDir, `${id}-${versionName}-${path.basename(found)}`.slice(0, 220));
    try {
      fs.mkdirSync(destDir, { recursive: true });
      fs.copyFileSync(found, finalPath);
    } catch (e) {
      ctx.log(`heal ${coll}/${id}: copy failed: ${e.message}`);
      return false;
    }
  }
  const set = {
    [`versions.${versionName}.path`]: finalPath,
    [`versions.${versionName}.storage`]: 'fs',
  };
  try { set[`versions.${versionName}.size`] = fs.statSync(finalPath).size; } catch { /* keep */ }
  if (versionName === 'original') set.path = finalPath;
  await db.collection(coll).updateOne({ _id: doc._id }, { $set: set });
  return true;
}

// ── orchestrator ─────────────────────────────────────────────────────────────
/**
 * Check what is already migrated and migrate all the rest.
 *
 * VERSION-GATED: the marker records {version, at} of the last successful
 * re-check. While the running WeKan version is unchanged, the whole run is
 * ONE findOne — a full re-check is mandatory only after a release upgrade
 * (or with options.force / WEKAN_FORCE_SCHEMA_UPGRADE=true). A run that
 * leaves unresolved work (or a failed step) does NOT record the version, so
 * the next boot re-checks.
 *
 * @param db mongodb driver Db (MongoDB or FerretDB — same wire protocol)
 * @param options {log?, writablePath?, appVersion?, force?}
 * @return {{ran: string[], skipped: string[], results: Object, gated: boolean}}
 */
async function runSchemaUpgrade(db, options = {}) {
  const log = options.log || (() => {});
  const appVersion = options.appVersion || '';
  const force = options.force || process.env.WEKAN_FORCE_SCHEMA_UPGRADE === 'true';
  const ctx = {
    log,
    paths: computeStoragePaths(options.writablePath !== undefined ? options.writablePath : process.env.WRITABLE_PATH),
  };
  const markerColl = db.collection(MARKER_COLL);
  const marker = (await markerColl.findOne({ _id: MARKER_ID })) || {};
  resetState(appVersion);
  upgradeState.lastCheck = marker.lastCheck || null;

  // Migration dashboards show the Admin Panel product name when one is set.
  try {
    const s = await db.collection('settings').findOne({ productName: { $exists: true } }, { projection: { productName: 1 } });
    if (s && typeof s.productName === 'string' && s.productName.trim()) upgradeState.product = s.productName.trim();
  } catch { /* keep default */ }

  // Version gate: unchanged release + previous re-check was clean -> one findOne, done.
  if (!force && marker.lastCheck && marker.lastCheck.version === appVersion) {
    log(`schema already re-checked for version ${appVersion} at ${marker.lastCheck.at}; skipping (set WEKAN_FORCE_SCHEMA_UPGRADE=true to force).`);
    upgradeState.running = false;
    upgradeState.gated = true;
    upgradeState.finishedAt = new Date();
    for (const s of steps) upgradeState.steps[s.name].status = 'skipped';
    return { ran: [], skipped: steps.map(s => s.name), results: {}, gated: true };
  }

  const ran = [], skipped = [], results = {};
  let clean = true;

  for (const step of steps) {
    const st = upgradeState.steps[step.name];
    upgradeState.currentStep = step.name;
    try {
      st.status = 'checking';
      const needed = await step.check(db, ctx);
      if (!needed) {
        st.status = 'skipped';
        skipped.push(step.name);
        continue;
      }
      log(`running ${step.name} ...`);
      st.status = 'running';
      const res = await step.run(db, ctx);
      st.status = 'done';
      st.fixed = res.fixed;
      st.unresolved = res.unresolved || 0;
      results[step.name] = res;
      ran.push(step.name);
      log(`${step.name}: fixed ${res.fixed}${res.unresolved ? `, unresolved ${res.unresolved} (will retry next start)` : ''}`);
      if (res.unresolved) clean = false;
      // per-step record for the dashboard/history
      await markerColl.updateOne(
        { _id: MARKER_ID },
        { $set: { [`steps.${step.name}`]: { doneAt: new Date(), fixed: res.fixed, unresolved: res.unresolved || 0 } } },
        { upsert: true },
      ).catch(() => {});
    } catch (e) {
      // Never break startup over an upgrade step — log and retry next boot.
      clean = false;
      st.status = 'error';
      st.error = e.message;
      log(`${step.name} FAILED (will retry next start): ${e.message}`);
      results[step.name] = { error: e.message };
    }
  }

  upgradeState.currentStep = '';
  upgradeState.running = false;
  upgradeState.finishedAt = new Date();

  // Record the re-check ONLY when everything is clean — an unresolved or
  // failed step keeps the version un-stamped so the next boot re-checks.
  if (clean) {
    const lastCheck = { version: appVersion, at: new Date() };
    upgradeState.lastCheck = lastCheck;
    await markerColl.updateOne(
      { _id: MARKER_ID },
      { $set: { lastCheck } },
      { upsert: true },
    ).catch(e => log('marker lastCheck update failed: ' + e.message));
  }
  return { ran, skipped, results, gated: false };
}

module.exports = {
  runSchemaUpgrade,
  getUpgradeState,
  steps,
  BOARD_ALLOWS_TRUE_DEFAULTS,
  randomId,
  versionNeedsHeal,
  MARKER_COLL,
  MARKER_ID,
};
