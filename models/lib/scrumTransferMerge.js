'use strict';

// Importing a native Scrum transfer (`wekan-scrum-2`, models/lib/scrumTransfer.js)
// INTO AN EXISTING BOARD (2026-10-08). Every other import creates a new board
// and gives each record a new ID; this one finds what the board already has.
// Pure: the server loads the destination's records and writes the result
// through the journaled Scrum import stage (server/lib/scrumTransferMerge.js).
//
// Sprints and releases are matched, in this order, and never duplicated:
//   1. the same `_id` on THIS board - the file is this board's own export;
//   2. the same provenance - a record an earlier import of the same file (or
//      of the same Jira/GitLab/... record) created here carries the source's
//      system and record ID, so importing the file again finds it;
//   3. the same name, trimmed, when exactly one record of the board has it and
//      exactly one record of the file has it - the rule card copies and moves
//      already follow (models/lib/scrumCopy.js).
// Two candidates, or two file records claiming one board record, is ambiguous:
// the record is neither linked nor created, and the loss report says so.
// A matched record is the board's own and is never overwritten; only records
// with no match are created, with the source's provenance.
// Events are matched by `_id` or provenance only - they have no unique name.
//
// Cards are never created here, only matched, by a key the file carries:
//   1. the same `_id` on THIS board;
//   2. a board export's card number AND title, both equal, exactly one card -
//      a board imported from the same export keeps both (models/wekanCreator.js
//      keeps `cardNumber`).
// A bare transfer carries card IDs only. A card matched by neither, matched
// twice, or whose ID is a card of ANOTHER board, is reported and left alone:
// nothing is guessed, and another board's card is never written.
// What a matched card gets: the file's sprint, releases, backlog rank, issue
// type and acceptance criteria; past sprints are added to. A move into a
// finished sprint is refused, as scrum.updateCard refuses it. Estimates are
// not Scrum metadata (they are the card's planning poker value or a custom
// field) and are not in the transfer, so they are not changed.
// Board settings, list categories and swimlane links stay the board's own.

const { normalizeScrumTransfer, normalizeScrumTransferLosses } = require('./scrumTransfer');
const { cardReleaseIds, withCardReleaseIds } = require('./scrum');

const OPEN = ['planned', 'active'];
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const trimmed = value => (typeof value === 'string' ? value.trim() : '');
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value);
const fail = message => { throw new Error(`Invalid Scrum transfer: ${message}`); };
const LINKED = new Set(['cardType-linkedCard', 'cardType-linkedBoard']);

function rows(value, pick) {
  if (value === undefined) return [];
  if (!Array.isArray(value)) fail('expected a list of rows');
  return value.filter(row => plain(row) && typeof row._id === 'string' && row._id && row._id.length <= 200).map(pick);
}
// Only what the import reads, from a board export or a bare transfer: a full
// export also carries attachments, comments and activities, none of which are
// sent to the server for this. Used by the browser and again by the server.
function scrumTransferFileFields(file) {
  if (!plain(file)) fail('expected a JSON object');
  if (typeof file.format === 'string') return { scrumTransfer: file, scrumTransferLosses: [], cards: [], lists: [], customFields: [] };
  if (!plain(file.scrumTransfer)) fail('this file has no Scrum planning');
  return {
    ...(typeof file._id === 'string' && file._id.length <= 500 ? { _id: file._id } : {}),
    scrumTransfer: file.scrumTransfer,
    scrumTransferLosses: Array.isArray(file.scrumTransferLosses) ? file.scrumTransferLosses : [],
    cards: rows(file.cards, row => ({ _id: row._id,
      ...(typeof row.title === 'string' ? { title: row.title.slice(0, 10000) } : {}),
      ...(Number.isSafeInteger(row.cardNumber) ? { cardNumber: row.cardNumber } : {}) })),
    lists: rows(file.lists, row => ({ _id: row._id, ...(typeof row.title === 'string' ? { title: row.title.slice(0, 10000) } : {}) })),
    customFields: rows(file.customFields, row => ({ _id: row._id,
      ...(typeof row.name === 'string' ? { name: row.name.slice(0, 10000) } : {}),
      ...(typeof row.type === 'string' ? { type: row.type.slice(0, 100) } : {}) })),
  };
}

