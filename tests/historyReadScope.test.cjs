'use strict';
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
 for(const direction of ['restore','undo','redo']) assert.ok(source.includes(`applyRow(row, '${direction}')`));
 const readAt=source.indexOf('const readable = await filterReadableHistoryRows(all, this.userId)');
 assert.ok(readAt>0);
 assert.ok(source.indexOf('const filtered = search ? readable.filter',readAt)>readAt);
 assert.ok(source.indexOf('const info = pageInfo(filtered.length',readAt)>readAt);
});
