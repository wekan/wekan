'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { addNotificationOnce } = require('../models/lib/notificationInsertion');
test('conditional insertion binds activity identity and confirms storage without replacing read state',async()=>{
 const calls=[];
 const users={updateAsync:async(...args)=>{calls.push(args);return 0;},
  findOneAsync:async(selector,options)=>{
   assert.deepEqual(selector,{_id:'user','profile.notifications.activity':'event'});
   assert.deepEqual(options,{fields:{_id:1}});return {_id:'user'};
  }};
 assert.equal(await addNotificationOnce(users,'user','event'),1);
 assert.deepEqual(calls,[[{_id:'user','profile.notifications.activity':{$ne:'event'}},
  {$addToSet:{'profile.notifications':{activity:'event',read:null}}}]]);
});
test('lost replies require readback; missing recipients and unconfirmed writes never succeed',async()=>{
 const failure=new Error('lost reply');
 for(const matched of [0,1])assert.equal(await addNotificationOnce({updateAsync:async()=>matched,findOneAsync:async()=>null},'u','e'),0);
 assert.equal(await addNotificationOnce({updateAsync:async()=>{throw failure;},findOneAsync:async()=>({_id:'u'})},'u','e'),1);
 await assert.rejects(addNotificationOnce({updateAsync:async()=>{throw failure;},findOneAsync:async()=>null},'u','e'),e=>e===failure);
 const unavailable=new Error('read failed');
 await assert.rejects(addNotificationOnce({updateAsync:async()=>1,findOneAsync:async()=>{throw unavailable;}},'u','e'),e=>e===unavailable);
});
test('invalid identities fail before collection access',async()=>{
 for(const pair of [[null,'e'],['u',''],['','e'],['u',{}]])await assert.rejects(addNotificationOnce({},...pair),/invalid-notification-identity/);
});
