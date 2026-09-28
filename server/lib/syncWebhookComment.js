'use strict';
const { randomUUID } = require('node:crypto');
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { exactFieldSelector } = require('../../models/lib/exactFieldSelector');
const { notificationActivityIdentity } = require('./syncNotificationPlan');
const { deliveryId } = require('./syncWebhookPlan');
const PENDING = 'webhookResponsePending';
const REVISION = 'webhookResponseRevision';
const FIELDS = ['_id', 'boardId', 'cardId', 'text', 'createdAt', 'modifiedAt', 'userId'];
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const date = value => value instanceof Date && Number.isFinite(value.getTime());
const fail = () => { throw new Error('sync-webhook-comment-plan-invalid'); };
function contextIdentity(context) {
  notificationActivityIdentity(context.activity);
  if (!text(context.target?.integrationId) || !text(context.target.integrationBoardId) ||
      context.target.request?.is2way !== true) fail();
  return { deliveryId: deliveryId(context.activity._id, context.target.integrationId),
    contextHash: sha256(canonical(context)) };
}
// An invalid/inapplicable reply is an explicit no-action plan. Persist it so a
// later-created comment cannot unexpectedly become the target on replay.
function prepareWebhookCommentPlan({ context, comment, modifiedAt }) {
  context = copy(context);
  const plan = { version: 1, ...contextIdentity(context), change: null };
  const data = context.data;
  if (!data || typeof data !== 'object' || Array.isArray(data) ||
      !['boardId', 'cardId', 'commentId'].every(key => text(data[key])) ||
      typeof data.comment !== 'string' || !data.comment ||
      data.boardId !== context.target.integrationBoardId || data.boardId !== context.activity.boardId ||
      !comment || comment._id !== data.commentId || comment.boardId !== data.boardId || comment.cardId !== data.cardId) return plan;
  const before = {};
  for (const field of FIELDS) if (Object.hasOwn(comment, field)) before[field] = copy(comment[field]);
  plan.change = { before, text: data.comment, modifiedAt: copy(modifiedAt) };
  validateWebhookCommentPlan(plan, context);
  return plan;
}
function validateWebhookCommentPlan(plan, context) {
  const identity = contextIdentity(context);
  if (!keys(plan, ['version', 'deliveryId', 'contextHash', 'change']) || plan.version !== 1 ||
      plan.deliveryId !== identity.deliveryId || plan.contextHash !== identity.contextHash) fail();
  if (plan.change !== null) {
    const { before, text: next, modifiedAt } = plan.change;
    const data = context.data;
    if (!keys(plan.change, ['before', 'text', 'modifiedAt']) || !before || Array.isArray(before) ||
        Object.keys(before).some(key => !FIELDS.includes(key)) ||
        !['_id', 'boardId', 'cardId'].every(key => text(before[key])) || typeof before.text !== 'string' ||
        !date(before.createdAt) || !date(modifiedAt) ||
        (Object.hasOwn(before, 'modifiedAt') && !date(before.modifiedAt)) ||
        (Object.hasOwn(before, 'userId') && !text(before.userId)) ||
        typeof next !== 'string' || !next || before._id !== data?.commentId || before.cardId !== data?.cardId ||
        before.boardId !== data?.boardId || next !== data.comment ||
        before.boardId !== context.activity.boardId || before.boardId !== context.target.integrationBoardId) fail();
  }
  if (calculateObjectSize(plan) > 4 * 1024 * 1024) fail();
  return true;
}
async function ensureWebhookCommentPlan({ plans, context, build, assertCurrent }) {
  context = copy(context);
  const { deliveryId: _id } = contextIdentity(context);
  if (![build, assertCurrent].every(fn => typeof fn === 'function')) fail();
  async function read() {
    const row = await plans.findOne({ _id });
    if (!row) return null;
    if (!keys(row, ['_id', 'plan', 'checksum']) || row._id !== _id) fail();
    validateWebhookCommentPlan(row.plan, context);
    if (row.checksum !== sha256(canonical(row.plan))) fail();
    return copy(row.plan);
  }
  await assertCurrent();
  let saved = await read();
  if (!saved) {
    const plan = copy(await build(copy(context)));
    validateWebhookCommentPlan(plan, context);
    await assertCurrent();
    let failure;
    try { await plans.insertOne({ _id, plan, checksum: sha256(canonical(plan)) }); } catch (error) { failure = error; }
    saved = await read();
    if (!saved) throw failure || new Error('sync-webhook-comment-plan-unconfirmed');
  }
  await assertCurrent();
  return saved;
}
// Internal raw-driver stage: before enabling it, the application must keep both
// marker fields private/client-immutable, register private plans/receipts and
// provide live board/card/comment access checks plus the operation lease guard.
// No replacement, upsert, deletion or ordinary comment hook is performed here.
async function applyWebhookCommentPlan({ comments, receipts, plan, context, assertCurrent }) {
  plan = copy(plan); context = copy(context);
  validateWebhookCommentPlan(plan, context);
  if (typeof assertCurrent !== 'function') fail();
  const receipt = { _id: plan.deliveryId, version: 1, checksum: sha256(canonical(plan)) };
  async function guard() { await assertCurrent(copy(plan), copy(context)); }
  async function readReceipt() {
    const row = await receipts.findOne({ _id: receipt._id });
    if (row && canonical(row) !== canonical(receipt)) throw new Error('sync-webhook-comment-receipt-invalid');
    return !!row;
  }
  async function saveReceipt() {
    await guard();
    let failure;
    try { await receipts.insertOne(receipt); } catch (error) { failure = error; }
    if (!await readReceipt()) throw failure || new Error('sync-webhook-comment-receipt-unconfirmed');
    await guard();
  }
  await guard();
  const confirmed = await readReceipt();
  if (plan.change === null) { if (!confirmed) await saveReceipt(); await guard(); return receipt._id; }
  const { before, text: next, modifiedAt } = plan.change;
  const marker = { ...receipt, commentId: before._id };
  const selector = { _id: before._id, boardId: before.boardId, cardId: before.cardId };
  function revision(row) {
    if (Object.hasOwn(row, REVISION) && !text(row[REVISION])) throw new Error('sync-webhook-comment-revision-invalid');
    return Object.hasOwn(row, REVISION) ? row[REVISION] : { $exists: false };
  }
  let current = await comments.findOne(selector), failure;
  if (confirmed && (!current || canonical(current[PENDING]) !== canonical(marker))) {
    await guard(); return receipt._id;
  }
  if (!current) throw new Error('sync-webhook-comment-missing');
  if (!Object.hasOwn(current, PENDING)) {
    await guard();
    try {
      await comments.updateOne({ ...exactFieldSelector(before, FIELDS), [PENDING]: { $exists: false }, [REVISION]: revision(current) },
        { $set: { text: next, modifiedAt, [PENDING]: marker, [REVISION]: randomUUID() } });
    } catch (error) { failure = error; }
    current = await comments.findOne(selector);
  }
  if (!current || canonical(current[PENDING]) !== canonical(marker)) {
    if (await readReceipt()) { await guard(); return receipt._id; }
    throw failure || new Error('sync-webhook-comment-conflict');
  }
  // The marker proves the text write even if a user subsequently edits or clears
  // the text. Receipt recovery never puts the captured text back.
  await guard();
  if (!await readReceipt()) await saveReceipt();
  await guard();
  try {
    await comments.updateOne({ ...selector, [PENDING]: marker, [REVISION]: revision(current) },
      { $unset: { [PENDING]: '' }, $set: { [REVISION]: randomUUID() } });
  } catch (error) { failure = error; }
  const remaining = await comments.findOne(selector);
  if (remaining && canonical(remaining[PENDING]) === canonical(marker)) throw failure || new Error('sync-webhook-comment-cleanup-unconfirmed');
  await guard();
  return receipt._id;
}
module.exports = { prepareWebhookCommentPlan, validateWebhookCommentPlan, ensureWebhookCommentPlan, applyWebhookCommentPlan, PENDING, REVISION };
