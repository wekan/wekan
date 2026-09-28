'use strict';
const { test, expect } = require('../fixtures');
const db = require('../helpers/db');
const { loginWithToken } = require('../helpers/auth');
for (const role of ['member','admin']) {
 test(`tray delivery evidence rejects ${role} browser writes and stays private`,async({page,user,adminUser})=>{
  const actor=role==='admin'?adminUser:user,id=db.uid('tray-receipt');
  db.insertOne('notificationTrayReceipts',{_id:id,marker:'private'});
  db.updateOne('users',{_id:actor.id},{$set:{notificationDeliveryRevision:'private',notificationDeliveryPending:{marker:'private'}}});
  try {
   await loginWithToken(page,actor.id,actor.token);
   const result=await page.evaluate(async({id,userId})=>{
    const errors=[];
    for(const [name,args] of [
     ['/notificationTrayReceipts/insert',[{_id:`${id}-forged`}]],
     ['/notificationTrayReceipts/update',[id,{$set:{marker:'forged'}}]],
     ['/notificationTrayReceipts/remove',[id]],
     ['/users/update',[userId,{$set:{notificationDeliveryRevision:'forged'}}]],
     ['/users/update',[userId,{$unset:{notificationDeliveryPending:''}}]],
     ['/users/update',[userId,{$rename:{'profile.fullname':'notificationDeliveryRevision'}}]],
    ]){try{await Meteor.callAsync(name,...args);errors.push('accepted');}catch(error){errors.push(error.error);}}
    return {errors,visible:!!Meteor.connection._stores.notificationTrayReceipts?._getCollection?.().findOne(id),
     revision:Meteor.user()?.notificationDeliveryRevision,pending:Meteor.user()?.notificationDeliveryPending};
   },{id,userId:actor.id});
   expect(result.errors).toEqual(Array(6).fill(403));expect(result.visible).toBe(false);
   expect(result.revision).toBeUndefined();expect(result.pending).toBeUndefined();
   expect(db.findOne('notificationTrayReceipts',{_id:id}).marker).toBe('private');
   expect(db.findOne('notificationTrayReceipts',{_id:`${id}-forged`})).toBeNull();
   expect(db.findOne('users',{_id:actor.id}).notificationDeliveryRevision).toBe('private');
  }finally{
   db.deleteMany('notificationTrayReceipts',{_id:{$in:[id,`${id}-forged`]}});
   db.updateOne('users',{_id:actor.id},{$unset:{notificationDeliveryRevision:'',notificationDeliveryPending:''}});
  }
 });
}
