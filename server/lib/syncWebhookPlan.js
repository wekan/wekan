'use strict';
const { EJSON, calculateObjectSize } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { notificationActivityIdentity } = require('./syncNotificationPlan');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const fail = () => { throw new Error('sync-webhook-plan-invalid'); };
const keys = (value, expected) => value && !Array.isArray(value) &&
  Object.keys(value).sort().join(',') === expected.split(',').sort().join(',');
const text = value => typeof value === 'string' && value.length > 0 && value.length <= 1024;
const digest = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
const MAX_BYTES = 15 * 1024 * 1024;
const planId = activityId => sha256(canonical(['sync-webhooks', activityId]));
const deliveryId = (activityId, integrationId) => sha256(canonical(['sync-webhook-delivery', activityId, integrationId]));
function validateTarget(target) {
  if (!keys(target, 'integrationId,integrationHash,integrationBoardId,request') ||
      !text(target.integrationId) || !text(target.integrationBoardId) || !digest(target.integrationHash)) fail();
  const request = target.request;
  // Suppression is part of the immutable snapshot, not a reason to re-render.
  if (request === null) return;
  if (!keys(request, 'url,headers,body,is2way,language') || typeof request.url !== 'string' ||
      request.url.length > 10000 || typeof request.body !== 'string' ||
      typeof request.is2way !== 'boolean' || !text(request.language)) fail();
  let url, body;
  try { url = new URL(request.url); body = JSON.parse(request.body); } catch { fail(); }
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password ||
      !body || typeof body !== 'object' || Array.isArray(body)) fail();
  const headers = request.headers;
  if (!(keys(headers, 'Content-Type') || keys(headers, 'Content-Type,X-Wekan-Token')) ||
      headers['Content-Type'] !== 'application/json' ||
      (Object.hasOwn(headers, 'X-Wekan-Token') && (typeof headers['X-Wekan-Token'] !== 'string' ||
        headers['X-Wekan-Token'].length > 10000 || /[\r\n]/.test(headers['X-Wekan-Token'])))) fail();
  // This validates a snapshot only. The HTTP adapter MUST still use fetchSafe
  // for current DNS/IP checks, including every replay.
}
function validateWebhookPlan(plan, activity) {
  const identity = notificationActivityIdentity(activity);
  if (!keys(plan, 'version,activityId,activityHash,boardId,cardId,actorId,targets') || plan.version !== 1 ||
      Object.entries(identity).some(([key, value]) => plan[key] !== value) ||
      !Array.isArray(plan.targets) || plan.targets.length > 10000) fail();
  const seen = new Set();
  for (const target of plan.targets) {
    validateTarget(target);
    if (seen.has(target.integrationId) || ![plan.boardId, '_global'].includes(target.integrationBoardId)) fail();
    seen.add(target.integrationId);
  }
  if (calculateObjectSize(plan) > MAX_BYTES) fail();
  return true;
}
async function prepareWebhookPlan({ activity, integrations, prepare }) {
  activity = copy(activity);
  const plan = { version: 1, ...notificationActivityIdentity(activity), targets: [] };
  if (!Array.isArray(integrations) || integrations.length > 10000 || typeof prepare !== 'function') fail();
  const saved = copy(integrations), seen = new Set();
  // Reject the complete selection before starting asynchronous preparation.
  for (const integration of saved) {
    if (!text(integration?._id) || seen.has(integration._id) || integration.enabled !== true ||
        ![plan.boardId, '_global'].includes(integration.boardId)) fail();
    seen.add(integration._id);
  }
  let bytes = calculateObjectSize(plan);
  for (const integration of saved) {
    const target = { integrationId: integration._id, integrationHash: sha256(canonical(integration)),
      integrationBoardId: integration.boardId, request: copy(await prepare(copy(integration), copy(activity))) };
    validateTarget(target);
    if (target.request && (target.request.url !== integration.url ||
        target.request.is2way !== (integration.type === 'bidirectional-webhooks') ||
        (target.request.headers['X-Wekan-Token'] || '') !== (integration.token || ''))) fail();
    bytes += calculateObjectSize(target) + 32;
    if (bytes > MAX_BYTES) fail();
    plan.targets.push(target);
  }
  validateWebhookPlan(plan, activity);
  return plan;
}
async function ensureWebhookPlan({ plans, activity, build, assertCurrent }) {
  activity = copy(activity);
  notificationActivityIdentity(activity);
  if (typeof build !== 'function' || typeof assertCurrent !== 'function') fail();
  const _id = planId(activity._id);
  async function read() {
    const row = await plans.findOne({ _id });
    if (!row) return null;
    if (!keys(row, '_id,plan,checksum') || row._id !== _id) fail();
    validateWebhookPlan(row.plan, activity);
    if (row.checksum !== sha256(canonical(row.plan))) fail();
    return copy(row.plan);
  }
  await assertCurrent();
  let plan = await read();
  if (!plan) {
    const candidate = copy(await build(copy(activity)));
    validateWebhookPlan(candidate, activity);
    await assertCurrent();
    let failure;
    try { await plans.insertOne({ _id, plan: candidate, checksum: sha256(canonical(candidate)) }); }
    catch (error) { failure = error; }
    plan = await read();
    if (!plan) throw failure || new Error('sync-webhook-plan-unconfirmed');
  }
  await assertCurrent();
  return plan;
}
// Caller holds the operation lease, verifies live actor/scope/policy, and checks
// the target's current integration identity/configuration before every delivery.
// deliver must acknowledge the passed ID only after HTTP acceptance AND any
// bidirectional response effects. A resolved fetch alone is not that contract.
// Receipts stop confirmed replay. Lost HTTP acceptance before receipt storage
// remains at least once; receivers can deduplicate using this stable ID.
async function deliverWebhookPlan({ plan, activity, receipts, assertCurrent, assertTarget, deliver }) {
  plan = copy(plan); activity = copy(activity);
  validateWebhookPlan(plan, activity);
  if (![assertCurrent, assertTarget, deliver].every(fn => typeof fn === 'function')) fail();
  const checksum = sha256(canonical(plan));
  const receiptFor = target => ({ _id: deliveryId(plan.activityId, target.integrationId),
    version: 1, planId: planId(plan.activityId), checksum, integrationId: target.integrationId });
  async function readReceipt(expected) {
    const row = await receipts.findOne({ _id: expected._id });
    if (row && canonical(row) !== canonical(expected)) throw new Error('sync-webhook-receipt-invalid');
    return !!row;
  }
  async function guard(target) {
    await assertCurrent();
    if (await assertTarget(copy(target), copy(activity)) !== true) throw new Error('sync-webhook-target-denied');
    await assertCurrent();
  }
  // Inspect all existing evidence first: corruption in a later target must not
  // be discovered only after an earlier unacknowledged target has been sent.
  await assertCurrent();
  for (const target of plan.targets) await readReceipt(receiptFor(target));
  for (const target of plan.targets) {
    await guard(target);
    if (!target.request) continue;
    const expected = receiptFor(target);
    if (await readReceipt(expected)) continue;
    await guard(target);
    const request = copy(target.request);
    request.headers['X-Wekan-Delivery-Id'] = expected._id;
    if (await deliver({ request, target: copy(target), activity: copy(activity), deliveryId: expected._id }) !== expected._id) {
      throw new Error('sync-webhook-delivery-unconfirmed');
    }
    await guard(target);
    let failure;
    try { await receipts.insertOne(expected); } catch (error) { failure = error; }
    if (!await readReceipt(expected)) throw failure || new Error('sync-webhook-receipt-unconfirmed');
    await guard(target);
  }
  await assertCurrent();
  return planId(plan.activityId);
}
module.exports = { prepareWebhookPlan, validateWebhookPlan, ensureWebhookPlan, deliverWebhookPlan, planId, deliveryId };
