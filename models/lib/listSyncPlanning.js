'use strict';
// Planning Sync (2026-10-08): a synced issue's sprint and releases as the
// card's Scrum planning (models/lib/scrum.js), when the list's Sync settings
// opt into them and the board has Scrum enabled. Pure, so
// tests/listSyncPlanning.test.cjs runs it without Meteor; the server side,
// which reads and creates the board's records, is server/lib/listSyncPlanning.js.
//
// What each source gives, read from the same issue JSON the fetchers already
// return (server/lib/listSyncFetch.js):
//
//   Jira    the Sprint custom field (found by its schema, as the Jira import
//           finds it: models/lib/jiraScrumPlanning.js) -> sprint, and
//           `fixVersions` -> releases.
//   GitLab  `iteration` -> sprint, `milestone` -> one release.
//   GitHub, Gitea, Forgejo
//           `milestone` -> one release. They have no sprints.
//
// A source value is one of three things, and the difference is the point:
//   undefined  the source said nothing (the attribute is absent, malformed,
//              or names only a finished sprint): the card's planning stays.
//   null / []  the source says the issue has no sprint / no release: that is
//              a clear, applied only against a baseline (see planCardPlanning).
//   records    the sprint, or the releases, the issue is in.
const { createHash } = require('node:crypto');
const { parseJiraSprint, jiraPlanningFields } = require('./jiraScrumPlanning');
const { cardReleaseIds, applyCardReleaseChange, MAX_CARD_RELEASES } = require('./scrum');

const PLANNING_FIELDS = ['sprint', 'releases'];
// Which planning a source can carry. A field a source cannot carry is refused
// when the settings are saved, never silently ignored.
const SOURCE_PLANNING = {
  jira: ['sprint', 'releases'], gitlab: ['sprint', 'releases'],
  github: ['releases'], gitea: ['releases'], forgejo: ['releases'],
};
const NAME_MAX = 200;

function invalid(message) {
  const error = new Error(message); error.code = 'sync-planning-invalid'; throw error;
}
// The planning fields a saved source selects, checked against what it can carry.
function syncPlanningFields(source) {
  const wanted = (source?.fields || []).filter(field => PLANNING_FIELDS.includes(field));
  const allowed = SOURCE_PLANNING[source?.type] || [];
  for (const field of wanted) {
    if (!allowed.includes(field)) invalid(`${source.type} issues have no ${field === 'sprint' ? 'sprint' : 'releases'} to sync.`);
  }
  return wanted;
}

// A date the source gave, or null when it gave none or one that is not a
// real calendar date (a malformed date never stops the record being made).
function sourceDate(value) {
  if (typeof value !== 'string' || !value || value === '<null>') return null;
  if (!/^\d{4}-\d\d-\d\d(?:[T ]\d\d:\d\d(?::\d\d(?:\.\d{1,9})?)?(?:Z|[+-]\d\d:?\d\d)?)?$/.test(value)) return null;
  const date = new Date(value.length === 10 ? `${value}T00:00:00.000Z` : value);
  if (!Number.isFinite(date.getTime())) return null;
  // 2026-02-30 parses as March 2nd: not the date the source meant.
  if (value.length === 10 && date.toISOString().slice(0, 10) !== value) return null;
  const year = date.getUTCFullYear();
  return year >= 1970 && year <= 9999 ? date : null;
}
const nameOf = value => (typeof value === 'string' ? value.trim().slice(0, NAME_MAX) : '');
const idOf = value => ((typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) ||
  (typeof value === 'string' && /^[A-Za-z0-9_.:-]{1,200}$/.test(value)) ? String(value) : '');
// Planned dates only in order; a reversed pair keeps the start alone.
function plannedDates(start, end) {
  const asDate = value => (value instanceof Date ? (Number.isFinite(value.getTime()) ? value : null) : sourceDate(value));
  const plannedStart = asDate(start), plannedEnd = asDate(end);
  return { ...(plannedStart ? { plannedStart } : {}),
    ...(plannedEnd && (!plannedStart || plannedEnd >= plannedStart) ? { plannedEnd } : {}) };
}
const text = value => (typeof value === 'string' ? value.slice(0, 10000) : '');

// One source sprint as a record: { kind, recordId, name, open, ...content }.
// `open` is false for a sprint the source has finished: it is never assigned.
function sprintRecord(recordId, name, open, fields) {
  return recordId && name ? { kind: 'sprint', recordId, name, open, ...fields } : null;
}
function releaseRecord(recordId, name, released, fields) {
  return recordId && name ? { kind: 'release', recordId, name, state: released ? 'released' : 'planned', ...fields } : null;
}

