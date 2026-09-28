'use strict';
const { EJSON } = require('bson');
const { canonical, sha256 } = require('../../models/lib/changeHistoryIntegrity');
const { notificationActivityIdentity } = require('./syncNotificationPlan');
const { validateWebhookPlan, deliveryId } = require('./syncWebhookPlan');
const copy = value => EJSON.parse(EJSON.stringify(value), { relaxed: true });
const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const keys = (value, expected) => value && typeof value === 'object' && !Array.isArray(value) &&
  Object.keys(value).length === expected.length && expected.every(key => Object.hasOwn(value, key));

// Persist HTTP acceptance before applying a bidirectional response. A crash in
// response processing can then resume without sending the webhook again.
// The caller owns the operation lease; completeResponse must durably acknowledge
// its own effects, not merely return after an unrecorded comment update.
async function deliverStoredWebhookHttp({ item, responses, requestHttp, assertCurrent, assertTarget, completeResponse }) {
  item = copy(item);
  if (!keys(item, ['activity', 'target', 'request', 'deliveryId'])) throw new Error('sync-webhook-http-invalid');
  const { activity, target, request } = item;
  validateWebhookPlan({ version: 1, ...notificationActivityIdentity(activity), targets: [target] }, activity);
  const expectedRequest = target.request && { ...target.request,
    headers: { ...target.request.headers, 'X-Wekan-Delivery-Id': item.deliveryId } };
  if (!expectedRequest || item.deliveryId !== deliveryId(activity._id, target.integrationId) ||
      canonical(request) !== canonical(expectedRequest) ||
      ![requestHttp, assertCurrent, assertTarget].every(fn => typeof fn === 'function') ||
      (request.is2way && typeof completeResponse !== 'function')) throw new Error('sync-webhook-http-invalid');
  const requestHash = sha256(canonical(item)), _id = item.deliveryId;
  async function guard() {
    await assertCurrent();
    if (await assertTarget(copy(target), copy(activity)) !== true) throw new Error('sync-webhook-target-denied');
    await assertCurrent();
  }
  async function read() {
    const row = await responses.findOne({ _id });
    if (!row) return null;
    if (!keys(row, ['_id', 'version', 'requestHash', 'status', 'body', 'checksum']) || row._id !== _id ||
        row.version !== 1 || row.requestHash !== requestHash || !Number.isInteger(row.status) ||
        row.status < 200 || row.status >= 300 || typeof row.body !== 'string' ||
        Buffer.byteLength(row.body, 'utf8') > MAX_RESPONSE_BYTES ||
        row.checksum !== sha256(canonical({ status: row.status, body: row.body }))) {
      throw new Error('sync-webhook-response-invalid');
    }
    return copy(row);
  }
  await guard();
  let saved = await read();
  if (!saved) {
    await guard();
    // The production adapter binds requestHttp to fetchSafe. DNS pinning,
    // private-IP denial and redirect refusal apply to every new attempt.
    const response = await requestHttp(request.url, { method: 'POST', headers: copy(request.headers), body: request.body,
      timeoutMs: 30000, totalTimeoutMs: 30000, maxResponseBytes: MAX_RESPONSE_BYTES, maxRedirects: 0 });
    if (!response || !Number.isInteger(response.status) || response.status < 200 || response.status >= 300) {
      throw new Error('sync-webhook-http-rejected');
    }
    const body = await response.text();
    if (typeof body !== 'string' || Buffer.byteLength(body, 'utf8') > MAX_RESPONSE_BYTES) {
      throw new Error('sync-webhook-response-too-large');
    }
    const candidate = { _id, version: 1, requestHash, status: response.status, body,
      checksum: sha256(canonical({ status: response.status, body })) };
    await guard();
    let failure;
    try { await responses.insertOne(candidate); } catch (error) { failure = error; }
    saved = await read();
    if (!saved) throw failure || new Error('sync-webhook-response-unconfirmed');
  }
  await guard();
  if (request.is2way) {
    let data;
    try { data = JSON.parse(saved.body); } catch { data = null; }
    // Match ordinary webhooks: non-JSON or false/null responses carry no action.
    if (data && await completeResponse({ deliveryId: _id, data: copy(data), activity: copy(activity),
      target: copy(target), assertCurrent: guard }) !== _id) throw new Error('sync-webhook-response-unconfirmed');
  }
  await guard();
  return _id;
}
module.exports = { deliverStoredWebhookHttp, MAX_RESPONSE_BYTES };
