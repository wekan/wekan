'use strict';
const { randomUUID, createHash } = require('node:crypto');
const { EJSON } = require('bson');

const MAX_STEPS = 10000;
const digest = value => createHash('sha256').update(EJSON.stringify(value, { relaxed: false })).digest('hex');
const fail = code => { throw Object.assign(new Error(code), { code }); };
function identity(scope) {
  if (!scope || Object.keys(scope).sort().join(',') !== 'boardId,incarnation,listId,revision,sourceKey' ||
    !['boardId','listId','sourceKey'].every(key => typeof scope[key] === 'string' && scope[key]) ||
    !['incarnation','revision'].every(key => scope[key] === null || typeof scope[key] === 'string')) fail('invalid-sync-operation-scope');
  return { listId: scope.listId, boardId: scope.boardId, incarnation: scope.incarnation,
    revision: scope.revision, sourceKey: scope.sourceKey };
}
const plain = value => value && typeof value === 'object' && [Object.prototype, null].includes(Object.getPrototypeOf(value));
function validateStep(step) {
  if (!step || Object.keys(step).sort().join(',') !== 'after,before,cardId,kind' ||
    !['create','update','archive'].includes(step.kind) || typeof step.cardId !== 'string' || !step.cardId ||
    !plain(step.after) ||
    (step.kind === 'create' ? step.before !== null : !plain(step.before))) {
    fail('invalid-sync-operation-step');
  }
  // Snapshots contain only Sync-owned card fields. Credentials/configuration,
  // external source documents and arbitrary application records never belong here.
  const allowed = new Set(['_id','boardId','listId','swimlaneId','title','description','spentTime','archived',
    'archivedAt','dateLastActivity','sort','syncExternalId','syncSourceType','syncSourceKey','syncLastSource']);
  for (const snapshot of [step.before, step.after]) {
    if (!snapshot) continue;
    if (snapshot._id !== step.cardId || !['boardId','listId'].every(key => typeof snapshot[key] === 'string' && snapshot[key])) fail('invalid-sync-operation-card');
    if (Object.keys(snapshot).some(key => !allowed.has(key))) fail('invalid-sync-operation-fields');
    for (const key of ['title','description','syncExternalId','syncSourceType','syncSourceKey','swimlaneId']) {
      if (snapshot[key] !== undefined && snapshot[key] !== null && typeof snapshot[key] !== 'string') fail('invalid-sync-operation-value');
    }
    for (const key of ['spentTime','sort']) {
      if (snapshot[key] !== undefined && snapshot[key] !== null && (typeof snapshot[key] !== 'number' || !Number.isFinite(snapshot[key]))) fail('invalid-sync-operation-number');
    }
    if (snapshot.archived !== undefined && snapshot.archived !== null && typeof snapshot.archived !== 'boolean') fail('invalid-sync-operation-archive');
    for (const key of ['archivedAt','dateLastActivity']) {
      if (snapshot[key] !== undefined && snapshot[key] !== null && (!(snapshot[key] instanceof Date) || !Number.isFinite(snapshot[key].getTime()))) fail('invalid-sync-operation-date');
    }
    if (snapshot.syncLastSource !== undefined && snapshot.syncLastSource !== null && (!plain(snapshot.syncLastSource) || Object.keys(snapshot.syncLastSource).some(key => !['title','description','spentTime'].includes(key)))) fail('invalid-sync-operation-baseline');
  }
  for (const snapshot of [step.before, step.after]) {
    for (const [key, value] of Object.entries(snapshot?.syncLastSource || {})) {
      if (key === 'spentTime' ? typeof value !== 'number' || !Number.isFinite(value) : typeof value !== 'string') fail('invalid-sync-operation-baseline-value');
    }
  }
  if (step.kind === 'archive' && step.after.archived !== true) fail('invalid-sync-operation-archive');
  if (Buffer.byteLength(EJSON.stringify(step, { relaxed: false })) > 1024 * 1024) fail('sync-operation-step-too-large');
  return step;
}