// Jira: the issue's sprint is its active sprint, otherwise the last future one
// listed (as the Jira import chooses). Only closed sprints: the source names no
// open sprint, which says nothing about the WeKan card - unchanged.
function jiraIssuePlanning(issue, fields, sprintField) {
  const result = {};
  const f = issue.fields || {};
  if (fields.includes('sprint') && sprintField && Object.hasOwn(f, sprintField)) {
    const value = f[sprintField];
    const listed = value === null ? [] : Array.isArray(value) ? value : [value];
    const parsed = listed.map(parseJiraSprint);
    if (value === null || (Array.isArray(value) && value.length === 0)) result.sprint = null;
    else if (parsed.every(Boolean)) {
      const open = parsed.filter(sprint => sprint.state !== 'closed');
      const chosen = open.find(sprint => sprint.state === 'active') || open[open.length - 1];
      if (chosen) {
        result.sprint = sprintRecord(chosen.id, chosen.name, true, { goal: chosen.goal,
          ...plannedDates(chosen.startDate, chosen.endDate) });
      }
    }
    // A sprint value in an unknown form: unchanged, never a clear.
  }
  if (fields.includes('releases') && Object.hasOwn(f, 'fixVersions')) {
    const versions = f.fixVersions;
    if (versions === null) result.releases = [];
    else if (Array.isArray(versions)) {
      const records = versions.map(version => version && typeof version === 'object' ? releaseRecord(idOf(version.id),
        nameOf(version.name), version.released === true, { notes: text(version.description),
          ...releaseDates(version.startDate, version.releaseDate, version.released === true) }) : null);
      if (records.every(Boolean)) result.releases = dedupe(records);
    }
  }
  return result;
}
function releaseDates(start, end, released) {
  const dates = plannedDates(start, end);
  return { ...dates, ...(released && dates.plannedEnd ? { releasedAt: dates.plannedEnd } : {}) };
}
const dedupe = records => [...new Map(records.map(record => [record.recordId, record])).values()].slice(0, MAX_CARD_RELEASES);

// GitLab: `iteration` (Premium) and `milestone`. An iteration's state is 1
// upcoming, 2 current, 3 closed (Iterations API); an automatic cadence's
// iteration may have no title, so it is named by its dates.
function gitlabIssuePlanning(issue, fields) {
  const result = {};
  if (fields.includes('sprint') && Object.hasOwn(issue, 'iteration')) {
    const iteration = issue.iteration;
    if (iteration === null) result.sprint = null;
    else if (iteration && typeof iteration === 'object') {
      const recordId = idOf(iteration.id);
      const dates = plannedDates(iteration.start_date, iteration.due_date);
      const name = nameOf(iteration.title) || (dates.plannedStart
        ? `Iteration ${dates.plannedStart.toISOString().slice(0, 10)}${dates.plannedEnd ? ` - ${dates.plannedEnd.toISOString().slice(0, 10)}` : ''}`
        : (idOf(iteration.iid) ? `Iteration ${idOf(iteration.iid)}` : ''));
      // A closed iteration names no sprint the card can be in: unchanged.
      if (iteration.state !== 3 && iteration.state !== 'closed') {
        const record = sprintRecord(recordId, name, true, { goal: text(iteration.description), ...dates });
        if (record) result.sprint = record;
      }
    }
  }
  if (fields.includes('releases') && Object.hasOwn(issue, 'milestone')) {
    const record = milestoneRecord(issue.milestone, 'start_date', 'due_date', ['closed']);
    if (record !== undefined) result.releases = record;
  }
  return result;
}
// A milestone as the issue's releases: [] for none, undefined when malformed.
// A closed milestone is a released one.
function milestoneRecord(milestone, startKey, endKey, closedStates, closedAtKey = null) {
  if (milestone === null) return [];
  if (!milestone || typeof milestone !== 'object') return undefined;
  const released = closedStates.includes(milestone.state);
  const dates = plannedDates(startKey && milestone[startKey], milestone[endKey]);
  const closedAt = closedAtKey ? sourceDate(milestone[closedAtKey]) : null;
  const record = releaseRecord(idOf(milestone.id), nameOf(milestone.title), released, { notes: text(milestone.description),
    ...dates, ...(released && (closedAt || dates.plannedEnd) ? { releasedAt: closedAt || dates.plannedEnd } : {}) });
  return record ? [record] : undefined;
}
function issuesPlanning(issue, fields) {
  const result = {};
  if (fields.includes('releases') && Object.hasOwn(issue, 'milestone')) {
    const record = milestoneRecord(issue.milestone, null, 'due_on', ['closed'], 'closed_at');
    if (record !== undefined) result.releases = record;
  }
  return result;
}

