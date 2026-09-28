'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { validateRuleArchiveCommand } = require('./syncRuleArchiveCommand');
const { archiveUnits, applyRuleArchiveCommand } = require('./syncRuleArchiveApply');
const { prepareSyncFieldHistory } = require('./syncHistoryBatch');
const { prepareSyncUpdateActivities } = require('./syncUpdateActivities');
const { validateSyncEffects, persistSyncEffects } = require('./syncEffects');
const { validateSyncEffectPolicy, assertSyncEffectPolicy } = require('./syncEffectPolicy');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-rule-archive-effects-invalid'); };
function stepFor(unit) {
  // parentId is part of the mutation predicate, not a changed History field.
  const clean = card => { const result = copy(card); delete result.parentId; return result; };
  return { kind: 'archive', cardId: unit.cardId, before: clean(unit.before), after: clean(unit.after) };
}
function validateRuleArchiveEffects(saved, command, context) {
  command = validateRuleArchiveCommand(command, context);
  const units = archiveUnits(command, context);
  if (!saved || Object.keys(saved).sort().join(',') !== '_id,checksum,commandHash,previousHash,rows,version' ||
      saved._id !== command._id || saved.version !== 1 || saved.commandHash !== command.checksum ||
      (saved.previousHash !== null && !/^[a-f0-9]{64}$/.test(saved.previousHash)) ||
      !Array.isArray(saved.rows) || saved.rows.length !== units.length || calculateObjectSize(saved) > 14 * 1024 * 1024) fail();
  let previousHash = saved.previousHash, changed = false;
  for (let i = 0; i < units.length; i++) {
    const effects = saved.rows[i], unit = units[i];
    validateSyncEffects(effects, stepFor(unit), unit.effectId);
    if (effects.version !== 2 || effects.history.userId !== command.actorId ||
        (i && canonical(effects.policy) !== canonical(saved.rows[0].policy))) fail();
    const history = effects.history;
    if (history.rows.length) {
      if (history.rows[0].previousHash !== previousHash || (changed && history.redo.length)) fail();
      previousHash = history.rows.at(-1).integrityHash; changed = true;
    }
    if (history.rows.some(row => row.createdAt.getTime() !== command.createdAt.getTime()) ||
        (effects.activities && effects.activities.context.createdAt.getTime() !== command.createdAt.getTime())) fail();
  }
  const { checksum, ...payload } = saved;
  if (checksum !== sha256(canonical(payload))) fail();
  return copy(saved);
}
function prepareRuleArchiveEffects({ command, plan, activity, effectId, index, username, lists,
  previousHash = null, redoRows = [], policy }) {
  const context = { plan, activity, effectId, index };
  command = validateRuleArchiveCommand(command, context);
  policy = validateSyncEffectPolicy(policy);
  if (typeof username !== 'string' || !Array.isArray(lists) || lists.length > 1000) fail();
  const byId = new Map();
  for (const list of lists) {
    if (!list || typeof list._id !== 'string' || !list._id || list.boardId !== command.boardId ||
        typeof list.title !== 'string' || byId.has(list._id)) fail();
    byId.set(list._id, list);
  }
  const saved = { _id: command._id, version: 1, commandHash: command.checksum, previousHash, rows: [] };
  let head = previousHash, redo = redoRows, bytes = 0;
  for (const unit of archiveUnits(command, context)) {
    const step = stepFor(unit);
    const options = { step, effectId: unit.effectId, userId: command.actorId, createdAt: command.createdAt };
    const history = prepareSyncFieldHistory({ ...options, previousHash: head, redoRows: redo });
    const activities = policy.activities ? prepareSyncUpdateActivities({ ...options, username,
      list: byId.get(unit.after.listId) }) : null;
    const row = { version: 2, policy: { ...policy }, history, activities };
    bytes += calculateObjectSize(row) + 32;
    if (bytes > 14 * 1024 * 1024) fail();
    saved.rows.push(row);
    head = history.rows.at(-1)?.integrityHash ?? head;
    if (history.rows.length) redo = [];
  }
  saved.checksum = sha256(canonical(saved));
  return validateRuleArchiveEffects(saved, command, context);
}
async function ensureRuleArchiveEffects({ effects, command, build, assertCurrent, ...context }) {
  command = validateRuleArchiveCommand(command, context);
  if (typeof build !== 'function' || typeof assertCurrent !== 'function' ||
      !['findOne', 'insertOne'].every(key => typeof effects?.[key] === 'function')) fail();
  const read = async () => {
    await assertCurrent(); const row = await effects.findOne({ _id: command._id }); await assertCurrent();
    return row ? validateRuleArchiveEffects(row, command, context) : null;
  };
  let saved = await read();
  if (!saved) {
    const candidate = validateRuleArchiveEffects(await build(copy(command)), command, context);
    await assertCurrent(); let failure;
    try { await effects.insertOne(copy(candidate)); } catch (error) { failure = error; }
    saved = await read();
    if (!saved) throw failure || new Error('sync-rule-archive-effects-unconfirmed');
  }
  return saved;
}
async function applyRuleArchiveEffects(options) {
  const { command, history, activities, completeDelivery, readPolicy, assertCurrent } = options;
  const saved = validateRuleArchiveEffects(options.effects, command, options);
  if (typeof assertCurrent !== 'function' || typeof readPolicy !== 'function' ||
      !['findOneAsync', 'insertAsync', 'updateAsync'].every(key => typeof history?.[key] === 'function')) fail();
  const units = archiveUnits(command, options);
  const guard = async () => {
    await assertCurrent();
    if (saved.rows.length) await assertSyncEffectPolicy(saved.rows[0].policy, readPolicy);
    await assertCurrent();
  };
  const rows = new Map(units.map((unit, i) => [unit.effectId, { unit, effects: saved.rows[i] }]));
  if (saved.rows.some(row => row.policy.activities) && (typeof completeDelivery !== 'function' ||
      !['findOneAsync', 'insertAsync'].every(key => typeof activities?.[key] === 'function'))) fail();
  return applyRuleArchiveCommand({ ...options, assertCurrent: guard,
    preflightEffects: async () => { await guard(); },
    completeEffects: async ({ unit, assertCurrent: checkCard }) => {
      const row = rows.get(unit.effectId);
      if (!row || canonical(unit) !== canonical(row.unit)) fail();
      return persistSyncEffects({ history, activities, plan: row.effects, step: stepFor(unit),
        effectId: unit.effectId, assertCurrent: checkCard, completeDelivery, readPolicy });
    } });
}
module.exports = { archiveEffectStep: stepFor, prepareRuleArchiveEffects, validateRuleArchiveEffects, ensureRuleArchiveEffects, applyRuleArchiveEffects };
