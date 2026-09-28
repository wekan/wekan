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