// Every issue's planning, by the external id its task carries
// (models/lib/externalParsers.js): Jira's key, GitLab's iid, the number
// otherwise. `fields` are the selected planning fields.
function sourcePlanning(type, raw, fields) {
  const result = new Map();
  if (!fields.length) return result;
  const issues = Array.isArray(raw) ? raw : (raw && raw.issues) || [];
  const sprintField = type === 'jira' ? jiraPlanningFields(raw).sprint : null;
  for (const issue of issues) {
    if (!issue || typeof issue !== 'object') continue;
    let id, planning;
    if (type === 'jira') { id = issue.key; planning = jiraIssuePlanning(issue, fields, sprintField); }
    else if (type === 'gitlab') { id = issue.iid ?? issue.id; planning = gitlabIssuePlanning(issue, fields); }
    else { if (issue.pull_request) continue; id = issue.number ?? issue.id; planning = issuesPlanning(issue, fields); }
    if (id === undefined || id === null) continue;
    if (Object.keys(planning).length) result.set(String(id), planning);
  }
  return result;
}

// --- The board's records ------------------------------------------------------
const recordKey = (kind, recordId) => `${kind}:${recordId}`;
// A record Sync makes has an id derived from where it came from, so a retried
// or replayed run names the same record and never makes a second one.
function syncRecordId({ boardId, kind, system, origin, recordId }) {
  return `sync-${kind}-${createHash('sha256').update(JSON.stringify([boardId, kind, system, origin, recordId])).digest('hex').slice(0, 24)}`;
}
const fold = name => (typeof name === 'string' ? name.trim().toLowerCase() : '');
const sameOrigin = (provenance, system, origin) => !!provenance && provenance.system === system &&
  (provenance.projectId === origin || provenance.projectId === undefined || provenance.projectId === null);
// A sprint can take work while planned or active (server/scrum.js).
const OPEN_SPRINT = new Set(['planned', 'active']);

// Find each source record on THIS board: by its external id first, then by
// name; otherwise plan to create it. `existing` is { sprints, releases } as
// read for the board; a record of any other board is never used, even if it
// was handed in. Returns { resolved: Map(key -> { _id, kind, state }),
// create: [{ kind, document }] } - `document` without the server-owned
// revision, timestamps and incarnation.
function resolvePlanningRecords({ boardId, system, origin, records, existing }) {
  if (typeof boardId !== 'string' || !boardId) invalid('A board is required.');
  const resolved = new Map(), create = [];
  const pools = {
    sprint: (existing?.sprints || []).filter(row => row && row.boardId === boardId && typeof row._id === 'string'),
    release: (existing?.releases || []).filter(row => row && row.boardId === boardId && typeof row._id === 'string'),
  };
  for (const pool of Object.values(pools)) pool.sort((a, b) => (a._id < b._id ? -1 : a._id > b._id ? 1 : 0));
  for (const record of records) {
    const key = recordKey(record.kind, record.recordId);
    if (resolved.has(key)) continue;
    const pool = pools[record.kind];
    const byId = pool.find(row => sameOrigin(row.provenance, system, origin) && row.provenance.recordId === record.recordId);
    // By name: a record no other source record of this server claims, and for
    // a sprint one that can still take work.
    const byName = byId ? null : pool.find(row => fold(row.name) === fold(record.name) &&
      !(sameOrigin(row.provenance, system, origin) && row.provenance.recordId !== record.recordId) &&
      (record.kind !== 'sprint' || OPEN_SPRINT.has(row.state || 'planned')));
    const found = byId || byName;
    if (found) {
      resolved.set(key, { _id: found._id, kind: record.kind, state: found.state || 'planned' });
      continue;
    }
    const _id = syncRecordId({ boardId, kind: record.kind, system, origin, recordId: record.recordId });
    const provenance = { system, projectId: origin, recordId: record.recordId };
    const document = record.kind === 'sprint'
      ? { _id, boardId, name: record.name, goal: record.goal || '', state: 'planned', provenance,
        ...(record.plannedStart ? { plannedStart: record.plannedStart } : {}),
        ...(record.plannedEnd ? { plannedEnd: record.plannedEnd } : {}) }
      : { _id, boardId, name: record.name, notes: record.notes || '', state: record.state, provenance,
        ...(record.plannedStart ? { plannedStart: record.plannedStart } : {}),
        ...(record.plannedEnd ? { plannedEnd: record.plannedEnd } : {}),
        ...(record.releasedAt ? { releasedAt: record.releasedAt } : {}) };
    create.push({ kind: record.kind, document });
    // A record made now is planned (or released, as the source says).
    resolved.set(key, { _id, kind: record.kind, state: document.state, created: true });
  }
  return { resolved, create };
}
// The source records an issue planning names, for resolvePlanningRecords.
function planningRecords(planningByIssue) {
  const records = [];
  for (const planning of planningByIssue.values()) {
    if (planning.sprint) records.push(planning.sprint);
    for (const release of planning.releases || []) records.push(release);
  }
  return records;
}
// An issue's planning in this board's record ids: sprintId (an id, null, or
// undefined) and releaseIds (ids, or undefined). A finished WeKan sprint is
// never assigned, so it reads as "the source said nothing".
function localPlanning(planning, resolved) {
  if (!planning) return {};
  const result = {};
  if (planning.sprint === null) result.sprintId = null;
  else if (planning.sprint) {
    const found = resolved.get(recordKey('sprint', planning.sprint.recordId));
    if (found && OPEN_SPRINT.has(found.state)) result.sprintId = found._id;
  }
  if (Array.isArray(planning.releases)) {
    const ids = planning.releases.map(release => resolved.get(recordKey('release', release.recordId))?._id);
    if (ids.every(Boolean)) result.releaseIds = [...new Set(ids)];
  }
  return result;
}