function sourceProvenance(record, sourceBoardId) {
  return record.provenance || { system: 'wekan', recordId: record._id,
    ...(typeof sourceBoardId === 'string' && sourceBoardId.length <= 500 ? { projectId: sourceBoardId } : {}) };
}
function sameProvenance(a, b) {
  return plain(a) && plain(b) && !!a.system && a.system === b.system && !!a.recordId && a.recordId === b.recordId &&
    (!a.projectId || !b.projectId || a.projectId === b.projectId);
}

// { sourceId -> { action: 'match'|'create'|'skip', targetId, by, name, reason } }
function resolveRecords(kind, incoming, destination, sourceBoardId, newId) {
  const decisions = new Map();
  const claimed = new Map();
  const nameCount = new Map();
  for (const record of incoming) nameCount.set(trimmed(record.name), (nameCount.get(trimmed(record.name)) || 0) + 1);
  // Exact keys first, so a name can never take a record an ID or provenance names.
  for (const record of incoming) {
    const byId = destination.find(row => row._id === record._id);
    const provenance = sourceProvenance(record, sourceBoardId);
    const byProvenance = byId ? [] : destination.filter(row => sameProvenance(row.provenance, provenance));
    const target = byId || (byProvenance.length === 1 ? byProvenance[0] : null);
    if (byProvenance.length > 1) decisions.set(record._id, { action: 'skip', reason: 'record-ambiguous', name: record.name });
    else if (target && claimed.has(target._id)) decisions.set(record._id, { action: 'skip', reason: 'record-ambiguous', name: record.name });
    else if (target) {
      claimed.set(target._id, record._id);
      decisions.set(record._id, { action: 'match', targetId: target._id, by: byId ? 'id' : 'provenance', name: target.name,
        state: target.state });
    }
  }
  for (const record of incoming) {
    if (decisions.has(record._id)) continue;
    const name = trimmed(record.name);
    const byName = kind === 'event' || !name ? [] : destination.filter(row => trimmed(row.name) === name);
    if (byName.length > 1 || (byName.length === 1 && (nameCount.get(name) > 1 || claimed.has(byName[0]._id)))) {
      decisions.set(record._id, { action: 'skip', reason: 'record-ambiguous', name: record.name });
    } else if (byName.length === 1) {
      claimed.set(byName[0]._id, record._id);
      decisions.set(record._id, { action: 'match', targetId: byName[0]._id, by: 'name', name: byName[0].name, state: byName[0].state });
    } else {
      decisions.set(record._id, { action: 'create', targetId: newId(), name: record.name, state: record.state,
        provenance: sourceProvenance(record, sourceBoardId) });
    }
  }
  return decisions;
}

// { sourceId -> { targetId, by } | { reason } }
function resolveCards(sourceIds, sourceCards, destinationCards, foreignCardIds) {
  const byId = new Map(); const byKey = new Map();
  const key = row => (Number.isSafeInteger(row.cardNumber) && row.cardNumber > 0 && trimmed(row.title)
    ? `${row.cardNumber}\u0000${trimmed(row.title)}` : null);
  for (const card of destinationCards) {
    if (LINKED.has(card.type)) continue;
    byId.set(card._id, card);
    const k = key(card);
    if (k) byKey.set(k, [...(byKey.get(k) || []), card]);
  }
  const source = new Map(sourceCards.map(row => [row._id, row]));
  const foreign = new Set(foreignCardIds);
  const result = new Map();
  for (const sourceId of sourceIds) {
    if (byId.has(sourceId)) { result.set(sourceId, { targetId: sourceId, by: 'id' }); continue; }
    const k = source.has(sourceId) ? key(source.get(sourceId)) : null;
    const candidates = k ? byKey.get(k) || [] : [];
    if (candidates.length === 1) result.set(sourceId, { targetId: candidates[0]._id, by: 'cardNumber' });
    else if (candidates.length > 1) result.set(sourceId, { reason: 'card-ambiguous' });
    else result.set(sourceId, { reason: foreign.has(sourceId) ? 'card-on-another-board' : 'card-not-matched' });
  }
  // Two file cards on one board card: the ID match stays, the others are
  // ambiguous - never two cards' planning written to one.
  const claims = new Map();
  for (const [sourceId, row] of result) if (row.targetId) claims.set(row.targetId, [...(claims.get(row.targetId) || []), sourceId]);
  for (const sourceIds of claims.values()) {
    if (sourceIds.length < 2) continue;
    for (const sourceId of sourceIds) if (result.get(sourceId).by !== 'id') result.set(sourceId, { reason: 'card-ambiguous' });
  }
  return result;
}

