'use strict';
const { canonical, sha256, rowHashIsValid } = require('../../models/lib/changeHistoryIntegrity');
const fail = () => { throw new Error('Scrum History request conflict'); };
const digest = value => sha256(canonical(value));

function requestIdentity({ userId, boardId, direction, requestId }) {
  if (![userId, boardId].every(value => typeof value === 'string' && value.length > 0) ||
      !['undo', 'redo'].includes(direction) ||
      typeof requestId !== 'string' || !/^[A-Za-z0-9_-]{16,128}$/.test(requestId)) fail();
  // The same caller cannot reuse an ID in another board or direction. Another
  // account cannot read or claim the original caller's request.
  return { _id: `scrum-request-${digest([userId, requestId])}`, version: 1,
    userId, boardId, direction };
}

function verifyRequest(saved, identity) {
  if (!saved || canonical(Object.keys(saved).sort()) !== canonical([
    ...Object.keys(identity), 'selection', 'createdAt', 'checksum'].sort()) ||
      Object.keys(identity).some(key => saved[key] !== identity[key]) ||
      !(saved.createdAt instanceof Date) || !Number.isFinite(saved.createdAt.getTime())) fail();
  const { checksum, ...content } = saved;
  if (checksum !== digest(content)) fail();
  const selection = saved.selection;
  if (!selection || !['empty', 'unsupported', 'scrum'].includes(selection.kind)) fail();
  const keys = selection.kind === 'scrum' ? ['kind', 'rowId', 'sourceHash'] : ['kind'];
  if (canonical(Object.keys(selection).sort()) !== canonical(keys.sort()) ||
      (selection.kind === 'scrum' && (typeof selection.rowId !== 'string' || !selection.rowId ||
        !/^[a-f0-9]{64}$/.test(selection.sourceHash)))) fail();
  return saved;
}

// Persist selection BEFORE mutation. In particular an empty stack stays empty
// for this request even when an edit arrives before the caller retries.
async function prepareScrumHistoryRequest({ requests, context, select, assertAccess, assertUnused, now = () => new Date() }) {
  const identity = requestIdentity(context);
  await assertAccess();
  let saved = await requests.findOneAsync(identity._id);
  if (!saved) {
    await assertUnused(identity._id);
    const row = await select();
    if (row && row.entityType === 'scrum' && (!rowHashIsValid(row) ||
        row.boardId !== identity.boardId || row.userId !== identity.userId)) fail();
    const selection = !row ? { kind: 'empty' } : row.entityType !== 'scrum'
      ? { kind: 'unsupported' } : { kind: 'scrum', rowId: row._id, sourceHash: row.integrityHash };
    const document = { ...identity, selection, createdAt: now() };
    document.checksum = digest(document);
    verifyRequest(document, identity);
    await assertAccess();
    let failure;
    try { await requests.insertAsync(document); }
    catch (error) { failure = error; }
    saved = await requests.findOneAsync(identity._id);
    if (!saved) throw failure || new Error('Scrum History request unconfirmed');
    // Concurrent selections adopt the first stored row, never the loser's
    // in-memory candidate. Lost replies use the same readback.
  }
  await assertAccess();
  return verifyRequest(saved, identity);
}

module.exports = { prepareScrumHistoryRequest, requestIdentity };
