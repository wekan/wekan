'use strict';

// Google Keep through its API: the client (models/lib/apiImport/googlekeep.js)
// with a fake request, and the parser (models/lib/googlekeepApiFormat.js).
// The fixtures follow the Keep API's Note resource
// (https://developers.google.com/workspace/keep/api/reference/rest/v1/notes).
// Run: node tests/googlekeepApiImport.test.cjs

const assert = require('node:assert/strict');

const TOKEN = 'ya29.secret-access-token';

function keepNotes() {
  return [
    {
      name: 'notes/1a2b3c', createTime: '2025-03-01T09:00:00.000Z', updateTime: '2025-03-02T09:00:00.000Z',
      trashed: false, title: 'Groceries',
      body: { list: { listItems: [
        { text: { text: 'Milk' }, checked: true },
        { text: { text: 'Fruit' }, checked: false, childListItems: [
          { text: { text: 'Apples' }, checked: true },
          { text: { text: 'Pears' }, checked: false },
        ] },
        { text: { text: '  ' }, checked: false },
      ] } },
      permissions: [
        { name: 'notes/1a2b3c/permissions/p1', role: 'OWNER', email: 'owner@example.com' },
        { name: 'notes/1a2b3c/permissions/p2', role: 'WRITER', email: 'friend@example.com' },
      ],
    },
    {
      name: 'notes/4d5e6f', createTime: '2025-03-03T10:00:00Z', title: '',
      body: { text: { text: `\n  ${'Long first line '.repeat(10)}\nSecond line` } },
      attachments: [{ name: 'notes/4d5e6f/attachments/a1', mimeType: ['image/png'] }],
      permissions: [{ role: 'OWNER', email: 'owner@example.com' }],
    },
    { name: 'notes/old', createTime: '2025-01-01T00:00:00Z', trashed: true, trashTime: '2025-02-01T00:00:00Z', title: 'Old', body: { text: { text: 'gone' } } },
    { name: 'notes/plain', createTime: 'yesterday', title: 'Plain', body: { text: { text: 'Just text' } } },
  ];
}

