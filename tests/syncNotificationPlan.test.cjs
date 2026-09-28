'use strict';
const { test } = require('node:test');const assert = require('node:assert/strict');
const { prepareNotificationPlan,validateNotificationPlan,deliverNotificationPlan }=require('../server/lib/syncNotificationPlan');
const activity={_id:'event',boardId:'board',cardId:'card',userId:'actor',createdAt:new Date(0)};
const job=userId=>({userId,eventId:'event',boardId:'board',cardId:'card',subject:'Original',html:'Saved body',language:'fi'});
const options={activity,recipientIds:['recipient'],getUser:async id=>({_id:id}),prepareEmail:async user=>job(user._id),prepareTray:async()=>true};
test('planning captures recipients, activity and rendered service data without delivery',async()=>{
 let release;const gate=new Promise(resolve=>{release=resolve;});const input=structuredClone(activity),ids=['recipient'];
 const prepared=job('recipient');
 const building=prepareNotificationPlan({...options,activity:input,recipientIds:ids,prepareEmail:async()=>prepared,prepareTray:async()=>{await gate;return true;}});
 await new Promise(resolve=>setImmediate(resolve));input.cardId='foreign';ids.push('later');prepared.html='Later';release();
 const plan=await building;assert.equal(plan.cardId,'card');assert.equal(plan.recipients.length,1);assert.equal(plan.recipients[0].email.html,'Saved body');
 assert.equal(validateNotificationPlan(plan,activity),true);
 const disabled=await prepareNotificationPlan({...options,prepareEmail:async()=>null,prepareTray:async()=>false});
 assert.deepEqual(disabled.recipients,[{userId:'recipient',email:null,tray:false}]);
});
test('malformed or foreign plans and missing adapters fail before any service writes',async()=>{
 const plan=await prepareNotificationPlan(options);let writes=0;
 const adapters={tray:{deliver:async()=>{writes++;}},email:{enqueue:async()=>{writes++;}},assertCurrent:async()=>{},assertRecipient:async()=>true};
 for(const change of [p=>{p.activityHash='changed';},p=>{p.recipients.push(p.recipients[0]);},p=>{p.recipients[0].email.eventId='foreign';},
  p=>{p.recipients[0].email.boardId='foreign';},p=>{p.recipients[0].email.html='x'.repeat(16*1024*1024);},p=>{p.recipients[0].email.extra='unknown';},p=>{p.recipients[0].tray='yes';}]) {
  const invalid=structuredClone(plan);change(invalid);
  await assert.rejects(deliverNotificationPlan({...adapters,plan:invalid,activity}),/plan-invalid/);
 }
 await assert.rejects(deliverNotificationPlan({...adapters,email:{},plan,activity}),/plan-invalid/);
 assert.equal(writes,0);
 await assert.rejects(prepareNotificationPlan({...options,recipientIds:['recipient','recipient']}),/plan-invalid/);
 await assert.rejects(prepareNotificationPlan({...options,getUser:async()=>({_id:'other'})}),/plan-invalid/);
});
test('fresh recipient checks and exact service receipts are required for acknowledgement',async()=>{
 const plan=await prepareNotificationPlan(options);let writes=0;
 const opts={plan,activity,tray:{deliver:async()=>{writes++;return 'wrong';}},email:{enqueue:async()=>{writes++;}},assertCurrent:async()=>{}};
 await assert.rejects(deliverNotificationPlan({...opts,assertRecipient:async()=>false}),/recipient-denied/);assert.equal(writes,0);
 await assert.rejects(deliverNotificationPlan({...opts,assertRecipient:async()=>true}),/tray-unconfirmed/);assert.equal(writes,1);
 const emailOnly=structuredClone(plan);emailOnly.recipients[0].tray=false;
 await assert.rejects(deliverNotificationPlan({...opts,plan:emailOnly,assertRecipient:async()=>true}),/email-unconfirmed/);assert.equal(writes,2);
});