// --- One card -----------------------------------------------------------------
// The card's planning after this run, compared with the last planning Sync
// applied (the baseline, `syncLastSource.sprint` and `.releases`, in this
// board's record ids; '' is "no sprint"):
//   - the source changed since the baseline, or there is none: the source's
//     value is applied - except that a clear (no sprint, no release) is applied
//     only against a baseline, so a first Sync never empties local planning;
//   - the source did not change: the card keeps what it has, so a local edit
//     stays until the source changes that issue's planning.
// Releases merge as sets: the releases the source removed since the baseline
// leave the card, the ones it added join it, and a release only WeKan gave the
// card stays. Running it again on its own result changes nothing.
// `card` is { scrum, scrumRevision, syncLastSource } (missing for a new card).
// Returns { changes: { scrum, scrumRevision } | null, baseline }.
function planCardPlanning({ card = {}, incoming = {}, fields }) {
  const scrum = card.scrum && typeof card.scrum === 'object' ? card.scrum : {};
  const previous = card.syncLastSource && typeof card.syncLastSource === 'object' ? card.syncLastSource : {};
  const baseline = {};
  const metadata = {};
  if (fields.includes('sprint') && Object.hasOwn(incoming, 'sprintId') && incoming.sprintId !== undefined) {
    const local = typeof scrum.sprintId === 'string' ? scrum.sprintId : '';
    const source = incoming.sprintId || '';
    const known = typeof previous.sprint === 'string';
    if (source === local) baseline.sprint = source;
    else if (known && previous.sprint === source) baseline.sprint = source;
    else if (!known && source === '') baseline.sprint = '';
    else { metadata.sprintId = source || null; baseline.sprint = source; }
  }
  if (fields.includes('releases') && Array.isArray(incoming.releaseIds)) {
    const local = cardReleaseIds(scrum);
    const source = incoming.releaseIds;
    const known = Array.isArray(previous.releases) ? previous.releases : null;
    let next;
    if (known) {
      const removed = new Set(known.filter(id => !source.includes(id)));
      const added = source.filter(id => !known.includes(id));
      next = [...local.filter(id => !removed.has(id)), ...added.filter(id => !local.includes(id))];
    } else next = [...local, ...source.filter(id => !local.includes(id))];
    next = next.slice(0, MAX_CARD_RELEASES);
    if (JSON.stringify(next) !== JSON.stringify(local)) metadata.releaseIds = next;
    baseline.releases = [...source];
  }
  if (!Object.keys(metadata).length) return { changes: null, baseline };
  let after = applyCardReleaseChange(scrum, metadata);
  if (Object.hasOwn(metadata, 'sprintId')) {
    after = { ...after, sprintId: metadata.sprintId };
    // Historical membership, as a manual change records it (server/scrum.js).
    if (scrum.sprintId && scrum.sprintId !== metadata.sprintId) {
      after.pastSprintIds = [...new Set([...(Array.isArray(scrum.pastSprintIds) ? scrum.pastSprintIds : []), scrum.sprintId])];
    }
  }
  const revision = Number.isSafeInteger(card.scrumRevision) && card.scrumRevision >= 0 ? card.scrumRevision : 0;
  return { changes: { scrum: after, scrumRevision: revision + 1 }, baseline };
}

