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
