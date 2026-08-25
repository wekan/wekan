'use strict';

const TEXT_FIELDS = new Set([
  'title',
  'listTitle',
  'swimlaneTitle',
  'assigneesKey',
  'membersKey',
  'labelsKey',
]);
const DATE_FIELDS = new Set(['receivedAt', 'startAt', 'dueAt', 'endAt']);

function compareTableViewRows(a, b, field, direction = 'asc') {
  let result = 0;
  const av = a && a[field];
  const bv = b && b[field];

  // Empty values stay at the end in either direction so undated cards do not
  // obscure the useful end of a date sort.
  if (av == null || av === '') result = bv == null || bv === '' ? 0 : 1;
  else if (bv == null || bv === '') result = -1;
  else if (DATE_FIELDS.has(field)) result = new Date(av).getTime() - new Date(bv).getTime();
  else if (TEXT_FIELDS.has(field)) {
    result = String(av).localeCompare(String(bv), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }

  if (result !== 0 && av != null && av !== '' && bv != null && bv !== '') {
    result = direction === 'desc' ? -result : result;
  }
  if (result === 0 && field !== 'title') {
    result = String(a.title || '').localeCompare(String(b.title || ''), undefined, {
      numeric: true,
      sensitivity: 'base',
    });
  }
  return result;
}

function nextTableViewSort(currentField, currentDirection, selectedField) {
  if (currentField === selectedField) {
    return { field: selectedField, direction: currentDirection === 'asc' ? 'desc' : 'asc' };
  }
  return { field: selectedField, direction: 'asc' };
}

module.exports = { compareTableViewRows, nextTableViewSort };