function uniqueByTitle(sourceRows, destinationRows, field) {
  const count = list => list.reduce((map, row) => map.set(trimmed(row[field]), (map.get(trimmed(row[field])) || 0) + 1), new Map());
  const sourceCount = count(sourceRows); const destinationCount = count(destinationRows);
  const map = new Map();
  for (const row of sourceRows) {
    const name = trimmed(row[field]);
    if (!name || sourceCount.get(name) !== 1 || destinationCount.get(name) !== 1) continue;
    map.set(row._id, destinationRows.find(other => trimmed(other[field]) === name)._id);
  }
  return map;
}

function totals(snapshot) {
  snapshot.missingEstimates = snapshot.cards.filter(row => row.estimate === null).length;
  snapshot.totalEstimate = snapshot.cards.reduce((sum, row) => sum + (row.estimate ?? 0), 0);
  return snapshot;
}

// The plan: a transfer reduced to what is written or referenced, in SOURCE
// IDs, and the maps remapScrumTransfer turns them into this board's IDs with.
// `destination`: { sprints, releases, events: [{ _id, name, state, provenance }],
// cards: [{ _id, title, cardNumber, type }], lists: [{ _id, title }],
// customFields: [{ _id, name, type }], memberIds, foreignCardIds }.
function planScrumTransferMerge(file, destination, newId) {
  const source = scrumTransferFileFields(file);
  const transfer = normalizeScrumTransfer(source.scrumTransfer);
  const losses = [...normalizeScrumTransferLosses(source.scrumTransferLosses)];
  const loss = (path, sourceId, reason) => losses.push({ path, sourceId, reason });
  const sprints = resolveRecords('sprint', transfer.sprints, destination.sprints || [], source._id, newId);
  const releases = resolveRecords('release', transfer.releases, destination.releases || [], source._id, newId);
  const events = resolveRecords('event', transfer.events, destination.events || [], source._id, newId);

  const lists = new Map((destination.lists || []).map(row => [row._id, row._id]));
  for (const [from, to] of uniqueByTitle(source.lists, destination.lists || [], 'title')) if (!lists.has(from)) lists.set(from, to);
  const numberFields = (destination.customFields || []).filter(row => row.type === 'number');
  const customFields = new Map(numberFields.map(row => [row._id, row._id]));
  for (const [from, to] of uniqueByTitle(source.customFields.filter(row => row.type === 'number'), numberFields, 'name')) {
    if (!customFields.has(from)) customFields.set(from, to);
  }

  // Every card the file names: with metadata, in a snapshot, as a follow-up.
  const snapshotsOf = sprint => ['startSnapshot', 'closeSnapshot'].map(key => sprint[key]).filter(Boolean);
  const cardIds = new Set(transfer.cards.map(row => row._id));
  for (const sprint of transfer.sprints) for (const snap of snapshotsOf(sprint)) for (const row of snap.cards) cardIds.add(row.cardId);
  for (const row of transfer.dailyObservations) for (const card of row.snapshot.cards) cardIds.add(card.cardId);
  for (const event of transfer.events) for (const id of event.followUpCardIds || []) cardIds.add(id);
  const cardDecisions = resolveCards([...cardIds], source.cards, destination.cards || [], destination.foreignCardIds || []);
  const cards = new Map([...cardDecisions].filter(([, row]) => row.targetId).map(([id, row]) => [id, row.targetId]));

  // A snapshot keeps the rows it can place on this board; a card that is
  // here in a list that is not is dropped too, and the snapshot is partial.
  // Its estimate field must be here when it counted a field.
  function snapshotFits(snap) {
    return !snap.estimateCustomFieldId || customFields.has(snap.estimateCustomFieldId) || snap.estimateSource !== 'customField';
  }
  function prepareSnapshot(snap, path) {
    const result = { ...snap, cards: snap.cards.filter(row => {
      if (!cards.has(row.cardId) || lists.has(row.listId)) return true;
      loss(path, row.cardId, 'card-not-matched');
      return false;
    }) };
    if (result.estimateCustomFieldId && !customFields.has(result.estimateCustomFieldId)) result.estimateCustomFieldId = null;
    if (result.cards.length !== snap.cards.length) result.partial = true;
    return totals(result);
  }
  for (const sprint of transfer.sprints) {
    const decision = sprints.get(sprint._id);
    if (decision.action === 'create' && !snapshotsOf(sprint).every(snapshotFits)) {
      sprints.set(sprint._id, { action: 'skip', reason: 'record-not-imported', name: sprint.name });
    }
  }
  for (const [kind, decisions] of [['sprints', sprints], ['releases', releases]]) {
    for (const [sourceId, decision] of decisions) if (decision.action === 'skip') loss(`${kind}.${sourceId}`, sourceId, decision.reason);
  }
  const resolved = decisions => sourceId => sourceId != null && decisions.get(sourceId)?.action !== 'skip' && decisions.has(sourceId);
  const sprintResolved = resolved(sprints); const releaseResolved = resolved(releases);

  const prepared = { format: transfer.format, settings: {}, lists: [], swimlanes: [] };
  prepared.sprints = transfer.sprints.flatMap(sprint => {
    const decision = sprints.get(sprint._id);
    if (decision.action === 'skip') return [];
    // A matched sprint is the board's own: only its ID is needed, as the
    // target of references.
    if (decision.action === 'match') return [{ _id: sprint._id, name: sprint.name, state: 'planned' }];
    const result = { ...sprint };
    if (result.rolloverSprintId && !sprintResolved(result.rolloverSprintId)) {
      loss(`sprints.${sprint._id}.rolloverSprintId`, result.rolloverSprintId, sprints.get(result.rolloverSprintId)?.reason || 'record-not-imported');
      result.rolloverSprintId = null;
    }
    for (const key of ['startSnapshot', 'closeSnapshot']) if (result[key]) result[key] = prepareSnapshot(result[key], `sprints.${sprint._id}.${key}`);
    return [result];
  });
  prepared.releases = transfer.releases.flatMap(release => {
    const decision = releases.get(release._id);
    if (decision.action === 'skip') return [];
    return [decision.action === 'match' ? { _id: release._id, name: release.name } : release];
  });
  prepared.events = transfer.events.flatMap(event => {
    const decision = events.get(event._id);
    if (decision.action !== 'create') return [];
    if (!sprintResolved(event.sprintId)) {
      events.set(event._id, { action: 'skip', reason: 'record-not-imported' });
      loss(`events.${event._id}`, event._id, 'record-not-imported');
      return [];
    }
    return [event];
  });
  // Daily history belongs to the sprint that measured it: a created sprint
  // brings its own, a matched sprint keeps the board's.
  prepared.dailyObservations = transfer.dailyObservations.flatMap(row => {
    if (sprints.get(row.sprintId).action !== 'create') return [];
    if (!snapshotFits(row.snapshot)) { loss(`dailyObservations.${row.sprintId}.${row.day}`, row.sprintId, 'record-not-imported'); return []; }
    return [{ ...row, snapshot: prepareSnapshot(row.snapshot, `dailyObservations.${row.sprintId}.${row.day}`) }];
  });
  prepared.cards = transfer.cards.flatMap(row => {
    const decision = cardDecisions.get(row._id);
    if (!decision.targetId) { loss(`cards.${row._id}`, row._id, decision.reason); return []; }
    const scrum = { ...row.scrum };
    if (scrum.sprintId && !sprintResolved(scrum.sprintId)) {
      loss(`cards.${row._id}.scrum.sprintId`, scrum.sprintId, sprints.get(scrum.sprintId).reason);
      delete scrum.sprintId;
    }
    if (scrum.pastSprintIds) scrum.pastSprintIds = scrum.pastSprintIds.filter(sprintResolved);
    const releaseIds = cardReleaseIds(scrum);
    if (own(scrum, 'releaseId') || own(scrum, 'releaseIds')) {
      const kept = releaseIds.filter(releaseResolved);
      for (const id of releaseIds) if (!releaseResolved(id)) loss(`cards.${row._id}.scrum.releaseIds`, id, releases.get(id).reason);
      delete scrum.releaseId; delete scrum.releaseIds;
      // Only some releases here: those are set. None of them here: the card
      // keeps its own, rather than losing them to a reference that failed.
      if (kept.length || !releaseIds.length) Object.assign(scrum, withCardReleaseIds({}, kept));
    }
    return [{ _id: row._id, scrum }];
  });

  const maps = {
    sprints: new Map([...sprints].filter(([, d]) => d.action !== 'skip').map(([id, d]) => [id, d.targetId])),
    releases: new Map([...releases].filter(([, d]) => d.action !== 'skip').map(([id, d]) => [id, d.targetId])),
    events: new Map([...events].filter(([, d]) => d.action === 'create').map(([id, d]) => [id, d.targetId])),
    cards, lists, customFields, swimlanes: new Map(),
    users: new Map((destination.memberIds || []).map(id => [id, id])),
  };
  const sprintStates = new Map([...sprints].filter(([, d]) => d.action !== 'skip').map(([, d]) => [d.targetId, d.state]));
  return { sourceBoardId: source._id || null, prepared, maps, sprints, releases, events, cards: cardDecisions,
    sprintStates, losses };
}

