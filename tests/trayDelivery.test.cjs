'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createTrayDelivery, receiptFor } = require('../server/lib/trayDelivery');
test('receipts bind exact user and event identities with bounded input',()=>{
 assert.deepEqual(receiptFor('u','a'),receiptFor('u','a'));
 assert.notEqual(receiptFor('u','a')._id,receiptFor('v','a')._id);
 assert.notEqual(receiptFor('u','a')._id,receiptFor('u','b')._id);
 for(const [user,event] of [[null,'a'],['','a'],['u',{}],['u','x'.repeat(1025)]])assert.throws(()=>receiptFor(user,event),/identity-invalid/);
});
test('even an existing receipt cannot acknowledge work after the ownership guard fails',async()=>{
 let guards=0;
 const queue=createTrayDelivery({users:{},receipts:{findOne:async()=>receiptFor('u','a')},
  assertCurrent:async()=>{if(++guards===2)throw new Error('lease lost');}});
 await assert.rejects(queue.deliver('u','a'),/lease lost/);
});

test('user permissions reject receipt-marker paths and rename destinations without blocking preferences',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const source=fs.readFileSync(require.resolve('../models/users.js'),'utf8');
 const start=source.indexOf('export const USER_UPDATE_ALLOWED_EXACT'),end=source.indexOf('// Custom MongoDB engine',start),context={};
 vm.runInNewContext(source.slice(start,end).replace(/export /g,'')+';this.forbidden=hasForbiddenUserUpdateField;',context);
 for(const field of ['notificationDeliveryRevision','notificationDeliveryPending','notificationDeliveryPending.activityId']) {
  assert.equal(context.forbidden(['profile'],{$rename:{'profile.notes':field}}),true);
  assert.equal(context.forbidden([field],{$unset:{[field]:''}}),true);
 }
 assert.equal(context.forbidden(['profile'],{$set:{'profile.language':'fi'}}),false);
});
