'use strict';

// Shared data contract for native transfer, duplication and external adapters.
// Authorization, ID allocation and database writes belong to the caller.
const { normalizeScrumSettings, normalizeScrumMetadata, normalizeScrumRecord } = require('./scrum');
const FORMAT = 'wekan-scrum-1';
const own = (value, key) => Object.prototype.hasOwnProperty.call(value, key);
const fail = message => { throw new Error(`Invalid Scrum transfer: ${message}`); };
function object(value, keys) {
  if (!value || Object.getPrototypeOf(value) !== Object.prototype) fail('expected a plain object');
  for (const key of Object.keys(value)) if (!keys.includes(key)) fail(`unsupported field ${key}`);
  return value;
}
function id(value) {
  if (typeof value !== 'string' || !value || value.length > 200 || value.includes('\0')) fail('invalid identifier');
  return value;
}
function rows(value) {
  if (!Array.isArray(value) || value.length > 10000) fail('invalid record array');
  return value;
}
function date(value) {
  const result = normalizeScrumRecord('event', { startsAt: value }).startsAt;
  if (!result) fail('missing timestamp');
  return result;
}
function snapshot(value) {
  object(value, ['at', 'unit', 'estimateSource', 'estimateCustomFieldId', 'completionPolicy', 'workingDays', 'cards', 'missingEstimates', 'totalEstimate', 'partial']);
  const settings = normalizeScrumSettings({ estimateUnit: value.unit, estimateSource: value.estimateSource,
    estimateCustomFieldId: value.estimateCustomFieldId ?? null, completionPolicy: value.completionPolicy });
  if (settings.estimateSource === 'customField' && !settings.estimateCustomFieldId) fail('snapshot estimate field is required');
  const seen = new Set();
  const cards = rows(value.cards).map(row => {
    object(row, ['cardId', 'listId', 'estimate', 'done', 'archived']);
    id(row.cardId); id(row.listId);
    if (seen.has(row.cardId)) fail('duplicate snapshot card');
    seen.add(row.cardId);
    if (row.estimate !== null && (typeof row.estimate !== 'number' || !Number.isFinite(row.estimate) || row.estimate < 0 || row.estimate > 1e12)) fail('invalid snapshot estimate');
    if (typeof row.done !== 'boolean' || typeof row.archived !== 'boolean') fail('invalid snapshot status');
    return { ...row };
  });
  const missingEstimates = cards.filter(row => row.estimate === null).length;
  const totalEstimate = cards.reduce((sum, row) => sum + (row.estimate ?? 0), 0);
  if (missingEstimates !== value.missingEstimates || totalEstimate !== value.totalEstimate) fail('inconsistent snapshot totals');
  if (own(value, 'partial') && typeof value.partial !== 'boolean') fail('invalid partial flag');
  return { at: date(value.at), unit: settings.estimateUnit, estimateSource: settings.estimateSource,
    ...(own(value, 'workingDays') ? { workingDays: normalizeScrumSettings({ workingDays: value.workingDays }).workingDays } : {}),
    estimateCustomFieldId: settings.estimateCustomFieldId, completionPolicy: settings.completionPolicy,
    cards, missingEstimates, totalEstimate, ...(value.partial ? { partial: true } : {}) };
}
const lifecycle = ['state', 'startedAt', 'completedAt', 'cancelledAt', 'cancellationReason', 'rolloverSprintId', 'startSnapshot', 'closeSnapshot'];
const audit = ['createdAt', 'createdBy', 'updatedAt', 'updatedBy'];
function record(kind, value) {
  const { _id, ...fields } = value;
  id(_id);
  const extras = {};
  for (const key of [...audit, ...(kind === 'sprint' ? lifecycle : [])]) {
    if (own(fields, key)) { extras[key] = fields[key]; delete fields[key]; }
  }
  const result = { _id, ...normalizeScrumRecord(kind, fields) };
  if (kind !== 'event' && !result.name) fail('record name is required');
  for (const key of audit) if (own(extras, key)) result[key] = key.endsWith('At') ? date(extras[key]) : id(extras[key]);
  if (kind === 'event' && (!result.sprintId || !result.kind || !result.startsAt)) fail('event requires sprint, kind and timestamp');
  if (kind === 'sprint') {
    if (!['planned', 'active', 'closed', 'cancelled'].includes(extras.state)) fail('invalid sprint state');
    result.state = extras.state;
    for (const key of ['startedAt', 'completedAt', 'cancelledAt']) if (own(extras, key)) result[key] = date(extras[key]);
    if (own(extras, 'cancellationReason')) result.cancellationReason = normalizeScrumRecord('sprint', { goal: extras.cancellationReason }).goal;
    if (own(extras, 'rolloverSprintId')) result.rolloverSprintId = extras.rolloverSprintId === null ? null : id(extras.rolloverSprintId);
    for (const key of ['startSnapshot', 'closeSnapshot']) if (own(extras, key)) result[key] = snapshot(extras[key]);
    if (['active', 'closed'].includes(result.state) && (!result.startSnapshot || !result.startedAt)) fail('started sprint requires a start snapshot');
    if (result.state === 'closed' && (!result.closeSnapshot || !result.completedAt)) fail('closed sprint requires a close snapshot');
    // Native lifecycle methods capture snapshots at the same instant as their
    // lifecycle timestamps. Transfers must not invent another report timeline.
    if (Boolean(result.startSnapshot) !== Boolean(result.startedAt) ||
        (result.state === 'planned' && result.startedAt) ||
        (result.state !== 'closed' && (result.closeSnapshot || result.completedAt || result.rolloverSprintId)) ||
        (result.state !== 'cancelled' && (result.cancelledAt || result.cancellationReason))) {
      fail('inconsistent sprint lifecycle');
    }
    for (const [snapshotKey, timestampKey] of [['startSnapshot', 'startedAt'], ['closeSnapshot', 'completedAt']]) {
      if (result[snapshotKey] && result[snapshotKey].at.getTime() !== result[timestampKey].getTime()) {
        fail(`inconsistent ${snapshotKey} snapshot timestamp`);
      }
    }
    if (result.startSnapshot && result.closeSnapshot) {
      for (const key of ['unit', 'estimateSource', 'estimateCustomFieldId', 'completionPolicy']) {
        if (result.startSnapshot[key] !== result.closeSnapshot[key]) fail(`incompatible sprint snapshot ${key}`);
      }
    }
    if (result.state === 'cancelled' && (!result.cancelledAt || !result.cancellationReason?.trim())) fail('cancelled sprint requires timestamp and reason');
    if (result.completedAt && result.startedAt > result.completedAt) fail('sprint completed before it started');
    if (result.cancelledAt && result.startedAt > result.cancelledAt) fail('sprint cancelled before it started');
  }
  return result;
}
function unique(values) {
  const seen = new Set();
  for (const value of values) { if (seen.has(value._id)) fail('duplicate record identifier'); seen.add(value._id); }
  return values;
}
function normalizeScrumTransfer(value) {
  object(value, ['format', 'settings', 'sprints', 'releases', 'events', 'cards', 'lists', 'swimlanes']);
  if (value.format !== FORMAT) fail('unsupported version');
  const result = { format: FORMAT, settings: normalizeScrumSettings(value.settings) };
  if (result.settings.estimateSource === 'customField' && !result.settings.estimateCustomFieldId) fail('estimate field is required');
  for (const [plural, kind] of [['sprints','sprint'],['releases','release'],['events','event']]) {
    result[plural] = unique(rows(value[plural]).map(value => {
      if (!value || Object.getPrototypeOf(value) !== Object.prototype) fail('invalid planning record');
      return record(kind, value);
    }));
  }
  for (const [plural, kind] of [['cards','card'],['lists','list'],['swimlanes','swimlane']]) {
    result[plural] = unique(rows(value[plural]).map(value => {
      object(value, ['_id', 'scrum']);
      return { _id: id(value._id), scrum: normalizeScrumMetadata(kind, value.scrum) };
    }));
  }
  const sprintIds = new Set(result.sprints.map(row => row._id));
  const releaseIds = new Set(result.releases.map(row => row._id));
  function present(ids, value) { if (value != null && !ids.has(value)) fail(`foreign planning reference ${value}`); }
  for (const row of [...result.events, ...result.cards.map(row => row.scrum), ...result.swimlanes.map(row => row.scrum)]) {
    present(sprintIds, row.sprintId); present(releaseIds, row.releaseId);
    for (const sprintId of row.pastSprintIds || []) present(sprintIds, sprintId);
  }
  const next = new Map(result.sprints.map(row => [row._id, row.rolloverSprintId]));
  for (const row of result.sprints) {
    const seen = new Set([row._id]); let target = row.rolloverSprintId;
    while (target) {
      present(sprintIds, target);
      if (seen.has(target)) fail('cyclic sprint rollover');
      seen.add(target); target = next.get(target);
    }
  }
  return result;
}