// The order of keys never makes two values differ.
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value instanceof Date) return { $date: value.getTime() };
  if (plain(value)) return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]));
  return value;
}
const sameValue = (a, b) => JSON.stringify(canonical(a)) === JSON.stringify(canonical(b));

// One card's metadata after the import: `incoming` is the file's, already in
// this board's IDs. Returns { scrum, refused } - `refused` names a sprint the
// card was not moved into because it is finished.
function mergeCardScrum(current, incoming, sprintStates) {
  const before = plain(current) ? current : {};
  const result = { ...before };
  for (const key of ['issueType', 'acceptanceCriteria', 'backlogRank']) if (own(incoming, key)) result[key] = incoming[key];
  if (own(incoming, 'releaseId') || own(incoming, 'releaseIds')) {
    const list = cardReleaseIds(incoming);
    if (!sameValue(list, cardReleaseIds(before))) Object.assign(result, withCardReleaseIds({}, list));
  }
  const past = [...(before.pastSprintIds || [])];
  for (const id of incoming.pastSprintIds || []) if (!past.includes(id)) past.push(id);
  let refused = null;
  if (own(incoming, 'sprintId')) {
    const target = incoming.sprintId ?? null; const was = before.sprintId ?? null;
    if (target !== was) {
      if (target && !OPEN.includes(sprintStates.get(target))) refused = target;
      else {
        result.sprintId = target;
        if (was && !past.includes(was)) past.push(was);
      }
    }
  }
  if (past.length || own(before, 'pastSprintIds')) result.pastSprintIds = past;
  return { scrum: result, changed: !sameValue(result, before), refused };
}

module.exports = { scrumTransferFileFields, planScrumTransferMerge, mergeCardScrum, sameProvenance, sourceProvenance };
