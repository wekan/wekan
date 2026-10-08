'use strict';
const { randomUUID, createHash } = require('node:crypto');
const { EJSON, calculateObjectSize } = require('bson');
const { normalizeJiraEstimateMapping } = require('../../models/lib/jiraEstimateMapping');
const { GITLAB_ESTIMATES } = require('../../models/lib/listSyncEstimate');
const { validStepScrum, validPlanningBaseline, validatePlanningChange } = require('../../models/lib/listSyncPlanning');

const MAX_STEPS = 10000;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
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
const estimateFields = ['estimate', 'originalEstimate', 'remainingEstimate'];
function estimateIdentity(value, field = 'estimate') {
  if (typeof value !== 'string') fail('invalid-sync-operation-estimate-mapping');
  try {
    const parts = JSON.parse(value);
    if (!Array.isArray(parts) || parts.length !== 3 ||
        typeof parts[0] !== 'string' || !parts[0] || typeof parts[2] !== 'string') throw new Error();
    // GitLab's weight or time estimate (models/lib/listSyncEstimate.js), or a
    // Jira field.
    const gitlab = field === 'estimate' && typeof parts[1] === 'string' && parts[1].startsWith('gitlab:')
      && Object.hasOwn(GITLAB_ESTIMATES, parts[1].slice('gitlab:'.length)) ? parts[1].slice('gitlab:'.length) : null;
    const mapping = gitlab ? { estimateFieldId: `gitlab:${gitlab}`, estimateUnit: GITLAB_ESTIMATES[gitlab] }
      : field === 'estimate'
        ? normalizeJiraEstimateMapping({ estimateFieldId: parts[1], estimateUnit: parts[2] })
        : { estimateFieldId: field === 'originalEstimate' ? 'original' : 'remaining', estimateUnit: 'hours' };
    if (JSON.stringify([parts[0], mapping.estimateFieldId, mapping.estimateUnit]) !== value) throw new Error();
    return parts[0];
  } catch (_) { fail('invalid-sync-operation-estimate-mapping'); }
}
function validateCustomFields(fields) {
  if (fields === null) return;
  if (!Array.isArray(fields) || fields.length > 10000 || Object.keys(fields).length !== fields.length) fail('invalid-sync-operation-custom-fields');
  const ids = new Set();
  for (const field of fields) {
    if (!plain(field) || typeof field._id !== 'string' || !field._id || ids.has(field._id) ||
        Object.keys(field).some(key => !['_id', 'value'].includes(key))) fail('invalid-sync-operation-custom-fields');
    ids.add(field._id);
    if (!Object.hasOwn(field, 'value')) continue;
    const value = field.value;
    const valid = value === null || typeof value === 'string' || typeof value === 'boolean' ||
      (typeof value === 'number' && Number.isFinite(value)) ||
      (value instanceof Date && Number.isFinite(value.getTime())) ||
      (Array.isArray(value) && Object.keys(value).length === value.length &&
        Array.from(value).every(item => typeof item === 'string'));
    if (!valid) fail('invalid-sync-operation-custom-field-value');
  }
}
function validateEstimateChange(step) {
  if (![step.before, step.after].some(snapshot => snapshot && Object.hasOwn(snapshot, 'customFields'))) return;
  const ids = estimateFields.filter(field => Object.hasOwn(step.after.syncLastSource || {}, `${field}Mapping`))
    .map(field => estimateIdentity(step.after.syncLastSource[`${field}Mapping`], field));
  if (!ids.length) fail('invalid-sync-operation-estimate-mapping');
  const unrelated = snapshot => (snapshot?.customFields || []).filter(field => !ids.includes(field._id));
  if (digest(unrelated(step.before)) !== digest(unrelated(step.after))) fail('sync-operation-unmapped-field-change');
  for (const snapshot of [step.before, step.after]) for (const fieldId of ids) {
    const value = snapshot?.customFields?.find(field => field._id === fieldId)?.value;
    if (value !== undefined && value !== null &&
        (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12)) fail('invalid-sync-operation-estimate');
  }
}
function validateStep(step) {
  if (!step || Object.keys(step).sort().join(',') !== 'after,before,cardId,kind' ||
    !['create','update','archive'].includes(step.kind) || typeof step.cardId !== 'string' || !step.cardId ||
    !plain(step.after) ||
    (step.kind === 'create' ? step.before !== null : !plain(step.before))) {
    fail('invalid-sync-operation-step');
  }
  // Snapshots contain Sync-owned fields plus the complete custom-field array
  // needed for an exact conditional write. Only explicitly mapped entries may change.
  // Credentials, source documents and arbitrary application records stay out.
  // `scrum` and `scrumRevision` only with a planning mapping
  // (models/lib/listSyncPlanning.js validatePlanningChange).
  const allowed = new Set(['_id','boardId','listId','swimlaneId','title','description','spentTime','archived',
    'archivedAt','dateLastActivity','sort','customFields','syncExternalId','syncSourceType','syncSourceKey','syncLastSource',
    'scrum','scrumRevision']);
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
    if (Object.hasOwn(snapshot, 'customFields')) validateCustomFields(snapshot.customFields);
    if (Object.hasOwn(snapshot, 'scrum') && !validStepScrum(snapshot.scrum)) fail('invalid-sync-operation-planning');
    if (Object.hasOwn(snapshot, 'scrumRevision') && (!Number.isSafeInteger(snapshot.scrumRevision) || snapshot.scrumRevision < 0)) fail('invalid-sync-operation-planning');
    if (snapshot.syncLastSource !== undefined && snapshot.syncLastSource !== null && (!plain(snapshot.syncLastSource) || Object.keys(snapshot.syncLastSource).some(key => !['title','description','spentTime','sprint','releases', ...estimateFields, ...estimateFields.map(field => `${field}Mapping`)].includes(key)))) fail('invalid-sync-operation-baseline');
  }
  for (const snapshot of [step.before, step.after]) {
    const ids = new Set();
    for (const [key, value] of Object.entries(snapshot?.syncLastSource || {})) {
      if (key === 'sprint' || key === 'releases') {
        if (!validPlanningBaseline(key, value)) fail('invalid-sync-operation-baseline-value');
      } else if (estimateFields.some(field => key === `${field}Mapping`)) {
        const id = estimateIdentity(value, key.slice(0, -'Mapping'.length));
        if (ids.has(id)) fail('invalid-sync-operation-estimate-mapping');
        ids.add(id);
      } else if (estimateFields.includes(key)) {
        if (value !== null && (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1e12)) fail('invalid-sync-operation-estimate');
        estimateIdentity(snapshot.syncLastSource[`${key}Mapping`], key);
      } else if (key === 'spentTime' ? typeof value !== 'number' || !Number.isFinite(value) : typeof value !== 'string') fail('invalid-sync-operation-baseline-value');
    }
  }
  validateEstimateChange(step);
  validatePlanningChange(step, fail);
  if (step.kind === 'archive' && step.after.archived !== true) fail('invalid-sync-operation-archive');
  if (Buffer.byteLength(EJSON.stringify(step, { relaxed: false })) > 1024 * 1024) fail('sync-operation-step-too-large');
  return step;
}

