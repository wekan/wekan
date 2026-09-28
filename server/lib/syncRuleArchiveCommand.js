'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRulePlan, planId } = require('./syncRulePlan');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-rule-archive-command-invalid'); };
const fields = ['_id', 'boardId', 'listId', 'swimlaneId', 'parentId', 'title', 'archived', 'archivedAt'];
const date = value => value instanceof Date && Number.isFinite(value.getTime());
function identity({ plan, activity, effectId, index }) {
  validateRulePlan(plan, activity, effectId);
  const invocation = plan.actions[index];
  if (!Number.isSafeInteger(index) || index < 0 ||
      !['archive', 'unarchive'].includes(invocation?.action?.actionType)) fail();
  return { _id: sha256(canonical(['sync-rule-archive', invocation.id])), version: 1,
    invocationId: invocation.id, planId: planId(effectId, activity._id),
    planHash: sha256(canonical(plan)), actorId: plan.actorId, boardId: plan.boardId,
    cardId: plan.cardId, archived: invocation.action.actionType === 'archive' };
}
function snapshot(card, boardId) {
  if (!card || card.boardId !== boardId ||
      !['_id', 'listId', 'swimlaneId'].every(key => typeof card[key] === 'string' && card[key]) ||
      typeof card.title !== 'string' || typeof card.archived !== 'boolean' ||
      (Object.hasOwn(card, 'parentId') && card.parentId !== null && typeof card.parentId !== 'string') ||
      (Object.hasOwn(card, 'archivedAt') && card.archivedAt !== null && !date(card.archivedAt))) fail();
  return copy(Object.fromEntries(fields.filter(key => Object.hasOwn(card, key)).map(key => [key, card[key]])));
}
function validateRuleArchiveCommand(row, context) {
  const base = identity(context);
  if (!row || Object.keys(row).sort().join(',') !==
      [...Object.keys(base), 'createdAt', 'cards', 'checksum'].sort().join(',') ||
      Object.keys(base).some(key => row[key] !== base[key]) || !date(row.createdAt) ||
      !Array.isArray(row.cards) || !row.cards.length || row.cards.length > 1000 ||
      calculateObjectSize(row) > 14 * 1024 * 1024) fail();
  const seen = new Map();
  for (const card of row.cards) {
    if (canonical(snapshot(card, base.boardId)) !== canonical(card) || seen.has(card._id)) fail();
    seen.set(card._id, card);
  }
  const root = row.cards.at(-1);
  if (root._id !== base.cardId || (root.archived === base.archived && row.cards.length !== 1) ||
      (root.archived !== base.archived && seen.has(root.parentId))) fail();
  // Post-order guarantees every descendant precedes its parent, with one root.
  const visited = new Set();
  for (const card of row.cards) {
    if (card !== root && (!seen.has(card.parentId) || visited.has(card.parentId) || card.parentId === card._id)) fail();
    visited.add(card._id);
  }
  const { checksum, ...payload } = row;
  if (checksum !== sha256(canonical(payload))) fail();
  return copy(row);
}
// Freeze the ordinary archive/restore cascade, descendants first. No card
// writes or completion receipts occur here. The owner must hold its lease and
// authorize EVERY captured card, including children in other lists.
async function ensureRuleArchiveCommand({ commands, plan, activity, effectId, index,
  readCard, readChildren, assertCard, assertCurrent, now = () => new Date() }) {
  plan = copy(plan); activity = copy(activity);
  const context = { plan, activity, effectId, index }, base = identity(context);
  if (![readCard, readChildren, assertCard, assertCurrent, now].every(fn => typeof fn === 'function') ||
      !['findOne', 'insertOne'].every(key => typeof commands?.[key] === 'function')) fail();
  const read = async () => {
    await assertCurrent();
    const row = await commands.findOne({ _id: base._id });
    await assertCurrent();
    return row ? validateRuleArchiveCommand(row, context) : null;
  };
  let command = await read();
  if (command) return command;
  const createdAt = now(); if (!date(createdAt)) fail();
  const root = snapshot(await readCard(base.cardId), base.boardId);
  if (root._id !== base.cardId) fail();
  const cards = [], seen = new Set(), stack = [{ card: root, exit: false }];
  let bytes = 0;
  while (stack.length) {
    const { card, exit } = stack.pop();
    if (exit) { cards.push(card); continue; }
    if (seen.has(card._id) || seen.size >= 1000) fail();
    seen.add(card._id); bytes += calculateObjectSize(card) + 32;
    if (bytes > 14 * 1024 * 1024) fail();
    await assertCurrent(); await assertCard(copy(card)); await assertCurrent();
    stack.push({ card, exit: true });
    // Ordinary performAction does nothing at all when the root is in the
    // requested state; otherwise archive()/restore() visits every descendant.
    if (root.archived === base.archived) continue;
    const children = await readChildren(card._id);
    await assertCurrent();
    if (!Array.isArray(children) || seen.size + children.length +
        stack.filter(frame => !frame.exit).length > 1000) fail();
    const sorted = children.map(child => snapshot(child, base.boardId))
      .sort((a, b) => a._id < b._id ? -1 : a._id > b._id ? 1 : 0);
    for (const child of sorted.reverse()) {
      if (child.parentId !== card._id) fail();
      stack.push({ card: child, exit: false });
    }
  }
  const candidate = { ...base, createdAt: new Date(createdAt), cards };
  candidate.checksum = sha256(canonical(candidate));
  validateRuleArchiveCommand(candidate, context);
  await assertCurrent();
  let failure;
  try { await commands.insertOne(copy(candidate)); } catch (error) { failure = error; }
  command = await read();
  if (!command) throw failure || new Error('sync-rule-archive-command-unconfirmed');
  return command;
}
module.exports = { ensureRuleArchiveCommand, validateRuleArchiveCommand };
