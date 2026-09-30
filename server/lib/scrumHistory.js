import { AsyncLocalStorage } from 'node:async_hooks';
import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Cards from '/models/cards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import ScrumSprints from '/models/scrumSprints';
import ScrumReleases from '/models/scrumReleases';
import ScrumEvents from '/models/scrumEvents';
import ChangeHistory from '/models/changeHistory';
import CustomFields from '/models/customFields';
import ScrumHistoryPending, { ScrumHistoryCompletions } from './scrumHistoryPending';
import { canUpdateCard } from '/server/permissions/cards';
import { allowIsBoardMemberWithWriteAccess } from '/server/lib/utils';
import { withoutRecording, isRecordingSuppressed } from './historyRecordingScope';
import { setScrumHistoryRecorder, setScrumHistoryBatchRunner, withScrumBoardLock, assertNoPendingScrumImport } from '/server/scrum';
const { assignedOnlyCardScope } = require('/models/lib/boardCardScope');
const { METADATA_TYPES, historyDocument, historyRecords, historySide } = require('/models/lib/scrumHistory');
const { normalizeScrumMetadata, normalizeScrumSettings, DEFAULT_SCRUM_SETTINGS } = require('/models/lib/scrum');
const collections = { board: Boards, card: Cards, list: Lists, swimlane: Swimlanes,
  'scrum-sprint': ScrumSprints, 'scrum-release': ScrumReleases, 'scrum-event': ScrumEvents };
const { recordScrumRestoreOnce } = require('./scrumHistoryRestoreWriter');
const { finishScrumHistory, verifyScrumHistorySource } = require('./scrumHistoryFinalizer');
const { ensureScrumHistoryOperation, claimScrumHistoryWorker, assertScrumHistoryWorker } = require('./scrumHistoryOwnership');
const { scrumHistoryWriteState, inspectScrumHistoryWrites, verifyScrumHistoryWrites, plannedIncarnations } = require('./scrumHistoryWriteState');
const { scrumHistoryWriteSelector } = require('./scrumHistoryWriteSelector');
const { readScrumHistoryRequestCompletion } = require('./scrumHistoryCompletion');
const batches = new AsyncLocalStorage();
const conflict = () => { throw new Meteor.Error('scrum-conflict', 'Scrum data changed. Reload History before retrying.'); };

async function recordBatch(boardId, userId, changes) {
  if (!userId || !changes.length || isRecordingSuppressed()) return;
  const records = historyRecords(changes).filter(row => !EJSON.equals(row.before, row.after));
  if (!records.length) return;
  const single = records.length === 1 ? records[0] : null;
  const source = changes.find(change => change.entityId === single?.id);
  const card = single?.type === 'card' ? source.newContent || source.previousContent : null;
  const id = await ChangeHistory.record({ boardId, entityType: 'scrum', entityId: single?.id || boardId,
    group: 'scrum', cardId: card?._id || null, listId: card?.listId || (single?.type === 'list' ? single.id : null),
    swimlaneId: card?.swimlaneId || (single?.type === 'swimlane' ? single.id : null),
    changeType: single && !single.before ? 'added' : single && !single.after ? 'removed' : 'edited',
    previousContent: historySide(records, 'before'), newContent: historySide(records, 'after'), userId });
  if (!id) throw new Meteor.Error('scrum-history-failed', 'The change was saved but its History record could not be written.');
}
Meteor.startup(() => {
  setScrumHistoryRecorder(async change => {
    if (isRecordingSuppressed()) return;
    const batch = batches.getStore();
    if (batch) batch.push(change);
    else await recordBatch(change.boardId, change.userId, [change]);
  });
  setScrumHistoryBatchRunner((boardId, userId, operation) => batches.run([], async () => {
    try { return await operation(); }
    finally { await recordBatch(boardId, userId, batches.getStore()); }
  }));
});