// The caller MUST hold the renewable list lease throughout this call. Ownership
// below fences journal acknowledgements, not in-flight writes in another
// collection. apply() must compare exact before/after states and be idempotent,
// including a write which committed before its acknowledgement was lost.
async function runSyncOperation({ operations, steps, scope, build, apply, assertCurrent, now = () => new Date() }) {
  scope = identity(scope);
  if (typeof assertCurrent !== 'function') fail('sync-operation-lease-required');
  await assertCurrent();
  let operation = await operations.findOne({ _id: scope.listId });
  if (operation && (typeof operation.operationId !== 'string' ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(operation.operationId))) fail('invalid-sync-operation-identity');
  if (operation && digest(operation.scope) !== digest(scope)) fail('sync-operation-scope-changed');
  if (!operation) {
    operation = { _id: scope.listId, operationId: randomUUID(), scope, state: 'preparing', checkpoint: 0, attempts: 0, startedAt: now() };
    await operations.insertOne(operation);
  }
  const owner = randomUUID();
  const acquired = await operations.updateOne({ _id: scope.listId, operationId: operation.operationId },
    { $set: { owner, touchedAt: now() }, $inc: { attempts: 1 } });
  if (acquired.matchedCount !== 1) fail('sync-operation-changed');
  const selector = { _id: scope.listId, operationId: operation.operationId, owner };
  const guard = async () => {
    await assertCurrent();
    if (!await operations.findOne(selector)) fail('sync-operation-owner-changed');
  };
  const update = async (expected, fields) => {
    await guard();
    if ((await operations.updateOne({ ...selector, ...expected }, { $set: { ...fields, touchedAt: now() } })).matchedCount !== 1) fail('sync-operation-checkpoint-changed');
  };
  try {
    if (operation.state === 'preparing') {
      // No application writes can have begun. Incomplete preparation may be
      // rebuilt, but orphan steps are removed only for this exact operation.
      await guard();
      await steps.deleteMany({ operationId: operation.operationId });
      const planned = await build();
      if (!Array.isArray(planned) || planned.length > MAX_STEPS) fail('invalid-sync-operation-plan');
      const cardIds = new Set();
      for (const step of planned) {
        validateStep(step);
        if (cardIds.has(step.cardId)) fail('duplicate-sync-operation-card');
        cardIds.add(step.cardId);
        for (const snapshot of [step.before,step.after]) {
          if (snapshot && (snapshot.boardId !== scope.boardId || snapshot.listId !== scope.listId)) fail('sync-operation-card-outside-scope');
        }
      }
      const checksums = [];
      for (let index = 0; index < planned.length; index++) {
        await guard();
        const checksum = digest(planned[index]); checksums.push(checksum);
        await steps.insertOne({ _id: `${operation.operationId}:${index}`, operationId: operation.operationId,
          index, checksum, step: planned[index] });
      }
      await update({ state: 'preparing' }, { state: 'applying', total: planned.length, planChecksum: digest(checksums), checkpoint: 0 });
      operation = await operations.findOne(selector);
    }
    if (!['applying','completed','cleaning'].includes(operation.state) || !Number.isSafeInteger(operation.total) ||
      operation.total < 0 || operation.total > MAX_STEPS || !Number.isSafeInteger(operation.checkpoint) ||
      operation.checkpoint < 0 || operation.checkpoint > operation.total) fail('invalid-sync-operation-checkpoint');
    if (operation.state !== 'applying' && operation.checkpoint !== operation.total) fail('invalid-sync-operation-checkpoint');
    if (operation.state === 'applying') {
      // Validate the entire persisted plan before any writes on every resume.
      // One-document payloads stay bounded; only checksums are retained here.
      const checksums = [];
      for (let index = 0; index < operation.total; index++) {
        await guard();
        const stored = await steps.findOne({ _id: `${operation.operationId}:${index}`, operationId: operation.operationId, index });
        if (!stored || digest(validateStep(stored.step)) !== stored.checksum) fail('sync-operation-plan-damaged');
        for (const snapshot of [stored.step.before,stored.step.after]) {
          if (snapshot && (snapshot.boardId !== scope.boardId || snapshot.listId !== scope.listId)) fail('sync-operation-card-outside-scope');
        }
        checksums.push(stored.checksum);
      }
      if (digest(checksums) !== operation.planChecksum) fail('sync-operation-plan-damaged');
      for (let index = operation.checkpoint; index < operation.total; index++) {
        await guard();
        const stored = await steps.findOne({ _id: `${operation.operationId}:${index}`, operationId: operation.operationId, index });
        if (!stored || digest(stored.step) !== checksums[index]) fail('sync-operation-plan-damaged');
        const outcome = await apply(stored.step, { operationId: operation.operationId, index, assertCurrent: guard });
        if (!['applied','already-applied'].includes(outcome)) fail('sync-operation-result-unverified');
        await update({ state: 'applying', checkpoint: index }, { checkpoint: index + 1 });
      }
      await update({ state: 'applying', checkpoint: operation.total }, { state: 'completed', completedAt: now() });
    }
    // Keep the checkpoint until all plan records are removed. A crash during
    // cleanup resumes cleanup, never the already-completed application writes.
    await update({}, { state: 'cleaning' });
    await guard();
    await steps.deleteMany({ operationId: operation.operationId });
    await guard();
    await operations.deleteOne({ ...selector, state: 'cleaning' });
    return { operationId: operation.operationId, total: operation.total };
  } catch (error) {
    // Keep all recovery evidence. Do not store provider errors or card values
    // in the checkpoint's diagnostics, and never mask the original exception.
    try { await operations.updateOne(selector, { $set: { interruptedAt: now() } }); } catch (_) { /* outcome unknown */ }
    throw error;
  }
}
module.exports = { runSyncOperation, validateStep };
