'use strict';

// The export to Trello, run for real (server/trelloApiExport.js) against a
// fake Trello API: what is created, with which ids, in which order, and that
// one failed item does not stop the board.
// Run: node tests/trelloApiExport.test.cjs

const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { buildTrelloExportPlan } = require('../models/lib/trelloExportPlan');

const ROOT = path.join(__dirname, '..');

function harness({ fail = () => false } = {}) {
  const calls = [];
  const jobs = new Map();
  let methods;
  let counter = 0;
  const context = {
    console, Buffer, Blob, FormData, Map, Set, Promise, Date, JSON, String, Error,
    Meteor: { methods(m) { methods = m; }, Error: class extends Error { constructor(e, r) { super(r || e); this.error = e; this.reason = r; } } },
    Mongo: {
      Collection: class {
        async insertAsync(doc) { const id = `job${jobs.size + 1}`; jobs.set(id, { _id: id, ...doc }); return id; }
        async updateAsync(id, { $set }) { Object.assign(jobs.get(id), $set); return 1; }
        async findOneAsync(q) { const job = jobs.get(q._id); return job && job.userId === q.userId ? job : undefined; }
      },
    },
    check() {}, Match: { Maybe: x => x },
    ReactiveCache: { getUser: async () => ({ _id: 'u1', profile: {} }) },
    require: name => (name === '/models/lib/trelloExportPlan' ? { buildTrelloExportPlan } : {}),
    resolveCreds: async () => ({ key: 'K', token: 'T' }),
    runAsEgressUser: (userId, fn) => fn(),
    trelloSend: async (method, p, key, token, params, body) => {
      const call = { method, path: p, params, body };
      calls.push(call);
      if (fail(method, p, params)) throw new Error(`Trello API 400 for ${method} ${p}`);
      counter += 1;
      call.id = p === '/boards/' ? 'B' : `id${counter}`;
      return p === '/boards/' ? { id: 'B', url: 'https://trello.com/b/B' } : { id: call.id };
    },
  };
  vm.createContext(context);
  const src = fs.readFileSync(path.join(ROOT, 'server/trelloApiExport.js'), 'utf8')
    .replace(/^import [^\n]*\n/gm, '').replace(/^export /gm, '');
  vm.runInContext(src, context);
  return { calls, jobs, context, methods: () => methods };
}

const board = {
  title: 'Roadmap', labels: [{ _id: 'l1', name: 'Bug', color: 'red' }],
  swimlanes: [{ _id: 's1', title: 'A', sort: 1 }, { _id: 's2', title: 'B', sort: 2 }],
  lists: [{ _id: 'L1', title: 'Todo', sort: 1 }, { _id: 'L2', title: 'Old', sort: 2, archived: true }],
  cards: [
    { _id: 'c1', title: 'One', listId: 'L1', swimlaneId: 's1', sort: 1, labelIds: ['l1'] },
    { _id: 'c2', title: 'Two', listId: 'L2', swimlaneId: 's2', sort: 1, archived: true },
  ],
  checklists: [{ _id: 'k1', cardId: 'c1', title: 'Steps' }],
  checklistItems: [{ checklistId: 'k1', title: 'a', isFinished: true }],
  comments: [{ cardId: 'c1', userId: 'u1', text: 'hi', createdAt: '2026-10-01T00:00:00Z' }],
  users: [{ _id: 'u1', username: 'ann' }],
  attachments: [{ cardId: 'c1', name: 'a.txt', type: 'text/plain', file: Buffer.from('hi').toString('base64') }],
};

test('everything is created in Trello, linked by the ids Trello returned', async () => {
  const h = harness();
  const plan = buildTrelloExportPlan(board);
  h.jobs.set('j', { _id: 'j', userId: 'u1' });
  await vm.runInContext('runExport', h.context)('j', plan, 'K', 'T');
  const paths = h.calls.map(c => `${c.method} ${c.path}`);
  assert.equal(paths[0], 'POST /boards/');
  assert.deepEqual(h.calls[0].params.defaultLists, 'false');
  const labels = h.calls.filter(c => c.path === '/labels');
  assert.deepEqual(labels.map(c => [c.params.name, c.params.color, c.params.idBoard]),
    [['Bug', 'red', 'B'], ['Swimlane: A', 'null', 'B'], ['Swimlane: B', 'null', 'B']]);
  const [labelBug, laneA, laneB] = labels.map(c => c.id);
  const cards = h.calls.filter(c => c.path === '/cards');
  assert.deepEqual(cards.map(c => c.params.name), ['One', 'Two']);
  assert.equal(cards[0].params.idLabels, `${labelBug},${laneA}`, 'its label and its swimlane label');
  assert.equal(cards[1].params.idLabels, laneB);
  assert.ok(h.calls.some(c => /^\/checklists\/id\d+\/checkItems$/.test(c.path) && c.params.checked === 'true'));
  assert.ok(h.calls.some(c => /\/actions\/comments$/.test(c.path) && /^ann \(2026-10-01/.test(c.params.text)));
  const upload = h.calls.find(c => /\/attachments$/.test(c.path));
  assert.ok(upload.body instanceof FormData && upload.body.get('name') === 'a.txt');
  // Archiving comes last, after everything inside was created.
  assert.deepEqual(paths.slice(-2).map(p => p.split(' ')[0]), ['PUT', 'PUT']);
  assert.match(paths.at(-2), /^PUT \/lists\/id\d+\/closed$/);
  assert.match(paths.at(-1), /^PUT \/cards\/id\d+$/);
  const job = h.jobs.get('j');
  assert.equal(job.status, 'done');
  assert.equal(job.trelloBoardUrl, 'https://trello.com/b/B');
  assert.equal(job.done, plan.total, 'progress reaches the total');
  assert.equal(job.warnings.length, 0);
});

test('a failed card is a warning; its checklist and comment are skipped, the rest goes on (negative)', async () => {
  const h = harness({ fail: (method, p, params) => p === '/cards' && params.name === 'One' });
  h.jobs.set('j', { _id: 'j', userId: 'u1' });
  const plan = buildTrelloExportPlan(board);
  await vm.runInContext('runExport', h.context)('j', plan, 'K', 'T');
  const job = h.jobs.get('j');
  assert.equal(job.status, 'done');
  assert.equal(job.warnings.length, 1);
  assert.match(job.warnings[0], /^Card "One": Trello API 400/);
  assert.ok(!h.calls.some(c => c.path === '/checklists' || /\/actions\/comments$|\/attachments$/.test(c.path)),
    'nothing is attached to a card that does not exist');
  assert.ok(h.calls.some(c => c.path === '/cards' && c.params.name === 'Two'));
  assert.equal(job.done, plan.total);
});

test('a board Trello will not create stops the export, and only the owner sees the job (negative)', async () => {
  const h = harness({ fail: (method, p) => p === '/boards/' });
  h.jobs.set('j', { _id: 'j', userId: 'u1' });
  await assert.rejects(vm.runInContext('runExport', h.context)('j', buildTrelloExportPlan(board), 'K', 'T'), /400/);
  assert.equal(h.calls.length, 1);
  const status = h.methods().trelloExportStatus;
  await assert.rejects(status.call({ userId: 'someone-else' }, 'j'), /not-found/);
  h.jobs.get('j').status = 'error';
  assert.equal((await status.call({ userId: 'u1' }, 'j')).status, 'error');
  await assert.rejects(status.call({ userId: null }, 'j'), /error-notAuthorized/);
});