function recordList(content) {
  if (!content || !Array.isArray(content.records) || !content.records.length) throw new Meteor.Error('invalid-scrum-history');
  const seen = new Set();
  for (const row of content.records) {
    if (!row || !collections[row.type] || typeof row.id !== 'string' || seen.has(`${row.type}:${row.id}`)) throw new Meteor.Error('invalid-scrum-history');
    seen.add(`${row.type}:${row.id}`);
  }
  return content.records;
}
export async function scrumHistorySnapshot(row) {
  const records = recordList(row.newContent || row.previousContent);
  return { records: await Promise.all(records.map(async entry => ({ type: entry.type, id: entry.id,
    document: historyDocument(entry.type, await collections[entry.type].findOneAsync(entry.id)) }))) };
}
async function validateTargets(board, userId, records, current) {
  const final = new Map(records.map(entry => [`${entry.type}:${entry.id}`, entry.document]));
  async function reference(type, id) {
    if (!id) return;
    const key = `${type}:${id}`;
    const doc = final.has(key) ? final.get(key) : await collections[type].findOneAsync(id);
    if (!doc || doc.boardId !== board._id) throw new Meteor.Error('invalid-scrum-reference', 'A referenced Scrum record is no longer on this board.');
  }
  for (let index = 0; index < records.length; index += 1) {
    const entry = records[index]; const doc = current[index]; const target = entry.document;
    if (doc && (entry.type === 'board' ? doc._id : doc.boardId) !== board._id) conflict();
    if (target && (target._id !== entry.id || target.boardId !== board._id)) conflict();
    if (entry.type === 'card') {
      const scope = assignedOnlyCardScope(board, userId);
      if (!doc || (scope && !(doc.assignees || []).includes(userId)) || !await canUpdateCard(userId, doc, ['scrum'], { $set: { scrum: target?.scrum || {} } })) throw new Meteor.Error('not-authorized');
    } else if (['list', 'swimlane'].includes(entry.type)) {
      if (!allowIsBoardMemberWithWriteAccess(userId, board)) throw new Meteor.Error('not-authorized');
    } else if (!board.hasAdmin(userId)) throw new Meteor.Error('not-authorized');
    if (METADATA_TYPES.has(entry.type)) {
      if (!doc || !target) conflict();
      if (entry.type === 'board') normalizeScrumSettings(target.scrum);
      else normalizeScrumMetadata(entry.type, target.scrum);
    }
    const metadata = METADATA_TYPES.has(entry.type) ? target?.scrum : target;
    await reference('scrum-sprint', metadata?.sprintId);
    await reference('scrum-release', metadata?.releaseId);
    for (const id of metadata?.pastSprintIds || []) await reference('scrum-sprint', id);
    if (entry.type === 'board' && target?.scrum?.estimateSource === 'customField') {
      if (!await CustomFields.findOneAsync({ _id: target.scrum.estimateCustomFieldId, boardIds: board._id, type: 'number' })) throw new Meteor.Error('invalid-scrum-reference');
    }
    if (entry.type === 'scrum-event' && target) {
      for (const id of target.followUpCardIds || []) if (!await Cards.findOneAsync({ _id: id, boardId: board._id })) throw new Meteor.Error('invalid-scrum-reference');
    }
    // Never delete a planning record still referenced outside this operation.
    if (!target && ['scrum-sprint', 'scrum-release'].includes(entry.type)) {
      const field = entry.type === 'scrum-sprint' ? 'sprintId' : 'releaseId';
      for (const type of ['card', 'swimlane', ...(field === 'sprintId' ? ['scrum-event'] : [])]) {
        const selector = type === 'scrum-event' ? { sprintId: entry.id } : { [`scrum.${field}`]: entry.id };
        if (type === 'card' && field === 'sprintId') {
          delete selector['scrum.sprintId']; selector.$or = [{ 'scrum.sprintId': entry.id }, { 'scrum.pastSprintIds': entry.id }];
        }
        const refs = await collections[type].find({ boardId: board._id, ...selector }).fetchAsync();
        for (const ref of refs) {
          const key = `${type}:${ref._id}`;
          if (!final.has(key)) conflict();
          const after = final.get(key); const meta = METADATA_TYPES.has(type) ? after?.scrum : after;
          if (meta?.[field] === entry.id || (field === 'sprintId' && meta?.pastSprintIds?.includes(entry.id))) conflict();
        }
      }
    }
  }
  const settings = { ...DEFAULT_SCRUM_SETTINGS, ...(final.get(`board:${board._id}`)?.scrum || board.scrum || {}) };
  const active = await ScrumSprints.find({ boardId: board._id, state: 'active' }).fetchAsync();
  const sprints = new Map(active.map(s => [s._id, s]));
  for (const entry of records.filter(r => r.type === 'scrum-sprint')) sprints.set(entry.id, entry.document);
  for (const sprint of sprints.values()) if (sprint?.state === 'active' && sprint.startSnapshot) {
    for (const [setting, stored] of [['estimateSource','estimateSource'],['estimateCustomFieldId','estimateCustomFieldId'],['estimateUnit','unit'],['completionPolicy','completionPolicy']]) {
      if ((settings[setting] ?? null) !== (sprint.startSnapshot[stored] ?? null)) conflict();
    }
  }
}

