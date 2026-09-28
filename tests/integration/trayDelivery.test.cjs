'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { MongoClient, ObjectId } = require('mongodb');
const { createTrayDelivery, receiptFor, PENDING, REVISION } = require('../../server/lib/trayDelivery');
const uri=process.env.WEKAN_SYNC_TEST_MONGO_URL;
async function fixture(t) {
 const client=await new MongoClient(uri).connect(),db=client.db(`tray_${new ObjectId().toHexString()}`);
 t.after(async()=>{await db.dropDatabase();await client.close();});
 const users=db.collection('users'),receipts=db.collection('receipts');
 await users.insertOne({_id:'user',profile:{notifications:[]}});
 return {users,receipts,queue:createTrayDelivery({users,receipts})};
}
function override(collection, methods) {
 return new Proxy(collection,{get(target,key){if(Object.hasOwn(methods,key))return methods[key];const value=target[key];return typeof value==='function'?value.bind(target):value;}});
}
test('delivery receipts survive dismissal and preserve existing read rows', {skip:!uri},async t=>{
 const f=await fixture(t),read=new Date(1000);
 await f.users.updateOne({_id:'user'},{$set:{'profile.notifications':[{activity:'old',read}]}});
 await f.queue.deliver('user','old');
 assert.deepEqual((await f.users.findOne({_id:'user'})).profile.notifications,[{activity:'old',read}]);
 const id=await f.queue.deliver('user','event');
 await f.users.updateOne({_id:'user'},{$set:{'profile.notifications':[]}});
 assert.equal(await createTrayDelivery(f).deliver('user','event'),id);
 assert.deepEqual((await f.users.findOne({_id:'user'})).profile.notifications,[]);
 assert.equal(await f.receipts.countDocuments({}),2);
 assert.equal(Object.hasOwn(await f.users.findOne({_id:'user'}),PENDING),false);
});
test('restart recovers atomic delivery marker after dismissal before receipt insertion', {skip:!uri},async t=>{
 const f=await fixture(t);
 const broken=override(f.receipts,{insertOne:async()=>{throw new Error('receipt offline');}});
 await assert.rejects(createTrayDelivery({...f,receipts:broken}).deliver('user','event'),/receipt offline/);
 let user=await f.users.findOne({_id:'user'});assert.equal(user.profile.notifications.length,1);assert.ok(user[PENDING]);
 await f.users.updateOne({_id:'user'},{$set:{'profile.notifications':[]}});
 await createTrayDelivery(f).recover('user');
 await f.queue.deliver('user','event');
 user=await f.users.findOne({_id:'user'});assert.deepEqual(user.profile.notifications,[]);assert.equal(Object.hasOwn(user,PENDING),false);
});
test('lost acknowledgements on user write, receipt and cleanup require readback', {skip:!uri},async t=>{
 for(const phase of ['user','receipt','cleanup']) {
  const f=await fixture(t);
  const users=override(f.users,{updateOne:async(q,m)=>{const result=await f.users.updateOne(q,m);
   if((phase==='user'&&m.$addToSet)||(phase==='cleanup'&&m.$unset))throw new Error('lost reply');return result;}});
  const receipts=override(f.receipts,{insertOne:async row=>{await f.receipts.insertOne(row);if(phase==='receipt')throw new Error('lost reply');}});
  await createTrayDelivery({users,receipts}).deliver('user','event');
  assert.equal(await f.receipts.countDocuments({}),1);assert.equal((await f.users.findOne({_id:'user'})).profile.notifications.length,1);
 }
});
test('a delayed delivery cannot recreate a dismissed event after another delivery completes', {skip:!uri},async t=>{
 const f=await fixture(t);let resume,entered;
 const gate=new Promise(resolve=>{resume=resolve;}),waiting=new Promise(resolve=>{entered=resolve;});let paused=false;
 const users=override(f.users,{updateOne:async(q,m)=>{if(!paused){paused=true;entered();await gate;}return f.users.updateOne(q,m);}});
 const stale=createTrayDelivery({...f,users}).deliver('user','event');await waiting;
 await f.queue.deliver('user','event');await f.users.updateOne({_id:'user'},{$set:{'profile.notifications':[]}});
 resume();await stale;
 assert.deepEqual((await f.users.findOne({_id:'user'})).profile.notifications,[]);
});
test('concurrent events retain separate receipts and bounded pending state', {skip:!uri},async t=>{
 const f=await fixture(t);await Promise.all(['a','b','a','c','b'].map(id=>f.queue.deliver('user',id)));
 assert.equal(await f.receipts.countDocuments({}),3);
 const user=await f.users.findOne({_id:'user'});assert.equal(user.profile.notifications.length,3);assert.equal(Object.hasOwn(user,PENDING),false);
});
test('malformed evidence, failed cleanup, missing users and guard failures retain/refuse work', {skip:!uri},async t=>{
 const f=await fixture(t);await assert.rejects(f.queue.deliver('missing','event'),/user-missing/);
 await assert.rejects(createTrayDelivery({...f,assertCurrent:async()=>{throw new Error('lease lost');}}).deliver('user','event'),/lease lost/);
 await f.receipts.insertOne({...receiptFor('user','bad'),activityId:'foreign'});
 await assert.rejects(f.queue.deliver('user','bad'),/receipt-invalid/);
 await f.users.updateOne({_id:'user'},{$set:{[REVISION]:null}});
 await assert.rejects(f.queue.deliver('user','new'),/revision-invalid/);
 await f.users.updateOne({_id:'user'},{$unset:{[REVISION]:''}});
 const users=override(f.users,{updateOne:async(q,m)=>m.$unset?{matchedCount:0}:f.users.updateOne(q,m)});
 await assert.rejects(createTrayDelivery({...f,users}).deliver('user','new'),/cleanup-unconfirmed/);
 assert.ok((await f.users.findOne({_id:'user'}))[PENDING]);assert.ok(await f.receipts.findOne({_id:receiptFor('user','new')._id}));
 await f.queue.recover('user');
});
