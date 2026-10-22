'use strict';

// Index key specs, decided without a database (tests/listSortIndexes.test.cjs).
//
// #6794: the list sort setting (models/users.js allowedSortValues:
// '-modifiedAt', 'title', ...) was handed to ensureIndex as the STRING itself.
// The MongoDB driver reads a string as a field name, so '-modifiedAt' indexed a
// field literally called "-modifiedAt" - on no document, but maintained on
// every list write - and because ensureIndex compared the JSON of a string with
// the JSON of an index key object, "is it there already?" was never true: every
// WeKan process re-created the six at every start and reported "Created the
// missing index" to Admin Panel / Problems each time.

// '-field' -> { field: -1 }, 'field' -> { field: 1 }; a key object as it is;
// anything else -> null.
function indexKeyFromSortValue(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value !== 'string' || !value.trim()) return null;
  const text = value.trim();
  const field = text.startsWith('-') ? text.slice(1) : text;
  if (!field || field.startsWith('-') || field.startsWith('$')) return null;
  return { [field]: text.startsWith('-') ? -1 : 1 };
}

// The indexes the sort options need: one single-field index per field, which
// serves a sort in either direction ('-title' and 'title' -> { title: 1 }).
function listSortIndexKeys(sortValues) {
  const seen = new Set();
  const keys = [];
  for (const value of sortValues || []) {
    const key = indexKeyFromSortValue(value);
    if (!key) continue;
    const field = Object.keys(key)[0];
    if (!field || seen.has(field)) continue;
    seen.add(field);
    keys.push({ [field]: 1 });
  }
  return keys;
}

// The names of the indexes the old code left behind: a SINGLE-field index on a
// field named exactly like a '-' sort value ("-modifiedAt"). Any other index,
// a compound one that merely contains such a field included, is left alone.
function straySortIndexNames(existingIndexes, sortValues) {
  const strayFields = new Set((sortValues || [])
    .filter(v => typeof v === 'string' && v.trim().startsWith('-'))
    .map(v => v.trim()));
  return (existingIndexes || [])
    .filter(idx => idx && idx.key && Object.keys(idx.key).length === 1
      && strayFields.has(Object.keys(idx.key)[0]))
    .map(idx => idx.name);
}

module.exports = { indexKeyFromSortValue, listSortIndexKeys, straySortIndexNames };
