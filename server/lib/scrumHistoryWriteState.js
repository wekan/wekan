'use strict';
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { METADATA_TYPES, RECORD_TYPES, historyDocument } = require('../../models/lib/scrumHistory');
const fail = () => { throw new Error('Scrum History revision conflict'); };
const validRevision = value => Number.isSafeInteger(value) && value >= 0;
// Matching values alone do not prove this operation wrote them. A later edit
// can return to the same content at a newer revision; retain the checkpoint.
function scrumHistoryWriteState({ type, current, before, after, revision }) {
  if (!METADATA_TYPES.has(type) && !RECORD_TYPES.has(type)) fail();
  if (before === null ? revision !== null : !validRevision(revision)) fail();
  const live = historyDocument(type, current);
  const currentRevision = current ? current[METADATA_TYPES.has(type) ? 'scrumRevision' : 'revision'] ?? 0 : null;
  if (current && !validRevision(currentRevision)) fail();
  const same = (a, b) => canonical(a) === canonical(b);
  if (same(live, after)) {
    const expected = !current ? null : same(before, after) ? revision : before === null ? 1 : revision + 1;
    if (currentRevision !== expected || (current && !validRevision(expected))) fail();
    return 'applied';
  }
  if (!same(live, before) || currentRevision !== revision ||
      (current && !Number.isSafeInteger(revision + 1))) fail();
  return 'pending';
}
module.exports = { scrumHistoryWriteState };
