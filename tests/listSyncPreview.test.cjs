'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { syncCoverage, prepareSyncWrites, describeSyncPreview } = require('../server/lib/listSyncPreview');

test('coverage reports meaningful unmapped and excluded fields without returning their values', () => {
  const report = syncCoverage({ tasks: [{ externalId: '1', title: 'Title', description: '', spentTime: 0,
    date_due: '2026-01-01', tags: [], requested_by: 'private-name', column_name: 'Done' }],
    unsupported: [{ reason: 'private-reason' }], warnings: ['private-warning'] }, {});
  assert.deepEqual(report.rows.map(row => [row.field,row.reason,row.count]), [
    ['column_name','unmapped',1], ['date_due','unmapped',1], ['requested_by','unmapped',1], ['spentTime','excluded',1],
  ]);
  assert.equal(report.parserUnsupported,1);assert.equal(report.parserWarnings,1);
  assert.doesNotMatch(JSON.stringify(report),/private-|2026-01-01/);
  assert.equal(syncCoverage({tasks:[{externalId:'1',spentTime:0}]},{fields:['spentTime']}).rows.length,0);
});

test('the displayed and applied plan removes status-only writes and includes changed baselines', () => {
  const plan={toCreate:[],toUpdate:[{cardId:'one',changes:{column_name:'Closed'}},
    {cardId:'two',changes:{column_name:'Done',title:'New'}}],toArchive:[]};
  prepareSyncWrites(plan,new Map([['one',{title:'Same'}]]));
  assert.deepEqual(plan.toUpdate,[{cardId:'two',changes:{title:'New'}},{cardId:'one',changes:{syncLastSource:{title:'Same'}}}]);
});

test('preview rows and coverage are bounded, with exact totals and no fake plan during conflicts', () => {
  const plan={toCreate:Array.from({length:120},(_,i)=>({externalId:i,title:'x'.repeat(800)})),toUpdate:[],toArchive:[]};
  const coverage=syncCoverage({tasks:[Object.fromEntries(Array.from({length:130},(_,i)=>[`field${i}`,'private-value']))]},{});
  assert.equal(coverage.rows.length,100);assert.equal(coverage.fields,130);assert.equal(coverage.truncated,true);
  const preview=describeSyncPreview({plan,cards:[],coverage,blocked:false});
  assert.equal(preview.created,120);assert.equal(preview.total,120);assert.equal(preview.items.length,100);
  assert.equal(preview.items[0].title.length,500);assert.equal(preview.truncated,true);
  const blocked=describeSyncPreview({plan,cards:[],coverage,blocked:true});
  assert.equal(blocked.created,undefined);assert.deepEqual(blocked.items,[]);
});
