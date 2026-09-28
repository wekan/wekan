'use strict';
const { EJSON } = require('bson');
const { canonical } = require('../../models/lib/changeHistoryIntegrity');
const { prepareSyncOperationMutation } = require('./syncOperationMutation');
const { withSyncRecordingDeferred } = require('./syncRecordingScope');
const copy=value=>EJSON.parse(EJSON.stringify(value),{relaxed:true});
const fail=()=>{throw new Error('sync-hooked-card-adapter-invalid');};
// Bind to one already validated unit. withActor must run through the server's
// Meteor invocation context so schema defaults and business hooks see its actor.
function createSyncHookedCards({ cards, step, userId, withActor }) {
  const mutation=prepareSyncOperationMutation(step);
  if(typeof userId!=='string'||!userId||typeof withActor!=='function'||
      !['findOneAsync','insertAsync','updateAsync'].every(key=>typeof cards?.[key]==='function'))fail();
  // SimpleSchema owns this timestamp and changes it on every write. A plan
  // must compare Sync-owned fields, not assert a precomputed autoValue result.
  if([step.before,step.after].some(snapshot=>snapshot&&Object.hasOwn(snapshot,'dateLastActivity')))fail();
  const scope={cardId:step.cardId,boardId:step.after.boardId,listId:step.after.listId,
    kinds:step.kind==='create'?['create']:['archive','title','description','customFields','history']};
  const options={removeEmptyStrings:false,trimStrings:false};
  const write=fn=>withActor(userId,()=>withSyncRecordingDeferred(scope,fn));
  return {
    findOne:async selector=>{
      const allowed=[mutation.afterSelector,{_id:scope.cardId},...(mutation.beforeSelector?[mutation.beforeSelector]:[])];
      if(!allowed.some(expected=>canonical(expected)===canonical(selector)))fail();
      return cards.findOneAsync(copy(selector),{transform:null});
    },
    insertOne:async document=>{
      if(mutation.kind!=='create'||canonical(document)!==canonical(mutation.document))fail();
      const insertedId=await write(()=>cards.insertAsync(copy(document),options));
      return {insertedId};
    },
    updateOne:async(selector,modifier)=>{
      if(mutation.kind==='create'||canonical(selector)!==canonical(mutation.beforeSelector)||canonical(modifier)!==canonical(mutation.modifier))fail();
      const matchedCount=await write(()=>cards.updateAsync(copy(selector),copy(modifier),options));
      return {matchedCount};
    },
  };
}
module.exports={createSyncHookedCards};
