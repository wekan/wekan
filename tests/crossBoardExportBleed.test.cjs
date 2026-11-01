'use strict';
// CrossBoardExportBleed (GHSA-8885-xrq4-j47h).
//
// 1. A board export scoped to a checklist (?checklistId=) streamed THAT
//    checklist, its items and its creator even when the checklist was on a
//    card of another, private board: the checklist selectors were not bound to
//    the exported board's cards.
// 2. "Disable all export" and "Anonymize export users" were honoured by the
//    JSON export only. The streaming CSV/TSV the advisory names - and, found
//    while fixing it, the Excel, PDF, chart, calendar and external-format
//    exporters - asked neither.
//
// The tests drive the shared helpers themselves, and then read the source so
// that no export route and no exporter that names people can skip them.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const read = rel => fs.readFileSync(path.join(root, rel), 'utf8');

// importExportSecurity.js is an ES module that requires Meteor paths at run
// time; a bare `require` in it resolves to this global stub.
const state = { settings: {}, board: null, users: [], records: [] };
globalThis.require = name => {
  if (name === '/models/settings') return { default: { findOneAsync: async () => state.settings } };
  if (name === '/imports/reactiveCache') return { ReactiveCache: {
    getBoard: async () => state.board,
    getUsers: async selector => state.users.filter(u => selector._id.$in.includes(u._id)).map(u => ({ ...u })),
  } };
  if (name === '/server/lib/securityLog') return { record: evt => state.records.push(evt) };
  if (name === 'meteor/meteor') return { Meteor: { Error: class extends Error { constructor(error, reason) { super(reason); this.error = error; } } } };
  throw new Error(`unexpected require ${name}`);
};
const helpers = import(`data:text/javascript;base64,${Buffer.from(read('models/lib/importExportSecurity.js')).toString('base64')}`);
const reset = (settings = {}) => Object.assign(state, { settings, board: null, users: [], records: [] });
function fakeRes() {
  return { status: null, body: null, headersSent: false,
    writeHead(code) { this.status = code; this.headersSent = true; },
    end(text) { this.body = text; } };
}

