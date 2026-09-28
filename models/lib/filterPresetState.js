import { cardDateRangeSelector, cardRecencySelector } from './cardDateRange.js';

export const FILTER_PRESET_SETS = ['labelIds', 'excludedLabelIds', 'members', 'assignees', 'parentId',
  'userId', 'archive', 'hideEmpty', 'customFields', 'cardDependencies'];
export const FILTER_PRESET_TEXTS = ['title', 'text', 'lists', 'advanced'];
export const FILTER_PRESET_DUE = { past: 'past', today: 'today', tomorrow: 'tomorrow',
  thisweek: 'thisWeek', nextweek: 'nextWeek', previousweek: 'previousWeek', nextmonth: 'nextMonth', noDate: 'noDate' };
const own = (obj, key) => Object.prototype.hasOwnProperty.call(obj, key);
function shape(value, keys) {
  return value && !Array.isArray(value) && typeof value === 'object' &&
    Object.keys(value).length === keys.length && keys.every(key => own(value, key));
}
export function validateFilterPresetState(value) {
  const invalid = () => { throw new Error('Invalid saved filter state'); };
  const keys = ['version', 'sets', 'texts', 'labelMode', 'due', 'dateRange', 'movementDate', 'dateRecency', 'columnAge'];
  if (value?.version === 2) keys.push('providers');
  if (!shape(value, keys) ||
      ![1, 2].includes(value.version) || !shape(value.sets, FILTER_PRESET_SETS) || !shape(value.texts, FILTER_PRESET_TEXTS)) invalid();
  if (JSON.stringify(value).length > 65536) invalid();
  for (const field of FILTER_PRESET_SETS) {
    const ids = value.sets[field];
    if (!Array.isArray(ids) || ids.length > 500 || ids.some(id => id !== null && (typeof id !== 'string' || !id || id.length > 256)) ||
        new Set(ids).size !== ids.length) invalid();
  }
  for (const field of FILTER_PRESET_TEXTS) {
    if (typeof value.texts[field] !== 'string' || value.texts[field].length > (field === 'text' ? 512 : 8192)) invalid();
  }
  if (!['or', 'and'].includes(value.labelMode) || (value.due !== null && (typeof value.due !== 'string' || !own(FILTER_PRESET_DUE, value.due)))) invalid();
  for (const key of ['dateRange', 'movementDate']) {
    if (!shape(value[key], ['field', 'from', 'to', 'includeMissing']) || cardDateRangeSelector(value[key]) === null) invalid();
  }
  if (value.movementDate.field !== 'createdAt' || value.movementDate.includeMissing !== false) invalid();
  if (!shape(value.dateRecency, ['createdAt', 'modifiedAt']) ||
      typeof value.dateRecency.createdAt !== 'string' || typeof value.dateRecency.modifiedAt !== 'string' ||
      cardRecencySelector(value.dateRecency) === null) invalid();
  const age = value.columnAge;
  if (!shape(age, ['listId', 'days']) || typeof age.listId !== 'string' || age.listId.length > 256 ||
      !Number.isInteger(age.days) || age.days < 1 || age.days > 365000) invalid();
  if (value.version === 2) {
    const providers = value.providers;
    if (!providers || Object.prototype.toString.call(providers) !== '[object Object]' || Object.keys(providers).length > 100) invalid();
    const jsonValue = (item, depth = 0) => {
      if (depth > 20) return false;
      if (item === null || typeof item === 'string' || typeof item === 'boolean') return true;
      if (typeof item === 'number') return Number.isFinite(item);
      if (Array.isArray(item)) return item.every(child => jsonValue(child, depth + 1));
      if (!item || Object.prototype.toString.call(item) !== '[object Object]') return false;
      return Object.keys(item).every(key => !['__proto__', 'constructor', 'prototype'].includes(key) && jsonValue(item[key], depth + 1));
    };
    for (const [id, saved] of Object.entries(providers)) {
      if (!/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/.test(id) || id.length > 128 ||
          !shape(saved, ['version', 'value']) || !Number.isSafeInteger(saved.version) || saved.version < 1 || !jsonValue(saved.value)) invalid();
    }
  }
  // Return a detached JSON-only state; null encodes an explicit "no value" set entry.
  return JSON.parse(JSON.stringify(value));
}
