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
      issueType: v => text(v, 100), acceptanceCriteria: text },
    list: { category: v => choice(v, ['backlog', 'todo', 'doing', 'done']) },
    swimlane: { sprintId: id, releaseId: id, purpose: v => text(v, 1000) },
  };
  if (!definitions[kind]) fail('Invalid metadata kind');
  return normalize(value, definitions[kind]);
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
  validateScrumRevision: revision };