async function main() {
  const client = await import('../models/lib/apiImport/googlekeep.js');
  const { parseGoogleKeepApi, MAX_GOOGLE_KEEP_NOTES } = await import('../models/lib/googlekeepApiFormat.js');
  const { planImportedTask } = await import('../models/lib/importedTaskPlan.js');
  const { apiImportService } = require('../models/lib/apiImportServices.js');

  // The service entry the import page uses.
  const service = apiImportService('googlekeep');
  assert.deepEqual(service.fields.map(f => [f.name, f.secret === true]), [['token', true]]);

  // list: one source, all notes; no request needed.
  assert.deepEqual(await client.list({ token: TOKEN }, () => { throw new Error('no request'); }),
    [{ id: 'all', name: 'Google Keep (all notes)' }]);
  await assert.rejects(client.list({}), /token is required/);

  // fetch: pages through nextPageToken, with the token as a Bearer header only.
  const notes = keepNotes();
  const calls = [];
  const pages = {
    '': { notes: notes.slice(0, 2), nextPageToken: 'page 2/=' },
    'page 2/=': { notes: notes.slice(2), nextPageToken: '' },
  };
  const request = async (url, options) => {
    calls.push({ url, options });
    const token = new URL(url).searchParams.get('pageToken') || '';
    return pages[token];
  };
  const fetched = await client.fetch({ token: TOKEN }, 'all', request);
  assert.deepEqual(fetched, { googlekeep: true, notes });
  assert.equal(calls.length, 2);
  assert.equal(calls[0].url, 'https://keep.googleapis.com/v1/notes?pageSize=100');
  assert.equal(calls[1].url, 'https://keep.googleapis.com/v1/notes?pageSize=100&pageToken=page%202%2F%3D');
  for (const call of calls) {
    assert.equal(call.options.method, 'GET');
    assert.equal(call.options.headers.Authorization, `Bearer ${TOKEN}`);
    assert.ok(!call.url.includes(TOKEN) && !call.url.includes('secret'), 'the token is never in a URL');
    assert.equal(call.options.body, undefined);
  }

  // Negative: a repeated page token aborts instead of paging forever.
  let loops = 0;
  await assert.rejects(client.fetch({ token: TOKEN }, 'all', async () => { loops += 1; return { notes: [], nextPageToken: 'same' }; }),
    /repeated a page token/);
  assert.equal(loops, 2);
  // Negative: an error status propagates with its status.
  await assert.rejects(client.fetch({ token: TOKEN }, 'all', async () => {
    const error = new Error('HTTP 403'); error.status = 403; throw error;
  }), error => error.status === 403);
  // Negative: an unknown source, no token, an answer that is not notes.
  await assert.rejects(client.fetch({ token: TOKEN }, 'notes/1', request), /Unknown Google Keep source/);
  await assert.rejects(client.fetch({ token: '' }, 'all', request), /token is required/);
  await assert.rejects(client.fetch({ token: TOKEN }, 'all', async () => ({ notes: 'x' })), /not a list of notes/);
  await assert.rejects(client.fetch({ token: TOKEN }, 'all', async () => []), /not a list of notes/);
  // An empty account: no notes field at all.
  assert.deepEqual(await client.fetch({ token: TOKEN }, 'all', async () => ({})), { googlekeep: true, notes: [] });
  // Bounded: pages and notes.
  let page = 0;
  await assert.rejects(client.fetch({ token: TOKEN }, 'all', async () => ({ notes: [], nextPageToken: `p${page += 1}` })),
    /more than 200 pages/);
  await assert.rejects(client.fetch({ token: TOKEN }, 'all', async () => ({ notes: new Array(client.MAX_GOOGLE_KEEP_NOTES + 1).fill({}) })),
    /more than 20000 notes/);

  // The parser: every field.
  const board = parseGoogleKeepApi(fetched);
  assert.deepEqual(board.board, { name: 'Google Keep' });
  assert.deepEqual(board.columns, [{ title: 'Notes' }, { title: 'Lists' }]);
  assert.deepEqual(board.swimlanes, [{ name: 'Default' }]);
  assert.deepEqual(board.warnings, []);
  assert.equal(board.tasks.length, 3, 'the trashed note is skipped');

  const [list, untitled, plain] = board.tasks;
  assert.equal(list.title, 'Groceries');
  assert.equal(list.column_name, 'Lists');
  assert.equal(list.swimlane_name, 'Default');
  assert.equal(list.ref, 'notes/1a2b3c');
  assert.equal(list.date_creation, '2025-03-01T09:00:00.000Z');
  assert.equal(list.description, '');
  assert.deepEqual(list.checklists, [{ title: 'Items', items: [
    { title: 'Milk', done: true },
    { title: 'Fruit', done: false },
    { title: '↳ Apples', done: true },
    { title: '↳ Pears', done: false },
  ] }]);

  assert.equal(untitled.column_name, 'Notes');
  assert.equal(untitled.title.length, 80, 'an untitled note takes its first line, at most 80 characters');
  assert.ok(untitled.title.startsWith('Long first line Long') && untitled.title.endsWith('…'));
  assert.ok(untitled.description.includes('Second line'));
  assert.equal(untitled.checklists, undefined);
  assert.equal(untitled.date_creation, '2025-03-03T10:00:00.000Z');

  assert.equal(plain.title, 'Plain');
  assert.equal(plain.description, 'Just text');
  assert.equal(plain.date_creation, undefined);

  const reasons = board.unsupported.map(u => `${u.path} ${u.reason}`);
  assert.ok(reasons.some(r => r.startsWith('/notes/0/permissions') && /shared with 1 other/.test(r)), 'sharing is reported');
  assert.ok(!reasons.some(r => r.includes('friend@example.com')), 'the loss report does not list e-mail addresses');
  assert.ok(!reasons.some(r => r.startsWith('/notes/1/permissions')), 'the owner alone is not sharing');
  assert.ok(reasons.some(r => r.startsWith('/notes/1/attachments') && /1 attachment\(s\) \(image\/png\)/.test(r)), 'attachments are reported');
  assert.ok(reasons.some(r => r === '/notes 1 trashed Google Keep note(s) are not imported'), 'trashed notes are counted');
  assert.ok(reasons.some(r => r.startsWith('/notes/3/createTime')), 'a bad date is reported');

  // The card WeKan creates: title, description, creation date, checklist.
  const plan = planImportedTask(list);
  assert.equal(plan.card.title, 'Groceries');
  assert.equal(new Date(plan.card.createdAt).toISOString(), '2025-03-01T09:00:00.000Z');

  // JSON text, the API's own answer, and edge cases.
  assert.equal(parseGoogleKeepApi(JSON.stringify(fetched)).tasks.length, 3);
  assert.equal(parseGoogleKeepApi({ notes: [notes[3]] }).tasks[0].title, 'Plain');
  const empty = parseGoogleKeepApi({ googlekeep: true, notes: [] });
  assert.deepEqual(empty.columns, [{ title: 'Notes' }]);
  assert.deepEqual(empty.tasks, []);
  const odd = parseGoogleKeepApi({ notes: [
    { name: 'notes/e' },
    { name: 'notes/l', body: { list: { listItems: [{ text: { text: 'First item' }, checked: false }] } } },
    { name: 'notes/x', body: { drawing: {} } },
    'not a note',
  ] });
  assert.deepEqual(odd.tasks.map(t => [t.title, t.column_name]), [['Untitled note', 'Notes'], ['First item', 'Lists'], ['Untitled note', 'Notes']]);
  assert.deepEqual(odd.columns, [{ title: 'Notes' }, { title: 'Lists' }]);
  assert.ok(odd.unsupported.some(u => u.path === '/notes/2/body'));
  assert.ok(odd.unsupported.some(u => u.path === '/notes/3'));

  // Negative: wrong shapes are refused with a clear error.
  assert.throws(() => parseGoogleKeepApi('not json'), /not valid JSON/);
  assert.throws(() => parseGoogleKeepApi(null), /must be a JSON object/);
  assert.throws(() => parseGoogleKeepApi([]), /must be a JSON object/);
  assert.throws(() => parseGoogleKeepApi({ googlekeep: true }), /needs a notes array/);
  assert.throws(() => parseGoogleKeepApi({ notes: {} }), /needs a notes array/);
  assert.throws(() => parseGoogleKeepApi({ title: 'a Kanri board', columns: [] }), /needs a notes array/);
  assert.throws(() => parseGoogleKeepApi({ notes: new Array(MAX_GOOGLE_KEEP_NOTES + 1).fill({}) }), /more than 20000 notes/);

  console.log('googlekeepApiImport: all tests passed');
}

main().catch(error => { console.error(error); process.exit(1); });