test('Finding 1: a checklist scope only matches a checklist on one of the exported board\'s cards', () => {
  const exporter = read('models/exporter.js');
  assert.match(exporter, /\? \{ _id: this\._scope\.checklistId, cardId: \{ \$in: cardIds \} \}/);
  assert.match(exporter, /\? \{ checklistId: this\._scope\.checklistId, cardId: \{ \$in: cardIds \} \}/);
  // An attempt from another board is recorded; a deleted checklist is not.
  assert.match(exporter, /if \(checklist\) \{\s*const card = await ReactiveCache\.getCard\(checklist\.cardId\);\s*if \(!card \|\| card\.boardId !== boardId\)[\s\S]{0,200}key: 'authz\.export-checklist-scope'/);
});

test('negative: nowhere is a scoped checklist or its items selected by id alone', () => {
  const { execFileSync } = require('node:child_process');
  const files = execFileSync('git', ['ls-files', 'models', 'server'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(f => /\.(js|cjs|mjs)$/.test(f));
  const offenders = [];
  for (const file of files) {
    const text = read(file);
    for (const m of text.matchAll(/\{\s*(_id|checklistId):\s*[\w.]*scope\.checklistId\s*\}/g)) offenders.push(`${file}: ${m[0]}`);
  }
  assert.deepEqual(offenders, []);
});

test('the export switch: refused with 403 before anything is written, and recorded', async () => {
  const { refuseDisabledExport, assertExportEnabled } = await helpers;
  reset({ disableAllExport: false });
  const open = fakeRes();
  assert.equal(await refuseDisabledExport(open), false);
  assert.equal(open.status, null, 'an allowed export is not touched');
  assert.deepEqual(state.records, []);

  reset({ disableAllExport: true });
  const res = fakeRes();
  assert.equal(await refuseDisabledExport(res, 'export:csv'), true);
  assert.equal(res.status, 403);
  assert.equal(res.body, 'Export is disabled by the administrator.');
  assert.deepEqual(state.records.map(r => [r.key, r.action, r.source]), [['authz.export-disabled', 'blocked', 'export:csv']]);
  await assert.rejects(assertExportEnabled('export:trello'), err => err.error === 'export-disabled');
  assert.equal(state.records.at(-1).key, 'authz.export-disabled', 'the method path records it too');
});

test('the switch never costs the account: a page opened before it still shows the menus', () => {
  const { categoryFor } = require('../models/lib/securityCategories.js');
  assert.equal(categoryFor('authz.export-disabled').blocksAccount, false);
  assert.equal(categoryFor('authz.export-disabled').bleed, 'CrossBoardExportBleed');
  assert.equal(categoryFor('authz.export-checklist-scope').bleed, 'CrossBoardExportBleed');
});

test('negative: every HTTP export route asks the switch first', () => {
  const { execFileSync } = require('node:child_process');
  const files = execFileSync('git', ['ls-files', 'models', 'server'], { cwd: root, encoding: 'utf8' })
    .split('\n').filter(f => /\.(js|cjs|mjs)$/.test(f));
  const routes = [];
  const offenders = [];
  for (const file of files) {
    const text = read(file);
    const re = /WebApp\.handlers\.(?:get|use|post)\(\s*([`'"])([^`'"]+)\1\s*,\s*safeRoute\(async function \(req, res\) \{\n([^\n]*\n[^\n]*\n)/g;
    for (const m of text.matchAll(re)) {
      const route = m[2];
      if (!/export|\.ics\b/i.test(route) || /\/import/.test(route)) continue;
      routes.push(route);
      if (!/refuseDisabledExport\(res\)\) return;/.test(m[3])) offenders.push(`${file}: ${route}`);
    }
  }
  // The routes found are the ones known to exist, so the scan cannot pass by
  // matching nothing.
  for (const known of ['/api/boards/:boardId/export', '/api/boards/:boardId/export/csv', '/api/boards/:boardId/exportExcel',
    '/api/boards/:boardId/exportPDF', '/api/boards/:boardId/calendar.ics', '/api/boards/:boardId/charts/:chartKey/exportExcel',
    '/api/export-all-boards/:format']) assert.ok(routes.includes(known), `${known} is scanned`);
  assert.ok(routes.length >= 13, routes.join('\n'));
  assert.deepEqual(offenders, []);
});

test('anonymization: off leaves everything, on rewrites names, mentions of members, requested-by and comments', async () => {
  const { anonymizeExportIdentities } = await helpers;
  reset({ anonymizeExportUsers: false });
  const plain = [{ _id: 'u1', username: 'alice' }];
  assert.equal(await anonymizeExportIdentities({ boardId: 'b', users: plain }), null);
  assert.equal(plain[0].username, 'alice');

  reset({ anonymizeExportUsers: true });
  state.board = { _id: 'b', members: [{ userId: 'u1' }, { userId: 'u2' }] };
  state.users = [{ _id: 'u2', username: 'bob' }];
  const users = [{ _id: 'u1', username: 'alice', profile: { fullname: 'Alice A', initials: 'AA', avatarUrl: '/a.png' } }];
  const cards = [{ title: 'Ask @bob and @alice', description: 'cc @alice', requestedBy: 'alice', assignedBy: 'bob' }];
  const comments = [{ text: 'thanks @bob' }];
  const map = await anonymizeExportIdentities({ boardId: 'b', users, cards, comments });
  assert.ok(map);
  assert.equal(users[0].username, 'user1');
  assert.equal(users[0].profile.fullname, 'user1');
  assert.equal(users[0].profile.avatarUrl, undefined, 'an avatar identifies the person');
  // bob is only a board member, named in text: anonymized as build() does.
  assert.equal(cards[0].title, 'Ask @user2 and @user1');
  assert.equal(cards[0].description, 'cc @user1');
  assert.deepEqual([cards[0].requestedBy, cards[0].assignedBy], ['user1', 'user2']);
  assert.equal(comments[0].text, 'thanks @user2');
  assert.doesNotMatch(JSON.stringify({ users, cards, comments }), /alice|bob|Alice/);
});

test('negative: every exporter that names people anonymizes, and the CSV/TSV stream asks the switch', () => {
  const exporter = read('models/exporter.js');
  const csv = exporter.slice(exporter.indexOf('async buildCsvStream('), exporter.indexOf('async canExport('));
  assert.match(csv, /await assertExportEnabled\('export:csv'\);/);
  assert.match(csv, /await anonymizeExportIdentities\(\{\s*boardId: this\._boardId, users: lookup\.users/);
  assert.match(csv, /if \(anonymized\) anonymizeBoardTextInPlace\(\{ cards: \[card\] \}, anonymized\.byUsername\);/);
  // Any exporter that writes a username or full name has to anonymize: an
  // exporter added later fails here until it does.
  const { execFileSync } = require('node:child_process');
  const exporters = execFileSync('git', ['ls-files', 'models/server', 'models/lib/externalExporters.js', 'server/lib/boardChartData.js'],
    { cwd: root, encoding: 'utf8' }).split('\n')
    .filter(f => /(Exporter[A-Za-z]*\.js|externalExporters\.js|boardChartData\.js)$/.test(f));
  const naming = exporters.filter(f => /\.username\b|profile\??\.fullname/.test(read(f)));
  assert.ok(naming.length >= 6, naming.join(', '));
  const missing = naming.filter(f => !/anonymizeExportIdentities\(/.test(read(f)));
  assert.deepEqual(missing, []);
  // The chart exports ask for it; the chart views keep the names.
  for (const f of ['models/server/ExporterChartPDF.js', 'models/server/ExporterChartExcel.js']) {
    assert.match(read(f), /loadBoardChartData\(this\._boardId, this\._chartKey, \{ \.\.\.this\.options, forExport: true \}\)/);
  }
  assert.match(read('server/lib/boardChartData.js'), /if \(options\.forExport\) \{\s*await require\('\/models\/lib\/importExportSecurity'\)\.anonymizeExportIdentities/);
});
