'use strict';

// The same questions as dolt-history.cjs, asked of TerminusDB (a document and
// graph database with version control). TerminusDB speaks neither the MongoDB
// protocol nor SQL, so FerretDB cannot sit on it and WeKan cannot use it as it
// is; this only shows what its version control would give an undo and redo.
//
//   docker run -d --name tdbtry -p 6363:6363 terminusdb/terminusdb-server:latest
//   node docs/Databases/FerretDB/1/VersionHistory/terminusdb-history.cjs

const BASE = process.argv.includes('--url') ? process.argv[process.argv.indexOf('--url') + 1] : 'http://127.0.0.1:6363';
const AUTH = `Basic ${Buffer.from('admin:root').toString('base64')}`;
const DB = 'wekanhistory';
const say = (line = '') => console.log(line);

async function api(method, path, { query = {}, body, raw = false } = {}) {
  const url = new URL(`${BASE}${path}`);
  for (const [k, v] of Object.entries(query)) url.searchParams.set(k, v);
  const res = await fetch(url, {
    method, headers: { Authorization: AUTH, 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = text;
  try { data = JSON.parse(text); } catch { try { data = text.trim().split('\n').map(JSON.parse); } catch { /* text */ } }
  return raw ? { status: res.status, data } : { status: res.status, data };
}
const w = (author, message) => ({ author, message });
const short = (v) => JSON.stringify(v).slice(0, 220);

async function main() {
  await api('DELETE', `/api/db/admin/${DB}`);
  const created = await api('POST', `/api/db/admin/${DB}`, { body: { label: DB, comment: 'WeKan history test' } });
  say(`create database: ${created.status}`);

  const schema = [{
    '@type': 'Class', '@id': 'Card', '@key': { '@type': 'Lexical', '@fields': ['cardId'] },
    cardId: 'xsd:string', title: 'xsd:string', listId: 'xsd:string', sort: 'xsd:integer', archived: 'xsd:boolean',
  }];
  const s = await api('POST', `/api/document/admin/${DB}`, { query: { graph_type: 'schema', ...w('system', 'schema') }, body: schema });
  say(`schema: ${s.status} ${s.status === 200 ? '' : short(s.data)}`);

  const card = (id, title, listId, sort, archived = false) => ({ '@type': 'Card', cardId: id, title, listId, sort, archived });
  const log = async () => (await api('GET', `/api/log/admin/${DB}`)).data;

  say('\n# 1. A commit per write, with the author and message of the person who made it');
  const ins = await api('POST', `/api/document/admin/${DB}`, { query: w('alice', 'add cards'), body: [card('c1', 'Write docs', 'l1', 1), card('c2', 'Fix bug', 'l1', 2)] });
  say(`insert: ${ins.status} ${short(ins.data)}`);
  const hashes = {};
  const ops = [
    ['edit title', 'alice', () => api('PUT', `/api/document/admin/${DB}`, { query: w('alice', 'edit title'), body: card('c1', 'Write docs v2', 'l1', 1) })],
    ['move to Done', 'bob', () => api('PUT', `/api/document/admin/${DB}`, { query: w('bob', 'move to Done'), body: card('c1', 'Write docs v2', 'l2', 5) })],
    ['archive', 'carol', () => api('PUT', `/api/document/admin/${DB}`, { query: w('carol', 'archive'), body: card('c1', 'Write docs v2', 'l2', 5, true) })],
    ['hard delete c2', 'bob', () => api('DELETE', `/api/document/admin/${DB}`, { query: { ...w('bob', 'hard delete c2'), id: 'Card/c2' } })],
  ];
  for (const [name, , run] of ops) {
    const before = (await log()).length;
    const r = await run();
    const l = await log();
    hashes[name] = l[0].identifier;
    say(`${name.padEnd(16)} HTTP ${r.status}  commits +${l.length - before}  ${l[0].author} | ${l[0].message}`);
  }
  say((await log()).slice(0, 5).map((c) => `${c.author} | ${c.message} | ${new Date(c.timestamp * 1000).toISOString()} | ${String(c.identifier).slice(0, 10)}`).join('\n'));

  say('\n# 2. Time travel: the cards as of an earlier commit');
  const asOf = async (commit) => (await api('GET', `/api/document/admin/${DB}/local/commit/${commit}`, { query: { type: 'Card', as_list: 'true' } })).data;
  const nowCards = (await api('GET', `/api/document/admin/${DB}`, { query: { type: 'Card', as_list: 'true' } })).data;
  say(`now: ${nowCards.length} cards; as of "move to Done": ${short(await asOf(hashes['move to Done']))}`);

  say('\n# 3. Undo the last change (WeKan: Ctrl+Z): a diff between two commits, applied backwards');
  const lastTwo = (await log()).slice(0, 2);
  const diffBack = await api('POST', `/api/diff/admin/${DB}`, { body: { before_data_version: lastTwo[0].identifier, after_data_version: lastTwo[1].identifier } });
  say(`diff (hard delete -> before it): ${diffBack.status} ${short(diffBack.data)}`);
  const patched = await api('POST', `/api/patch/admin/${DB}`, { body: { patch: diffBack.data, ...w('alice', 'undo: hard delete c2') } });
  say(`patch: ${patched.status} ${short(patched.data)}`);
  say(`c2 exists after undo: ${(await api('GET', `/api/document/admin/${DB}`, { query: { id: 'Card/c2' } })).status === 200}`);

  say('\n# 4. Restore ONE older change while later ones stay (WeKan: Restore of a selected History row)');
  // The "edit title" commit and the one before it.
  const l = await log();
  const idx = l.findIndex((c) => c.identifier === hashes['edit title']);
  const titleBack = await api('POST', `/api/diff/admin/${DB}`, { body: { before_data_version: l[idx].identifier, after_data_version: l[idx + 1].identifier } });
  say(`diff to undo the title edit: ${short(titleBack.data)}`);
  const applied = await api('POST', `/api/patch/admin/${DB}`, { body: { patch: titleBack.data, ...w('alice', 'restore: title') } });
  say(`patch onto HEAD, where c1 was moved and archived afterwards: ${applied.status} ${short(applied.data)}`);
  const c1 = (await api('GET', `/api/document/admin/${DB}`, { query: { id: 'Card/c1' } })).data;
  say(`c1 now: ${short(c1)}`);

  say('\n# 5. What it costs');
  const t0 = Date.now();
  for (let i = 0; i < 100; i += 1) await api('PUT', `/api/document/admin/${DB}`, { query: w('alice', `edit ${i}`), body: card('c1', `Edit ${i}`, 'l2', 5) });
  say(`PUT of a card: ${((Date.now() - t0) / 100).toFixed(1)} ms per call (an HTTP call each, a commit each); commits: ${(await log()).length}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
