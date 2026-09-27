const { isDeepStrictEqual: equals } = require('node:util');
const { randomUUID } = require('node:crypto');
const { applyImportStep } = require('./scrumImportWriter');
const names = { boards: 'boards', cards: 'cards', lists: 'lists', swimlanes: 'swimlanes',
  sprints: 'scrumSprints', releases: 'scrumReleases', events: 'scrumEvents', dailyObservations: 'scrumDailySnapshots' };
const updates = new Set(['boards', 'cards', 'lists', 'swimlanes']);
class ScrumRecoveryError extends Error {}
const fail = message => { throw new ScrumRecoveryError(message); };
const object = value => value && typeof value === 'object' && !Array.isArray(value);

function validateStep(row, checkpoint, index) {
  if (!row || row._id !== `${checkpoint.operationId}:${index}` || row.operationId !== checkpoint.operationId ||
      row.boardId !== checkpoint._id || row.index !== index) fail('The recovery plan is incomplete or out of order.');
  const step = row.step;
  if (!object(step) || !Object.hasOwn(names, step.collection) || !object(step.after)) fail('Invalid recovery step.');
  if (updates.has(step.collection)) {
    const fields = step.collection === 'boards' ? ['scrum', 'scrumRevision', 'scrumImportLosses'] : ['scrum', 'scrumRevision'];
    if (step.kind !== 'update' || step.boardId !== checkpoint._id || typeof step.id !== 'string' ||
        (step.collection === 'boards' && step.id !== checkpoint._id) || !object(step.before) ||
        Object.keys(step.before).some(key => !fields.includes(key)) ||
        !equals(Object.keys(step.after).sort(), fields.sort()) || step.after.scrumRevision !== 1) fail('Invalid metadata recovery step.');
  } else if (step.kind !== 'insert' || step.after.boardId !== checkpoint._id ||
      typeof step.after._id !== 'string' || !step.after._id ||
      (step.collection === 'sprints' && step.after.scrumImportPending !== true)) fail('Invalid planning recovery step.');
  return step;
}

function adapter(db, name) {
  const raw = db.collection(name);
  const collection = { insertAsync: doc => raw.insertOne({ ...doc }),
    findOneAsync: id => raw.findOne(typeof id === 'string' ? { _id: id } : id),
    updateAsync: async (selector, change) => (await raw.updateOne(selector, change)).matchedCount };
  collection.direct = collection;
  return collection;
}

async function inspectImport(db, boardId) {
  const checkpoint = await db.collection('scrumImportPending').findOne({ _id: boardId });
  if (!checkpoint) fail('No recoverable Scrum import checkpoint exists for this board.');
  if (typeof checkpoint.operationId !== 'string' || !checkpoint.operationId ||
      !['preparing', 'applying', 'applied', 'cleaning'].includes(checkpoint.state) ||
      !Number.isInteger(checkpoint.total) || checkpoint.total < 1 || checkpoint.total > 70001 ||
      !Number.isInteger(checkpoint.next) || checkpoint.next < 0 || checkpoint.next > checkpoint.total ||
      (checkpoint.state === 'preparing' && checkpoint.next !== 0) ||
      (['applied', 'cleaning'].includes(checkpoint.state) && checkpoint.next !== checkpoint.total)) fail('Invalid recovery checkpoint.');
  if (!await db.collection('boards').findOne({ _id: boardId }, { projection: { _id: 1 } })) fail('The destination board no longer exists.');
  // All target writes and marker removals were acknowledged before this state.
  // A partial private-plan cleanup cannot require those deleted rows again.
  if (checkpoint.state === 'cleaning') return checkpoint;
  const selector = { boardId, operationId: checkpoint.operationId };
  let index = 0, boards = 0;
  const seen = new Set();
  const cursor = db.collection('scrumImportSteps').find(selector).sort({ index: 1 }).limit(checkpoint.total + 1).batchSize(20);
  try {
    for await (const row of cursor) {
      if (index >= checkpoint.total) fail('The recovery plan has unexpected extra steps.');
      const step = validateStep(row, checkpoint, index);
      const id = step.kind === 'insert' ? step.after._id : step.id;
      const identity = JSON.stringify([step.collection, id]);
      if (seen.has(identity)) fail('The recovery plan writes a target more than once.');
      seen.add(identity);
      if (step.collection === 'boards') {
        boards++;
        if (index !== checkpoint.total - 1) fail('Board settings must be the last recovery step.');
      }
      const current = await db.collection(names[step.collection]).findOne({ _id: id });
      if (step.kind === 'insert') {
        let expected = step.after;
        // A stop during final marker cleanup is legal only after every data
        // step was acknowledged. No other differences can be ignored.
        if (checkpoint.state === 'applied' && step.collection === 'sprints' && current && !Object.hasOwn(current, 'scrumImportPending')) {
          expected = { ...expected }; delete expected.scrumImportPending;
        }
        if (current ? !equals(current, expected) : index < checkpoint.next) fail('A planning or observation target changed or disappeared.');
      } else {
        if (!current || (step.collection !== 'boards' && current.boardId !== boardId)) fail('A metadata target moved or disappeared.');
        const matches = values => Object.keys(step.after).every(key =>
          Object.hasOwn(current, key) === Object.hasOwn(values, key) && equals(current[key], values[key]));
        if (!matches(step.after) && (index < checkpoint.next || !matches(step.before))) fail('A metadata target changed.');
      }
      index++;
    }
  } finally { await cursor.close(); }
  if (index !== checkpoint.total || boards !== 1) fail('The recovery plan is incomplete; original import data is required.');
  return checkpoint;
}

