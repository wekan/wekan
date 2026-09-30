'use strict';
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { METADATA_TYPES, RECORD_TYPES, historyDocument } = require('../../models/lib/scrumHistory');
const fail = () => { throw new Error('Scrum History revision conflict'); };
const validRevision = value => Number.isSafeInteger(value) && value >= 0;
// Matching values alone do not prove this operation wrote them. A later edit
// can return to the same content at a newer revision; retain the checkpoint.
//
// Nor do matching values and revision prove it is the SAME record: one deleted
// and recreated under the same _id (a restore by someone else) can match both.
// A Scrum record carries a random `incarnation` per lifetime (2026-09-30), and
// the checkpoint saves the one it expects before (`incarnation.before`) and
// after (`incarnation.after`, fresh for a record this operation creates). A
// checkpoint from before incarnations existed has none, and is judged as before.
function incarnationOf(current) {
  return current && typeof current.incarnation === 'string' ? current.incarnation : null;
}
function scrumHistoryWriteState({ type, current, before, after, revision, incarnation }) {
  if (incarnation !== undefined && (!incarnation || typeof incarnation !== 'object' ||
      Object.keys(incarnation).sort().join(',') !== 'after,before' ||
      ![incarnation.before, incarnation.after].every(value => value === null || (typeof value === 'string' && value)))) fail();
  if (!METADATA_TYPES.has(type) && !RECORD_TYPES.has(type)) fail();
  if (before === null ? revision !== null : !validRevision(revision)) fail();
  const live = historyDocument(type, current);
  const currentRevision = current ? current[METADATA_TYPES.has(type) ? 'scrumRevision' : 'revision'] ?? 0 : null;
  if (current && !validRevision(currentRevision)) fail();
  const same = (a, b) => canonical(a) === canonical(b);
  if (same(live, after)) {
    const expected = !current ? null : same(before, after) ? revision : before === null ? 1 : revision + 1;
    if (currentRevision !== expected || (current && !validRevision(expected))) fail();
    if (incarnation && current && incarnationOf(current) !== incarnation.after) fail();
    return 'applied';
  }
  if (!same(live, before) || currentRevision !== revision ||
      (current && !Number.isSafeInteger(revision + 1))) fail();
  if (incarnation && current && incarnationOf(current) !== incarnation.before) fail();
  return 'pending';
}
async function inspectScrumHistoryWrites({ targets, before, revisions, incarnations, read, assertCurrent }) {
  if (!Array.isArray(targets) || !Array.isArray(before) || !Array.isArray(revisions) ||
      targets.length !== before.length || targets.length !== revisions.length ||
      (incarnations !== undefined && (!Array.isArray(incarnations) || incarnations.length !== targets.length)) ||
      typeof read !== 'function' || typeof assertCurrent !== 'function') fail();
  const states = [];
  for (let index = 0; index < targets.length; index++) {
    const target = targets[index], previous = before[index];
    if (!target || !previous || target.type !== previous.type || target.id !== previous.id) fail();
    await assertCurrent();
    const current = await read(target);
    await assertCurrent();
    states.push(scrumHistoryWriteState({ type: target.type, current, before: previous.document,
      after: target.document, revision: revisions[index], incarnation: incarnations?.[index] }));
  }
  await assertCurrent();
  return states;
}
async function verifyScrumHistoryWrites(options) {
  if ((await inspectScrumHistoryWrites(options)).some(state => state !== 'applied')) fail();
}
// What a new checkpoint expects of each target: the live record's incarnation,
// and after the write the same one - or, for a record this operation creates,
// a fresh one chosen now so a replay can recognize its own insert. Metadata
// targets (board, card, list, swimlane) are updated in place and have none.
function plannedIncarnations({ targets, current, newId }) {
  if (!Array.isArray(targets) || !Array.isArray(current) || targets.length !== current.length ||
      typeof newId !== 'function') fail();
  return targets.map((target, index) => {
    if (!RECORD_TYPES.has(target.type)) return { before: null, after: null };
    const was = incarnationOf(current[index]);
    if (!target.document) return { before: was, after: null };
    return { before: was, after: current[index] ? was : newId() };
  });
}
module.exports = { scrumHistoryWriteState, inspectScrumHistoryWrites, verifyScrumHistoryWrites, plannedIncarnations };
