// Canonical Scrum metadata. Pure validation is shared by methods and transfers.
const LIMIT = 10000;
const own = (o, k) => Object.prototype.hasOwnProperty.call(o, k);
function fail(message) { throw new Error(message); }
function object(value, keys) {
  if (!value || typeof value !== 'object' || Array.isArray(value) || Object.getPrototypeOf(value) !== Object.prototype) fail('Expected a plain object');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`Unsupported field: ${key}`);
  return value;
}
function text(value, max = LIMIT) {
  if (typeof value !== 'string' || value.length > max || value.includes('\0')) fail('Invalid text');
  return value;
}
function id(value) { return value === null ? null : text(value, 200) || fail('Empty identifier'); }
function number(value) {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12) fail('Invalid nonnegative number');
  return value;
}
function ids(value) {
  if (!Array.isArray(value) || value.length > 1000) fail('Invalid reference list');
  return [...new Set(value.map(v => { if (v === null) fail('Null reference'); return id(v); }))];
}
function choice(value, options) { if (!options.includes(value)) fail('Invalid option'); return value; }
function date(value) {
  if (value === null) return null;
  if (!(value instanceof Date) && (typeof value !== 'string' || !/^\d{4}-\d\d-\d\d(?:T\d\d:\d\d:\d\d(?:\.\d{1,3})?Z)?$/.test(value))) fail('Use an ISO UTC date');
  const result = new Date(value);
  if (!Number.isFinite(result.getTime())) fail('Invalid date');
  if (typeof value === 'string' && result.toISOString().slice(0, 10) !== value.slice(0, 10)) fail('Invalid calendar date');
  return result;
}
function normalize(value, definitions) {
  object(value, Object.keys(definitions));
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, definitions[key](item)]));
}
function revision(value) { if (!Number.isSafeInteger(value) || value < 0) fail('Invalid revision'); return value; }
const nullableNumber = value => value === null ? null : number(value);
function provenance(value) {
  const result = normalize(value, {
    system: v => text(v, 100), projectId: v => text(v, 500), recordId: v => text(v, 500),
    sourceTimestamp: date, unit: v => text(v, 80),
  });
  return result;
}
const DEFAULT_SCRUM_SETTINGS = Object.freeze({
  enabled: false, productGoal: '', definitionOfDone: '', estimateSource: 'poker',
  estimateCustomFieldId: null, estimateUnit: 'points', completionPolicy: 'dueComplete',
  productOwnerId: null, scrumMasterId: null, developerIds: [], workingDays: [1, 2, 3, 4, 5], visibility: {},
});
function normalizeScrumSettings(value) {
  return normalize(value, {
    visibility: v => normalize(v, Object.fromEntries([
      'cardSprint', 'cardPastSprints', 'cardRelease', 'cardIssueType', 'cardAcceptanceCriteria',
      'cardBacklogRank', 'minicardSprint', 'minicardPastSprints', 'minicardRelease', 'minicardIssueType',
      'minicardAcceptanceCriteria', 'minicardBacklogRank', 'listCategory', 'swimlaneSprint', 'swimlaneRelease', 'swimlanePurpose',
    ].map(key => [key, flag => { if (typeof flag !== 'boolean') fail('Invalid visibility flag'); return flag; }]))),
    enabled: v => { if (typeof v !== 'boolean') fail('Invalid enabled flag'); return v; },
    productGoal: text, definitionOfDone: text,
    estimateSource: v => choice(v, ['poker', 'customField']), estimateCustomFieldId: id,
    estimateUnit: v => text(v, 80).trim() || fail('Estimate unit is required'),
    completionPolicy: v => choice(v, ['dueComplete', 'doneLists']),
    productOwnerId: id, scrumMasterId: id, developerIds: ids,
    workingDays: v => {
      if (!Array.isArray(v) || !v.length || v.length > 7) fail('Invalid working days');
      return [...new Set(v.map(day => choice(day, [1, 2, 3, 4, 5, 6, 7])))];
    },
  });
}
function normalizeScrumMetadata(kind, value) {
  const definitions = {
    card: { sprintId: id, pastSprintIds: ids, backlogRank: nullableNumber, releaseId: id,
      releaseIds: v => { const list = ids(v); if (list.length > MAX_CARD_RELEASES) fail('Too many releases'); return list; },
      issueType: v => text(v, 100), acceptanceCriteria: text },
    list: { category: v => choice(v, ['backlog', 'todo', 'doing', 'done']) },
    swimlane: { sprintId: id, releaseId: id, purpose: v => text(v, 1000) },
  };
  if (!definitions[kind]) fail('Invalid metadata kind');
  return normalize(value, definitions[kind]);
}
// A card's releases (2026-10-08). A card used to have one release,
// `scrum.releaseId`; it now has a list, `scrum.releaseIds`. Nothing is migrated
// in bulk: a card written before keeps `releaseId` alone and is read as a list
// of that one release, and every write from here on stores the list AND keeps
// `releaseId` as its first entry, so an older reader (a downgraded server, an
// older importer, a REST client) still sees a release it knows. Reading both
// fields, and always the same way, is what makes mixed data safe:
//   - `releaseIds` is the list when it is an array;
//   - `releaseId`, when set and not already in it, is one more release, read
//     FIRST - it is what an older writer that knew only that field last set.
// Duplicates collapse, and the result is the same however often it is read or
// written back (cardReleaseIds(withCardReleaseIds(x, cardReleaseIds(x))) is
// cardReleaseIds(x)).
const MAX_CARD_RELEASES = 100;
const releaseIdString = value => typeof value === 'string' && value !== '';
function cardReleaseIds(scrum) {
  if (!scrum || typeof scrum !== 'object') return [];
  const list = Array.isArray(scrum.releaseIds) ? scrum.releaseIds.filter(releaseIdString) : [];
  return [...new Set([...(releaseIdString(scrum.releaseId) ? [scrum.releaseId] : []), ...list])];
}
const hasReleaseFields = scrum => !!scrum && typeof scrum === 'object' && (own(scrum, 'releaseId') || own(scrum, 'releaseIds'));
// The stored form: both fields, the list deduplicated, `releaseId` its first.
function withCardReleaseIds(scrum, releaseIds) {
  const list = [...new Set((releaseIds || []).filter(releaseIdString))];
  return { ...(scrum || {}), releaseId: list[0] ?? null, releaseIds: list };
}
// What one metadata write does to the releases, from the fields it names
// (`changes` already through normalizeScrumMetadata):
//   - `releaseIds` replaces the list; a `releaseId` sent with it must be its
//     first entry (or null with an empty list), never a contradiction;
//   - `releaseId` alone is an older caller's single release: null clears the
//     releases, an id becomes the FIRST release and the others stay - the
//     release that caller showed was the first one, and it cannot see the rest;
//   - neither: the releases stay as they were, in the stored form.
function applyCardReleaseChange(before, changes) {
  const merged = { ...(before || {}), ...changes };
  let list;
  if (own(changes, 'releaseIds')) {
    list = changes.releaseIds;
    if (own(changes, 'releaseId') && changes.releaseId !== (list[0] ?? null)) fail('releaseId must be the first of releaseIds');
  } else if (own(changes, 'releaseId')) {
    list = changes.releaseId === null ? [] : [changes.releaseId, ...cardReleaseIds(before).slice(1)];
  } else {
    if (!hasReleaseFields(before)) return merged;
    list = cardReleaseIds(before);
  }
  return withCardReleaseIds(merged, list);
}
// For files other WeKan versions read (the native Scrum transfer, Jira's
// import plan): one release is written as `releaseId` alone, exactly as before,
// so an older importer still reads it; only a card with several carries
// `releaseIds`, which an older importer refuses as an unknown field instead of
// silently keeping one of them.
function portableCardReleases(scrum) {
  if (!hasReleaseFields(scrum)) return scrum;
  const list = cardReleaseIds(scrum);
  const result = { ...scrum };
  delete result.releaseId; delete result.releaseIds;
  if (list.length) result.releaseId = list[0];
  if (list.length > 1) result.releaseIds = list;
  return result;
}
function normalizeScrumRecord(kind, value) {
  const common = { name: v => text(v, 200).trim() || fail('Name is required'), goal: text,
    plannedStart: date, plannedEnd: date, provenance };
  const definitions = {
    sprint: { ...common, capacity: nullableNumber, capacityUnit: v => text(v, 80) },
    release: { ...common, notes: text, releasedAt: date, state: v => choice(v, ['planned', 'released', 'cancelled']) },
    event: { sprintId: id, kind: v => choice(v, ['planning', 'daily', 'review', 'retrospective']),
      name: common.name, startsAt: date, timeboxMinutes: v => { number(v); if (v > 10080) fail('Timebox too long'); return v; },
      notes: text, followUpCardIds: ids, provenance },
  };
  if (!definitions[kind]) fail('Invalid record kind');
  const result = normalize(value, definitions[kind]);
  if (result.plannedStart && result.plannedEnd && result.plannedStart > result.plannedEnd) fail('Start must precede end');
  return result;
}
function getCardEstimate(card, settings = DEFAULT_SCRUM_SETTINGS) {
  const value = settings.estimateSource === 'customField'
    ? (card.customFields || []).find(field => field._id === settings.estimateCustomFieldId)?.value
    : card.poker?.estimation;
  if (typeof value === 'number') return Number.isFinite(value) && value >= 0 ? value : null;
  if (typeof value === 'string' && /^\d+(?:\.\d+)?$/.test(value)) {
    const n = Number(value); return Number.isFinite(n) ? n : null;
  }
  return null;
}
function isScrumCardDone(card, settings, lists = []) {
  return settings.completionPolicy === 'doneLists'
    ? lists.some(list => list._id === card.listId && list.scrum?.category === 'done')
    : card.dueComplete === true;
}
function sprintSnapshot(cards, settings, lists, at = new Date()) {
  // No card or list cap (maintainer decision of 2026-10-03): the rows are
  // stored in chunks (server/lib/scrumSnapshotStore.js), never in one document.
  const doneLists = settings.completionPolicy === 'doneLists'
    ? new Set(lists.filter(list => list.scrum?.category === 'done').map(list => list._id)) : null;
  const rows = cards.map(card => ({ cardId: card._id, estimate: getCardEstimate(card, settings),
    done: doneLists ? doneLists.has(card.listId) : card.dueComplete === true, archived: card.archived === true, listId: card.listId }));
  return { at, unit: settings.estimateUnit, estimateSource: settings.estimateSource,
    workingDays: [...(settings.workingDays || DEFAULT_SCRUM_SETTINGS.workingDays)],
    estimateCustomFieldId: settings.estimateCustomFieldId, completionPolicy: settings.completionPolicy,
    cards: rows, missingEstimates: rows.filter(row => row.estimate === null).length,
    totalEstimate: rows.reduce((sum, row) => sum + (row.estimate ?? 0), 0) };
}
function scrumRevisionSelector(doc) {
  return own(doc, 'scrumRevision') ? { scrumRevision: doc.scrumRevision } : { scrumRevision: { $exists: false } };
}
module.exports = { DEFAULT_SCRUM_SETTINGS, normalizeScrumSettings, normalizeScrumMetadata,
  normalizeScrumRecord, getCardEstimate, isScrumCardDone, sprintSnapshot, scrumRevisionSelector,
  validateScrumRevision: revision, cardReleaseIds, withCardReleaseIds, applyCardReleaseChange,
  portableCardReleases, MAX_CARD_RELEASES };