async function recoverImport(db, boardId, { offline = false, apply = false } = {}) {
  if (!apply) {
    const claim = await db.collection('scrumImportRecoveryLocks').findOne({ _id: boardId });
    try {
      const checkpoint = await inspectImport(db, boardId);
      return { state: checkpoint.state, total: checkpoint.total, next: checkpoint.next,
        canResume: !claim, claimToken: claim?.token || null, changed: false };
    } catch (error) {
      if (!(error instanceof ScrumRecoveryError)) throw error;
      return { canResume: false, reason: error.message, claimToken: claim?.token || null, changed: false };
    }
  }
  if (!offline) fail('Stop all WeKan and other database writers, then explicitly select offline recovery.');
  const locks = db.collection('scrumImportRecoveryLocks');
  const token = randomUUID();
  try { await locks.insertOne({ _id: boardId, token, createdAt: new Date() }); }
  catch (error) { if (error.code === 11000) fail('Another recovery claim exists. Verify its owner has stopped before clearing it.'); throw error; }
  // No lease timeout: a slow or paused writer must not overlap a replacement.
  // On failure the claim deliberately remains, including ambiguous DB errors.
  const checkpoint = await inspectImport(db, boardId);
  const pending = db.collection('scrumImportPending');
  const identity = { _id: boardId, operationId: checkpoint.operationId };
  async function cleanup() {
    await db.collection('scrumImportSteps').deleteMany({ boardId, operationId: checkpoint.operationId });
    if (!(await pending.deleteOne({ ...identity, state: 'cleaning' })).deletedCount) fail('The recovery checkpoint changed.');
    await locks.deleteOne({ _id: boardId, token });
    return { changed: true, scope: 'scrum', total: checkpoint.total, next: checkpoint.total, state: 'completed' };
  }
  if (checkpoint.state === 'cleaning') return cleanup();
  const collections = Object.fromEntries(Object.entries(names).map(([key, value]) => [key, adapter(db, value)]));
  if (checkpoint.state === 'preparing') {
    if (!(await pending.updateOne({ ...identity, state: 'preparing', next: 0 }, { $set: { state: 'applying' } })).matchedCount) fail('The recovery checkpoint changed.');
    checkpoint.state = 'applying';
  }
  if (checkpoint.state === 'applying') {
    for (let index = checkpoint.next; index < checkpoint.total; index++) {
      const row = await db.collection('scrumImportSteps').findOne({ _id: `${checkpoint.operationId}:${index}` });
      const step = validateStep(row, checkpoint, index);
      await applyImportStep(step, collections, equals);
      if (!(await pending.updateOne({ ...identity, state: 'applying', next: index }, { $set: { next: index + 1 } })).matchedCount) fail('The recovery checkpoint changed.');
    }
    if (!(await pending.updateOne({ ...identity, state: 'applying', next: checkpoint.total }, { $set: { state: 'applied' } })).matchedCount) fail('The recovery checkpoint changed.');
  }
  // Revalidate acknowledged targets before making them usable. Stream the
  // plan a second time instead of trusting saved counters or holding it in RAM.
  await inspectImport(db, boardId);
  const cursor = db.collection('scrumImportSteps').find({ boardId, operationId: checkpoint.operationId,
    'step.collection': 'sprints' }).batchSize(20);
  try {
    for await (const row of cursor) await db.collection('scrumSprints').updateOne(
      { _id: row.step.after._id, boardId }, { $unset: { scrumImportPending: '' } });
  } finally { await cursor.close(); }
  if (!(await pending.updateOne({ ...identity, state: 'applied' }, { $set: { state: 'cleaning' } })).matchedCount) fail('The recovery checkpoint changed.');
  return cleanup();
}

async function clearRecoveryClaim(db, boardId, token, { offline = false } = {}) {
  if (!offline || typeof token !== 'string' || !token) fail('Offline confirmation and the exact stopped recovery claim token are required.');
  if (!(await db.collection('scrumImportRecoveryLocks').deleteOne({ _id: boardId, token })).deletedCount) fail('The recovery claim changed or does not exist.');
  return { cleared: true };
}

module.exports = { ScrumRecoveryError, inspectImport, recoverImport, clearRecoveryClaim };