// A delete acknowledgement alone does not establish cleanup. Read back the
// exact scope, including after an error which may have lost a committed reply.
async function removeAndVerify(remove, findRemaining) {
  let writeError;
  try { await remove(); } catch (error) { writeError = error; }
  let remaining;
  try { remaining = await findRemaining(); }
  catch (error) { throw writeError || error; }
  if (remaining !== null) {
    if (writeError) throw writeError;
    fail('sync-operation-cleanup-unconfirmed');
  }
}

function completionProof(row) {
  if (!plain(row) || Object.keys(row).sort().join(',') !== '_id,appliedAt,operationId,planChecksum,scope,total,version' ||
      row.version !== 1 || typeof row._id !== 'string' || !UUID.test(row._id) ||
      typeof row.operationId !== 'string' || !UUID.test(row.operationId) ||
      typeof row.planChecksum !== 'string' || !/^[0-9a-f]{64}$/.test(row.planChecksum) ||
      !Number.isSafeInteger(row.total) || row.total < 0 || row.total > MAX_STEPS ||
      !(row.appliedAt instanceof Date) || !Number.isFinite(row.appliedAt.getTime())) fail('invalid-sync-completion');
  return { _id: row._id, version: 1, operationId: row.operationId,
    scope: identity(row.scope), total: row.total, planChecksum: row.planChecksum, appliedAt: row.appliedAt };
}
async function readCompletion(completions, intentId, scope) {
  const row = await completions.findOne({ _id: intentId });
  if (row === null) return null;
  const proof = completionProof(row);
  if (proof._id !== intentId || digest(proof.scope) !== digest(scope)) fail('sync-completion-scope-changed');
  return proof;
}
async function recordCompletion(completions, operation) {
  const proof = completionProof({ _id: operation.intentId, version: 1, operationId: operation.operationId,
    scope: operation.scope, total: operation.total, planChecksum: operation.planChecksum, appliedAt: operation.completedAt });
  let saved = await readCompletion(completions, proof._id, proof.scope);
  let writeError;
  if (!saved) {
    try { await completions.insertOne(proof); } catch (error) { writeError = error; }
    try { saved = await readCompletion(completions, proof._id, proof.scope); }
    catch (error) { throw writeError || error; }
  }
  if (!saved) throw writeError || new Error('sync-completion-unconfirmed');
  if (digest(saved) !== digest(proof)) fail('sync-completion-conflict');
  return saved;
}