export async function applyScrumHistory(row, content, direction, request) {
  return withScrumBoardLock(row.boardId, async () => {
    const userId = Meteor.userId();
    const board = await Boards.findOneAsync(row.boardId);
    if (!userId || !board) throw new Meteor.Error('not-authorized');
    const operationId = request?._id;
    if (request) {
      if (request.userId !== userId || request.boardId !== row.boardId || request.direction !== direction ||
          request.selection.rowId !== row._id || request.selection.sourceHash !== row.integrityHash) conflict();
      if (!allowIsBoardMemberWithWriteAccess(userId, board)) throw new Meteor.Error('not-authorized');
      // Check inside the board queue too: another call may have completed after
      // this worker read the request but before it acquired the local lock.
      if (await readScrumHistoryRequestCompletion(ScrumHistoryCompletions, request)) {
        const pending = await ScrumHistoryPending.findOneAsync(row.boardId);
        if (pending?.operationId === operationId) {
          await finishScrumHistory({ history: ChangeHistory, pending: ScrumHistoryPending,
            completions: ScrumHistoryCompletions, row, journal: pending });
        }
        return true;
      }
    }
    const assertSource = async () => {
      const current = await ChangeHistory.findOneAsync(row._id);
      try { verifyScrumHistorySource(current, row, direction); } catch (error) { conflict(); }
    };
    await assertSource();
    const targets = recordList(content);
    let journal = await ScrumHistoryPending.findOneAsync(row.boardId);
    if (journal && (journal.rowId !== row._id || journal.direction !== direction || journal.userId !== userId ||
        (operationId && journal.operationId !== operationId) || !EJSON.equals(journal.content, content))) conflict();
    if (!journal) {
      if (await ScrumSprints.findOneAsync({ boardId: row.boardId, 'rolloverPending.0': { $exists: true } })) conflict();
      const current = await Promise.all(targets.map(entry => collections[entry.type].findOneAsync(entry.id)));
      await validateTargets(board, userId, targets, current);
      await assertNoPendingScrumImport(row.boardId);
      const live = { records: targets.map((entry, index) => ({ type: entry.type, id: entry.id, document: historyDocument(entry.type, current[index]) })) };
      const expected = direction === 'undo' ? row.newContent : row.previousContent;
      if (direction !== 'restore' && !EJSON.equals(live, expected)) conflict();
      journal = { _id: row.boardId, rowId: row._id, direction, userId, operationId: operationId || Random.id(), content: EJSON.clone(content),
        before: live, revisions: current.map((doc,index) => doc ? (METADATA_TYPES.has(targets[index].type) ? doc.scrumRevision || 0 : doc.revision || 0) : null),
        // Which lifetime of each record this plan was made against, and which
        // one a record it creates will have (scrumHistoryWriteState.js).
        incarnations: plannedIncarnations({ targets, current, newId: () => Random.id() }) };
      await ScrumHistoryPending.insertAsync(journal);
    } else {
      const current = await Promise.all(targets.map(entry => collections[entry.type].findOneAsync(entry.id)));
      await validateTargets(board, userId, targets, current);
      await assertNoPendingScrumImport(row.boardId);
    }
    await assertSource();
    journal = await ensureScrumHistoryOperation(ScrumHistoryPending, journal);
    // This worker's claim on the operation; a newer resume displaces it.
    const worker = await claimScrumHistoryWorker(ScrumHistoryPending, journal);
    const assertCurrent = async () => {
      await assertScrumHistoryWorker(ScrumHistoryPending, journal, worker);
      await assertSource();
    };
    const verifyWrites = async (entries = targets, before = journal.before.records, revisions = journal.revisions,
      incarnations = journal.incarnations) => {
      try { await verifyScrumHistoryWrites({ targets: entries, before, revisions, incarnations, assertCurrent,
        read: entry => collections[entry.type].findOneAsync(entry.id) }); }
      catch (error) { conflict(); }
    };
    // Refuse already-visible conflicts anywhere in the saved batch before
    // advancing its first unfinished write. Per-write guards remain necessary
    // because this read-only preflight is not an atomic database snapshot.
    try { await inspectScrumHistoryWrites({ targets, before: journal.before.records,
      revisions: journal.revisions, incarnations: journal.incarnations, assertCurrent,
      read: entry => collections[entry.type].findOneAsync(entry.id) }); }
    catch (error) { conflict(); }
    await withoutRecording(async () => {
      for (let index = 0; index < targets.length; index += 1) {
        await assertCurrent();
        const entry = targets[index]; const collection = collections[entry.type];
        const current = await collection.findOneAsync(entry.id);
        const before = journal.before.records[index];
        if (before?.type !== entry.type || before?.id !== entry.id) conflict();
        const originalRevision = journal.revisions[index];
        let state;
        const incarnation = journal.incarnations?.[index];
        try { state = scrumHistoryWriteState({ type: entry.type, current,
          before: before.document, after: entry.document, revision: originalRevision, incarnation }); }
        catch (error) { conflict(); }
        if (state === 'applied') continue;
        const metadata = METADATA_TYPES.has(entry.type);
        const selector = current ? scrumHistoryWriteSelector(entry.type, current) : null;
        await assertCurrent();
        if (!entry.document) {
          if (!await collection.removeAsync(selector)) conflict();
        } else if (metadata) {
          if (!await collection.updateAsync(selector, { $set: { scrum: EJSON.clone(entry.document.scrum), scrumRevision: originalRevision + 1 } })) conflict();
        } else if (!current) {
          await collection.insertAsync({ ...EJSON.clone(entry.document), revision: 1, updatedAt: new Date(), updatedBy: userId,
            ...(incarnation?.after ? { incarnation: incarnation.after } : {}) });
        } else {
          const { _id, ...fields } = EJSON.clone(entry.document);
          // `incarnation` is not History content (historyDocument leaves it
          // out) and must survive an update: it is the same record.
          const unset = Object.fromEntries(Object.keys(current).filter(key => !['_id','revision','updatedAt','updatedBy','incarnation'].includes(key) && !(key in fields)).map(key => [key,'']));
          const modifier = { $set: { ...fields, revision: originalRevision + 1, updatedAt: new Date(), updatedBy: userId } };
          if (Object.keys(unset).length) modifier.$unset = unset;
          if (!await collection.updateAsync(selector, modifier)) conflict();
        }
        await verifyWrites([entry], [before], [originalRevision], journal.incarnations ? [incarnation] : undefined);
      }
    });
    // Keep recovery durable until BOTH the timeline and the undo-stack flag
    // are saved. A retry after either write uses the same operation ID.
    const authors = direction === 'restore' ? [...new Set([row.userId, userId])] : [userId];
    for (const author of authors) {
      await verifyWrites();
      await recordScrumRestoreOnce(ChangeHistory, {
        boardId: row.boardId, swimlaneId: row.swimlaneId, listId: row.listId, cardId: row.cardId,
        entityType: row.entityType, entityId: row.entityId, group: row.group,
        changeType: 'restored', previousContent: journal.before, newContent: content,
        userId: author, restoredFromId: row._id, restoredByUserId: userId,
        isCheckpoint: direction !== 'restore', batchId: journal.operationId,
      }).catch(() => {
        throw new Meteor.Error('scrum-history-pending',
          'History could not be verified or saved. The recovery checkpoint was retained.');
      });
    }
    await verifyWrites();
    await finishScrumHistory({ history: ChangeHistory, pending: ScrumHistoryPending,
      completions: ScrumHistoryCompletions, row, journal }).catch(() => {
      throw new Meteor.Error('scrum-history-pending',
        'History finalization could not be verified. Retry the pending operation.');
    });
    return true;
  });
}

export async function pendingScrumHistoryRow(boardId, userId, direction) {
  const journal = await ScrumHistoryPending.findOneAsync(boardId);
  if (!journal) return null;
  if (journal.userId !== userId || journal.direction !== direction) conflict();
  const row = await ChangeHistory.findOneAsync(journal.rowId);
  if (!row) conflict();
  return row;
}
