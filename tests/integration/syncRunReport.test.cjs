'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { withSyncRunReport, reportScope } = require('../../server/lib/syncRunReport');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;

test('Sync run reports survive reconnects, isolate list lifetimes and never infer success after failures', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect();
  const reader = await new MongoClient(uri).connect();
  const name = `sync_reports_${new ObjectId().toHexString()}`;
  const reports = client.db(name).collection('reports');
  const remote = reader.db(name).collection('reports');
  t.after(async () => { await client.db(name).dropDatabase(); await client.close(); await reader.close(); });
  const list = { _id: 'list', boardId: 'board', syncCredentialIncarnation: 'one', syncSource: { token: 'SECRET' } };
  await withSyncRunReport(reports, list, async record => {
    const running = await remote.findOne(reportScope(list));
    assert.equal(running.status, 'unfinished');
    assert.equal(running.finishedAt, undefined);
    await record({ fields: 1, source: { occurrences: 1, rows: [{ path: '/issues/*/attachment', reason: 'unmapped', count: 1 }] } });
    return { created: 2, updated: 0, archived: 1, secret: 'SECRET' };
  });
  await reader.close();
  await reader.connect();
  const complete = await remote.findOne(reportScope(list));
  assert.equal(complete.status, 'completed-with-warnings');
  assert.equal(complete.created, 2);assert.equal(complete.updated, 0);assert.ok(complete.finishedAt);
  assert.doesNotMatch(JSON.stringify(complete), /SECRET|token/);
  assert.equal(await remote.countDocuments(reportScope({ ...list, syncCredentialIncarnation: 'two' })), 0);
  assert.equal(await remote.countDocuments(reportScope({ ...list, boardId: 'other' })), 0);
  await withSyncRunReport(reports, list, async () => ({ error: 'SECRET failure', created: 100 }));
  const failure = await remote.findOne({ status: 'failed' });
  assert.equal(failure.created, undefined);assert.doesNotMatch(JSON.stringify(failure), /SECRET/);
  await assert.rejects(withSyncRunReport(reports, list, async () => { throw new Error('SECRET exception'); }), /SECRET exception/);
  assert.equal(await remote.countDocuments({ status: 'failed' }), 2);
  // Simulate unavailable completion writes after the starting record was stored.
  const unavailable = { insertOne: doc => reports.insertOne(doc), findOne: q => reports.findOne(q),
    updateOne: async () => { throw new Error('database unavailable'); } };
  await assert.rejects(withSyncRunReport(unavailable, list, async () => ({ created: 1 })), /unavailable/);
  assert.equal(await remote.countDocuments({ status: 'unfinished', finishedAt: { $exists: false } }), 1);
  for (const [result, status] of [[{created:0,updated:0,archived:0},'completed'],
    [{skipped:true},'skipped'],[{reviewOnly:true},'review-only']]) {
    await withSyncRunReport(reports, { ...list, _id: status }, async () => result);
    assert.equal((await remote.findOne({listId:status})).status,status);
  }
  let called = false;
  await assert.rejects(withSyncRunReport({ insertOne: async () => { throw new Error('no journal'); } }, list,
    async () => { called = true; }), /no journal/);
  assert.equal(called, false);
});