// All maps are Maps built by the destination importer, never imported JSON.
// Missing structural references are errors. Explicitly omitted card snapshots
// and unavailable historical actors produce visible losses, never dangling IDs.
function remapScrumTransfer(value, maps) {
  const result = normalizeScrumTransfer(value);
  const losses = [];
  function ref(kind, sourceId, path, optional = false) {
    if (sourceId == null) return null;
    const map = maps[kind];
    if (!(map instanceof Map)) fail(`missing ${kind} ID map`);
    const target = map.get(sourceId);
    if (target !== undefined) return id(target);
    if (!optional) fail(`unmapped ${path}: ${sourceId}`);
    losses.push({ path, sourceId, reason: 'not-transferred' });
    return null;
  }
  function metadata(meta, path) {
    for (const [field, kind] of [['sprintId','sprints'],['releaseId','releases']]) {
      if (own(meta, field)) meta[field] = ref(kind, meta[field], `${path}.${field}`);
    }
    if (meta.pastSprintIds) meta.pastSprintIds = meta.pastSprintIds.map(sourceId => ref('sprints', sourceId, `${path}.pastSprintIds`));
  }
  const settings = result.settings;
  for (const key of ['productOwnerId', 'scrumMasterId']) if (own(settings, key)) settings[key] = ref('users', settings[key], `settings.${key}`, true);
  if (settings.developerIds) settings.developerIds = [...new Set(settings.developerIds.map(sourceId => ref('users', sourceId, 'settings.developerIds', true)).filter(Boolean))];
  if (own(settings, 'estimateCustomFieldId')) settings.estimateCustomFieldId = ref('customFields', settings.estimateCustomFieldId, 'settings.estimateCustomFieldId');
  for (const plural of ['sprints','releases','events']) {
    for (const row of result[plural]) {
      const path = `${plural}.${row._id}`;
      row._id = ref(plural, row._id, `${path}._id`);
      for (const key of ['createdBy','updatedBy']) if (own(row, key)) {
        const actor = ref('users', row[key], `${path}.${key}`, true);
        if (actor) row[key] = actor; else delete row[key];
      }
      metadata(row, path);
      if (own(row, 'rolloverSprintId')) row.rolloverSprintId = ref('sprints', row.rolloverSprintId, `${path}.rolloverSprintId`);
      if (row.followUpCardIds) row.followUpCardIds = [...new Set(row.followUpCardIds.map(sourceId => ref('cards', sourceId, `${path}.followUpCardIds`, true)).filter(Boolean))];
      for (const key of ['startSnapshot','closeSnapshot']) if (row[key]) {
        const snap = row[key]; const beforeCount = snap.cards.length;
        snap.estimateCustomFieldId = ref('customFields', snap.estimateCustomFieldId, `${path}.${key}.estimateCustomFieldId`);
        snap.cards = snap.cards.flatMap(card => {
          const cardId = ref('cards', card.cardId, `${path}.${key}.cards`, true);
          if (!cardId) return [];
          return [{ ...card, cardId, listId: ref('lists', card.listId, `${path}.${key}.listId`) }];
        });
        if (beforeCount !== snap.cards.length) snap.partial = true;
        snap.missingEstimates = snap.cards.filter(card => card.estimate === null).length;
        snap.totalEstimate = snap.cards.reduce((sum, card) => sum + (card.estimate ?? 0), 0);
      }
    }
    unique(result[plural]);
  }
  for (const plural of ['cards','lists','swimlanes']) {
    result[plural] = result[plural].flatMap(row => {
      const targetId = ref(plural, row._id, `${plural}.${row._id}`, true);
      if (!targetId) return [];
      metadata(row.scrum, `${plural}.${row._id}.scrum`);
      return [{ ...row, _id: targetId }];
    });
    unique(result[plural]);
  }
  // Revalidate after mapping too: caller maps can collide even when source
  // identifiers are unique, including cards present only in old snapshots.
  return { transfer: normalizeScrumTransfer(result), losses };
}
function normalizeScrumTransferLosses(value = []) {
  return rows(value).map(row => {
    object(row, ['path', 'sourceId', 'reason']);
    if (typeof row.path !== 'string' || !row.path || row.path.length > 1000) fail('invalid loss path');
    if (!['not-transferred', 'card-or-list-not-exported', 'card-not-exported', 'estimate-field-not-exported'].includes(row.reason)) fail('invalid loss reason');
    return { path: row.path, sourceId: id(row.sourceId), reason: row.reason };
  });
}
module.exports = { SCRUM_TRANSFER_FORMAT: FORMAT, normalizeScrumTransfer, remapScrumTransfer, normalizeScrumTransferLosses };
