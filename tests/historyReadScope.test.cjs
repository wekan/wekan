'use strict';
// HistoryScopeBleed: current card/board access is required for History reads and reversal.
const {test}=require('node:test');const assert=require('node:assert/strict');
const {readableHistoryRow}=require('../models/lib/historyReadScope');
test('history authorship and former membership never replace current board visibility',()=>{
 const row={userId:'me',boardId:'private',cardId:'c'};
 assert.equal(readableHistoryRow(row,undefined),false);
 assert.equal(readableHistoryRow(row,{visible:false,assignedOnly:false}),false);
 assert.equal(readableHistoryRow(row,{visible:true,assignedOnly:false}),true);
});
test('assigned-only history excludes hidden cards and broad container snapshots',()=>{
 const scope={visible:true,assignedOnly:true,cardIds:new Set(['assigned'])};
 assert.equal(readableHistoryRow({cardId:'assigned',entityType:'comment'},scope),true);
 assert.equal(readableHistoryRow({entityType:'card',entityId:'assigned'},scope),true);
 assert.equal(readableHistoryRow({cardId:'hidden',userId:'me'},scope),false);
 assert.equal(readableHistoryRow({entityType:'list',previousContent:{cards:['assigned','hidden']}},scope),false);
 assert.equal(readableHistoryRow({entityType:'scrum-sprint'},scope),false);
});
test('all universal history reversal paths share the scope guard and paging filters before search',()=>{
 const fs=require('node:fs');const path=require('node:path');
 const source=fs.readFileSync(path.join(__dirname,'../server/models/changeHistory.js'),'utf8');
 assert.match(source,/async function applyRow\(row, direction\) \{\s*await requireHistoryRowAccess\(row, Meteor\.userId\(\)\);/);
 // Undo/redo go through applyClaimed (it claims the row first), which calls
 // applyRow with the same direction, so they share the scope guard too.
 assert.ok(source.includes(`applyRow(row, 'restore')`));
 for(const direction of ['undo','redo']) assert.ok(source.includes(`applyClaimed(row, '${direction}', claim)`));
 assert.ok(source.includes('applied = await applyRow(row, direction);'));
 // The streaming reader must retain the original security boundary: filter
 // each batch before search, totals, contributors or page selection.
 // Keep row authorization AND redact protected content before search/counting.
 assert.match(source, /readable: async rows =>[^;]+redactFields\(\s*await filterReadableHistoryRows\(rows, this.userId\), this.userId\)/);
 const scan=fs.readFileSync(path.join(__dirname,'../server/lib/historyPageScan.js'),'utf8');
 const readAt=scan.indexOf('const allowed = await readable(batch)');
 assert.ok(readAt>0);
 assert.ok(scan.indexOf('if (!matches(row)) continue',readAt)>readAt);
 assert.ok(scan.indexOf('total++',readAt)>readAt);
 assert.doesNotMatch(source,/const all = await ChangeHistory.find\(selector/);
});

// HistoryScopeBleed sibling (2026-10-02): rows keep the board they were
// recorded on; a list or swimlane moved to another board since was restored
// wherever it is now, and a row moving something to another board was applied
// without access there.
test('history access follows a list or swimlane to its current board, and any destination', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const src = fs.readFileSync(path.join(__dirname, '..', 'server/lib/historyReadScope.js'), 'utf8');
  const start = src.indexOf('  // HistoryScopeBleed sibling (2026-10-02)');
  const tail = src.slice(start, src.lastIndexOf('}'));
  const boards = { old: { members: [{ userId: 'u', isActive: true }] }, moved: { members: [{ userId: 'x', isActive: true }] } };
  const docs = { list1: { boardId: 'moved' }, list2: { boardId: 'old' } };
  const Meteor = { Error: class extends Error { constructor(e) { super(e); this.error = e; } } };
  const fakeRequire = name => (name === '/models/lib/boardRoleCapabilities'
    ? require('../models/lib/boardRoleCapabilities')
    : { default: { findOneAsync: async id => docs[id] } });
  // eslint-disable-next-line no-new-func
  const check = new Function('row', 'userId', 'Boards', 'Meteor', 'require', `return (async () => {${tail}})();`);
  const Boards = { findOneAsync: async id => boards[id] };
  await assert.rejects(check({ entityType: 'list', entityId: 'list1', boardId: 'old' }, 'u', Boards, Meteor, fakeRequire), { error: 'not-authorized' });
  await check({ entityType: 'list', entityId: 'list2', boardId: 'old' }, 'u', Boards, Meteor, fakeRequire);
  await assert.rejects(check({ entityType: 'card', entityId: 'c', boardId: 'old', content: { boardId: 'moved' } }, 'u', Boards, Meteor, fakeRequire), { error: 'not-authorized' });
  await check({ entityType: 'card', entityId: 'c', boardId: 'old', content: { boardId: 'old' } }, 'u', Boards, Meteor, fakeRequire);
});
