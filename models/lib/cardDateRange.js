import { parseAdvancedFilterDate } from '../../imports/lib/advancedFilter.js';

export const CARD_DATE_RANGE_FIELDS = [
  { id: 'createdAt', label: 'createdAt' }, { id: 'modifiedAt', label: 'modifiedAt' },
  { id: 'receivedAt', label: 'card-received' }, { id: 'startAt', label: 'card-start' },
  { id: 'dueAt', label: 'card-due' }, { id: 'endAt', label: 'card-end' },
  { id: 'listEnteredAt', label: 'filter-date-range-list-entry' },
];

export function cardDateRangeSelector({ field, from = '', to = '', includeMissing = false } = {}) {
  if (!CARD_DATE_RANGE_FIELDS.some(item => item.id === field) || typeof includeMissing !== 'boolean') return null;
  const parse = value => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)
    ? parseAdvancedFilterDate(value) : null;
  const start = from === '' ? null : parse(from), end = to === '' ? null : parse(to);
  if ((from !== '' && !start) || (to !== '' && !end) || (start && end && start.start > end.start)) return null;
  if (!start && !end) return {};
  const selector = { [field]: { $type: 9, ...(start ? { $gte: start.start } : {}), ...(end ? { $lt: end.end } : {}) } };
  return includeMissing ? { $or: [selector, { [field]: null }] } : selector;
}

export const CARD_RECENCY_PRESETS = [
  { id: '', label: 'filter-recency-any' },
  { id: 'day', label: 'filter-recency-day' },
  { id: 'week', label: 'filter-recency-week' },
  { id: 'month', label: 'filter-recency-month' },
  { id: 'older', label: 'filter-recency-older' },
];

// Fixed elapsed periods, deliberately independent of calendar/DST boundaries.
export function cardRecencySelector(value, now = new Date()) {
  if (!value || typeof value !== 'object' || Array.isArray(value) ||
      !(now instanceof Date) || !Number.isFinite(now.getTime())) return null;
  if (Object.keys(value).some(field => !['createdAt', 'modifiedAt'].includes(field))) return null;
  const selector = {};
  for (const field of ['createdAt', 'modifiedAt']) {
    const preset = value[field] ?? '';
    if (!CARD_RECENCY_PRESETS.some(item => item.id === preset)) return null;
    if (!preset) continue;
    const days = preset === 'day' ? 1 : preset === 'week' ? 7 : 30;
    const cutoff = new Date(now.getTime() - days * 86400000);
    selector[field] = preset === 'older'
      ? { $type: 9, $lt: cutoff }
      : { $type: 9, $gte: cutoff, $lte: now };
  }
  return selector;
}
