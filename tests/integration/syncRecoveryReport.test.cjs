'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { syncRunReportPage } = require('../../server/lib/syncRunReportPage');
const uri = process.env.WEKAN_SYNC_TEST_MONGO_URL;
test('Recovery reads retained Sync reports with stable pages, literal search and no private fields', { skip: !uri }, async t => {
  const client = await new MongoClient(uri).connect();
  const db=client.db(`sync_recovery_${new ObjectId().toHexString()}`), collection=db.collection('reports');
  t.after(async()=>{await db.dropDatabase();await client.close();});
  const now=new Date();
  await collection.insertMany(Array.from({length:23},(_,i)=>({_id:`run-${String(i).padStart(2,'0')}`,
    startedAt:now,boardId:'board',listId:'literal.*list',status:'unfinished',incarnation:'private-lifetime',token:'SECRET',
    coverage:{source:{rows:[{path:'/<script>',reason:'unmapped',count:1}]}} })));
  await collection.insertMany([{_id:'failed',startedAt:now,boardId:'board',listId:'other',status:'failed'},
    {_id:'expired',startedAt:new Date(now-31*86400000),status:'unfinished'}]);
  const seen=new Set();
  for(let page=1;page<=3;page++){
    const result=await syncRunReportPage(collection,{page},now);
    assert.equal(result.total,23);assert.equal(result.rows.length,page===3?3:10);
    for(const row of result.rows){assert.ok(!seen.has(row._id));seen.add(row._id);}
    assert.doesNotMatch(JSON.stringify(result),/SECRET|private-lifetime|expired/);
  }
  assert.equal((await syncRunReportPage(collection,{search:'.*'},now)).total,23);
  assert.equal((await syncRunReportPage(collection,{search:'^'},now)).total,0);
  assert.equal((await syncRunReportPage(collection,{status:'failed'},now)).total,1);
  assert.equal((await syncRunReportPage(collection,{status:'all'},now)).total,24);
  assert.equal((await syncRunReportPage(collection,{page:999},now)).page,3);
  for(const query of [{search:'x'.repeat(101)},{search:{$gt:''}},{status:{$ne:''}},{page:0},{page:Infinity},{page:1.5},{page:100001}]){
    await assert.rejects(syncRunReportPage(collection,query,now),/Invalid/);
  }
});
