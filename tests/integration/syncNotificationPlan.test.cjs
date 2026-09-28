'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const {MongoClient,ObjectId}=require('mongodb');
const {prepareNotificationPlan,ensureNotificationPlan,deliverNotificationPlan,planId}=require('../../server/lib/syncNotificationPlan');
const {createTrayDelivery}=require('../../server/lib/trayDelivery');
const {createEmailOutbox}=require('../../server/lib/emailOutbox');
const uri=process.env.WEKAN_SYNC_TEST_MONGO_URL;
const activity={_id:'event',boardId:'board',cardId:'card',userId:'actor',createdAt:new Date(0)};
async function fixture(t){
 const client=await new MongoClient(uri).connect(),db=client.db(`notify_plan_${new ObjectId().toHexString()}`);
 t.after(async()=>{await db.dropDatabase();await client.close();});
 const users=db.collection('users'),receipts=db.collection('receipts'),plans=db.collection('plans'),jobs=db.collection('jobs');
 await users.insertMany(['one','two'].map(_id=>({_id,profile:{notifications:[]}})));
 const build=()=>prepareNotificationPlan({activity,recipientIds:['one','two'],getUser:id=>users.findOne({_id:id}),prepareTray:async()=>true,
  prepareEmail:async user=>({userId:user._id,eventId:'event',boardId:'board',cardId:'card',subject:'Captured',html:'Original body',language:'fi'})});
 const tray=createTrayDelivery({users,receipts}),email=createEmailOutbox({jobs,leases:db.collection('leases'),getUser:async()=>null,send:async()=>assert.fail('SMTP must not run while enqueueing')});
 return {users,receipts,plans,jobs,build,tray,email,assertCurrent:async()=>{},assertRecipient:async()=>true};
}
function proxy(collection,changes){return new Proxy(collection,{get(target,key){if(Object.hasOwn(changes,key))return changes[key];const value=target[key];return typeof value==='function'?value.bind(target):value;}});}
test('persisted plans resume after tray delivery and reuse original recipients/content without rebuilding',{skip:!uri},async t=>{
 const f=await fixture(t),plan=await ensureNotificationPlan({...f,activity});
 const email={enqueue:async()=>{throw new Error('email interrupted');}};
 await assert.rejects(deliverNotificationPlan({...f,plan,activity,email}),/email interrupted/);
 await f.users.updateOne({_id:'one'},{$set:{'profile.notifications':[]}});
 const resumed=await ensureNotificationPlan({...f,activity,build:async()=>assert.fail('never replan saved recipients')});
 assert.equal(await deliverNotificationPlan({...f,plan:resumed,activity}),planId('event'));
 assert.deepEqual((await f.users.findOne({_id:'one'})).profile.notifications,[]);
 assert.equal(await f.jobs.countDocuments({}),2);assert.equal(await f.receipts.countDocuments({}),2);
 await deliverNotificationPlan({...f,plan:resumed,activity});assert.equal(await f.jobs.countDocuments({}),2);
 for(const job of await f.jobs.find({}).toArray()){assert.equal(job.html,'Original body');assert.equal(job.language,'fi');}
});
test('lost plan insertion replies are read back; damaged plans and changed activity cannot be rebuilt',{skip:!uri},async t=>{
 const f=await fixture(t),plans=proxy(f.plans,{insertOne:async row=>{await f.plans.insertOne(row);throw new Error('lost reply');}});
 await ensureNotificationPlan({...f,plans,activity});
 await assert.rejects(ensureNotificationPlan({...f,activity:{...activity,cardId:'foreign'}}),/plan-invalid/);
 await f.plans.updateOne({_id:planId('event')},{$set:{'plan.recipients.0.email.html':'Changed'}});
 await assert.rejects(ensureNotificationPlan({...f,activity}),/plan-invalid/);
 assert.equal(await f.jobs.countDocuments({}),0);
});
test('concurrent builders retain the first saved snapshot, and revoked access prevents further recipients',{skip:!uri},async t=>{
 const f=await fixture(t);
 let entered=0,resume;const gate=new Promise(resolve=>{resume=resolve;});
 const builder=subject=>async()=>{const p=await f.build();p.recipients[0].email.subject=subject;if(++entered===2)resume();await gate;return p;};
 const plans=await Promise.all([ensureNotificationPlan({...f,activity,build:builder('First snapshot')}),ensureNotificationPlan({...f,activity,build:builder('Second snapshot')})]);
 assert.equal(entered,2);assert.deepEqual(plans[0],plans[1]);
 let checks=0;
 await assert.rejects(deliverNotificationPlan({...f,plan:plans[0],activity,assertRecipient:async()=>++checks===1}),/recipient-denied/);
 assert.equal(await f.receipts.countDocuments({}),1);assert.equal(await f.jobs.countDocuments({}),0);
 await deliverNotificationPlan({...f,plan:plans[0],activity});assert.equal(await f.jobs.countDocuments({}),2);
});
