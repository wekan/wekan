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
async function inspectScrumHistoryWrites({ targets, before, revisions, read, assertCurrent }) {
  if (!Array.isArray(targets) || !Array.isArray(before) || !Array.isArray(revisions) ||
      targets.length !== before.length || targets.length !== revisions.length ||
      typeof read !== 'function' || typeof assertCurrent !== 'function') fail();
  const states = [];
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index], previous = before[index];
    if (!target || !previous || target.type !== previous.type || target.id !== previous.id) fail();
    await assertCurrent();
    const current = await read(target);
    await assertCurrent();
    states.push(scrumHistoryWriteState({ type: target.type, current, before: previous.document,
      after: target.document, revision: revisions[index] }));
  }
  await assertCurrent();
  return states;
}
async function verifyScrumHistoryWrites(options) {
  if ((await inspectScrumHistoryWrites(options)).some(state => state !== 'applied')) fail();
}
module.exports = { scrumHistoryWriteState, inspectScrumHistoryWrites, verifyScrumHistoryWrites };