// --- The saved step -----------------------------------------------------------
// The card scrum keys Sync may change; every other key must stay as it was.
const SYNC_SCRUM_KEYS = ['sprintId', 'pastSprintIds', 'releaseId', 'releaseIds'];
const plain = value => !!value && typeof value === 'object' && !Array.isArray(value) &&
  [Object.prototype, null].includes(Object.getPrototypeOf(value));
const idList = value => Array.isArray(value) && value.length <= 1000 && value.every(id => typeof id === 'string' && id);
// A card's scrum object as a saved step may carry it.
function validStepScrum(scrum) {
  if (!plain(scrum)) return false;
  // The sprint, and the legacy first release (models/lib/scrum.js): an id or null.
  for (const key of ['sprintId', 'releaseId']) {
    if (Object.hasOwn(scrum, key) && scrum[key] !== null && (typeof scrum[key] !== 'string' || !scrum[key])) return false;
  }
  if (Object.hasOwn(scrum, 'releaseIds') && (!idList(scrum.releaseIds) || scrum.releaseIds.length > MAX_CARD_RELEASES)) return false;
  if (Object.hasOwn(scrum, 'pastSprintIds') && !idList(scrum.pastSprintIds)) return false;
  return true;
}
// The baseline values a step may record.
function validPlanningBaseline(key, value) {
  if (key === 'sprint') return typeof value === 'string' && value.length <= 200;
  return idList(value) && value.length <= MAX_CARD_RELEASES;
}
// A planning change in a saved step: only Sync's keys change, the revision
// moves on by one with it (and only with it), and the baseline says the
// change came from the planning mapping. Throws a code string, as the journal does.
function validatePlanningChange(step, fail) {
  const before = step.before || {}, after = step.after;
  const beforeScrum = before.scrum === undefined ? {} : before.scrum;
  const afterScrum = after.scrum === undefined ? {} : after.scrum;
  const encode = value => JSON.stringify(value === undefined ? null : value);
  const changedKeys = [...new Set([...Object.keys(beforeScrum), ...Object.keys(afterScrum)])]
    .filter(key => encode(beforeScrum[key]) !== encode(afterScrum[key]));
  const scrumChanged = changedKeys.length > 0 || (step.kind === 'create' && Object.hasOwn(after, 'scrum'));
  if (step.kind === 'create') {
    if (Object.hasOwn(after, 'scrumRevision') !== Object.hasOwn(after, 'scrum')) fail('invalid-sync-operation-planning');
    if (Object.hasOwn(after, 'scrumRevision') && after.scrumRevision !== 1) fail('invalid-sync-operation-planning');
  } else {
    const revision = value => (value === undefined ? 0 : value);
    const expected = scrumChanged ? revision(before.scrumRevision) + 1 : revision(before.scrumRevision);
    if (revision(after.scrumRevision) !== expected) fail('invalid-sync-operation-planning');
  }
  if (!scrumChanged) return;
  if (changedKeys.some(key => !SYNC_SCRUM_KEYS.includes(key))) fail('sync-operation-unmapped-planning-change');
  const source = after.syncLastSource || {};
  if (!Object.hasOwn(source, 'sprint') && !Object.hasOwn(source, 'releases')) fail('invalid-sync-operation-planning');
  if (changedKeys.some(key => key === 'sprintId' || key === 'pastSprintIds') && !Object.hasOwn(source, 'sprint')) fail('invalid-sync-operation-planning');
  if (changedKeys.some(key => key === 'releaseId' || key === 'releaseIds') && !Object.hasOwn(source, 'releases')) fail('invalid-sync-operation-planning');
  if (Object.hasOwn(afterScrum, 'releaseIds') && (afterScrum.releaseIds[0] ?? null) !== (afterScrum.releaseId ?? null)) {
    fail('invalid-sync-operation-planning');
  }
}

module.exports = { PLANNING_FIELDS, SOURCE_PLANNING, syncPlanningFields, sourceDate, sourcePlanning,
  syncRecordId, resolvePlanningRecords, planningRecords, localPlanning, planCardPlanning,
  SYNC_SCRUM_KEYS, validStepScrum, validPlanningBaseline, validatePlanningChange };