// The caller MUST hold the renewable list lease throughout this call. Ownership
// below fences journal acknowledgements, not in-flight writes in another
// collection. apply() must compare exact before/after states and be idempotent,
// including a write which committed before its acknowledgement was lost.
async function runSyncOperation({ operations, steps, completions, intentId, scope, build, apply, prepareEffects, validateEffects, assertCurrent, now = () => new Date() }) {
  scope = identity(scope);
  const withEffects = prepareEffects !== undefined || validateEffects !== undefined;
  if (withEffects && (typeof prepareEffects !== 'function' || typeof validateEffects !== 'function')) {
    fail('sync-operation-effects-adapter-required');
  }
  if (typeof assertCurrent !== 'function') fail('sync-operation-lease-required');
  if (typeof intentId !== 'string' || !UUID.test(intentId)) fail('sync-operation-intent-required');
  if (!completions || typeof completions.findOne !== 'function' || typeof completions.insertOne !== 'function') fail('sync-operation-completions-required');
  await assertCurrent();
  const receipt = await readCompletion(completions, intentId, scope);
  let operation = await operations.findOne({ _id: scope.listId });
  if (receipt && (!operation || operation.operationId !== receipt.operationId)) {
    if (operation?.intentId === intentId) fail('sync-completion-conflict');
    // The application completed before its marker disappeared. Finish only
    // this receipt's cleanup; a newer list operation must remain untouched.
    await assertCurrent();
    await removeAndVerify(
      () => steps.deleteMany({ operationId: receipt.operationId }),
      () => steps.findOne({ operationId: receipt.operationId }, { projection: { _id: 1 } }),
    );
    await assertCurrent();
    if (await operations.findOne({ _id: scope.listId, operationId: receipt.operationId }) !== null) fail('sync-operation-cleanup-unconfirmed');
    return { operationId: receipt.operationId, total: receipt.total };
  }
  if (operation && (typeof operation.operationId !== 'string' ||
    !UUID.test(operation.operationId))) fail('invalid-sync-operation-identity');
  if (operation && digest(operation.scope) !== digest(scope)) fail('sync-operation-scope-changed');
  if (operation && operation.intentId !== intentId) fail('sync-operation-intent-pending');
  if (receipt && (!['completed', 'cleaning'].includes(operation.state) || operation.checkpoint !== receipt.total ||
      operation.total !== receipt.total || operation.planChecksum !== receipt.planChecksum)) fail('sync-completion-conflict');
  if (operation && operation.effectPlans !== undefined && operation.effectPlans !== true) fail('invalid-sync-operation-effects-mode');
  if (operation && (operation.effectPlans === true) !== withEffects) fail('sync-operation-effects-mode-changed');
  if (!operation) {
    operation = { ...(withEffects ? { effectPlans: true } : {}), _id: scope.listId, operationId: randomUUID(), intentId, scope, state: 'preparing', checkpoint: 0, attempts: 0, startedAt: now() };
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
      const planned = await build({ operationId: operation.operationId, intentId,
        scope: { ...scope }, assertCurrent: guard });
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
        const context = { operationId: operation.operationId, index, assertCurrent: guard };
        const effects = withEffects ? await prepareEffects(planned[index], context) : undefined;
        if (withEffects && (!plain(effects) || await validateEffects(effects, planned[index], context) !== true)) {
          fail('sync-operation-effects-invalid');
        }
        const payload = withEffects ? { step: planned[index], effects } : { step: planned[index] };
        const checksum = digest(withEffects ? payload : payload.step); checksums.push(checksum);
        const stored = { _id: `${operation.operationId}:${index}`, operationId: operation.operationId,
          index, checksum, ...payload };
        if (calculateObjectSize(stored) > 15 * 1024 * 1024) fail('sync-operation-unit-too-large');
        await guard();
        await steps.insertOne(stored);
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
        if (!stored) fail('sync-operation-plan-damaged');
        validateStep(stored.step);
        if (withEffects && (!plain(stored.effects) || await validateEffects(stored.effects, stored.step,
          { operationId: operation.operationId, index, assertCurrent: guard }) !== true)) fail('sync-operation-effects-invalid');
        if (!withEffects && Object.hasOwn(stored, 'effects')) fail('sync-operation-effects-mode-changed');
        if (digest(withEffects ? { step: stored.step, effects: stored.effects } : stored.step) !== stored.checksum ||
            calculateObjectSize(stored) > 15 * 1024 * 1024) fail('sync-operation-plan-damaged');
        for (const snapshot of [stored.step.before,stored.step.after]) {
          if (snapshot && (snapshot.boardId !== scope.boardId || snapshot.listId !== scope.listId)) fail('sync-operation-card-outside-scope');
        }
        checksums.push(stored.checksum);
      }
      if (digest(checksums) !== operation.planChecksum) fail('sync-operation-plan-damaged');
      for (let index = operation.checkpoint; index < operation.total; index++) {
        await guard();
        const stored = await steps.findOne({ _id: `${operation.operationId}:${index}`, operationId: operation.operationId, index });
        if (!stored || digest(withEffects ? { step: stored.step, effects: stored.effects } : stored.step) !== checksums[index]) fail('sync-operation-plan-damaged');
        const outcome = await apply(stored.step, { operationId: operation.operationId, index,
          ...(withEffects ? { effects: stored.effects } : {}), assertCurrent: guard });
        if (!['applied','already-applied'].includes(outcome)) fail('sync-operation-result-unverified');
        await update({ state: 'applying', checkpoint: index }, { checkpoint: index + 1 });
      }
      await update({ state: 'applying', checkpoint: operation.total }, { state: 'completed', completedAt: now() });
    }
    // Persist an immutable completion proof BEFORE removing recovery evidence.
    // The caller must retain intentId across retries, including after cleanup.
    await guard();
    const completed = await operations.findOne(selector);
    if (!completed || !['completed', 'cleaning'].includes(completed.state) || completed.checkpoint !== completed.total) fail('invalid-sync-operation-checkpoint');
    await recordCompletion(completions, completed);
    // Keep the checkpoint until all plan records are removed. A crash during
    // cleanup resumes cleanup, never the already-completed application writes.
    await update({}, { state: 'cleaning' });
    await guard();
    await removeAndVerify(
      () => steps.deleteMany({ operationId: operation.operationId }),
      () => steps.findOne({ operationId: operation.operationId }, { projection: { _id: 1 } }),
    );
    await guard();
    await removeAndVerify(
      () => operations.deleteOne({ ...selector, state: 'cleaning' }),
      () => operations.findOne({ _id: scope.listId }, { projection: { _id: 1 } }),
    );
    return { operationId: operation.operationId, total: operation.total };
  } catch (error) {
    // Keep all recovery evidence. Do not store provider errors or card values
    // in the checkpoint's diagnostics, and never mask the original exception.
    try { await operations.updateOne(selector, { $set: { interruptedAt: now() } }); } catch (_) { /* outcome unknown */ }
    throw error;
  }
}
module.exports = { runSyncOperation, validateStep };
