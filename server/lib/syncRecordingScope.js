'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();
const KINDS = ['create','archive','title','description','customFields','history','timing'];
// A checklist item's three hooks, for a scope that names that item.
const ITEM_KINDS = ['itemUncomplete','itemCheck','itemHistory'];
async function withSyncRecordingDeferred({ cardId, boardId, listId, kinds, itemId = null }, work) {
  if (![cardId,boardId,listId].every(value=>typeof value==='string'&&value) || !Array.isArray(kinds) ||
      (itemId!==null && (typeof itemId!=='string' || !itemId)) ||
      kinds.some(kind=>!(itemId===null ? KINDS : ITEM_KINDS).includes(kind)) || typeof work!=='function') throw new Error('sync-recording-scope-invalid');
  const scope={cardId,boardId,listId,itemId,kinds:new Set(kinds),active:true};
  return storage.run(scope,async()=>{
    try{return await work();}finally{scope.active=false;}
  });
}
function deferSyncRecording(kind, doc, fields) {
  const scope=storage.getStore();
  if(!scope?.active || !scope.kinds.has(kind) || doc?._id!==scope.cardId ||
      doc.boardId!==scope.boardId || doc.listId!==scope.listId) return false;
  // Sync's own fields, and the one field a durable rule card action changes
  // (server/lib/syncRuleCardCommand.js); its History is written from its plan.
  if(kind==='history' && (!Array.isArray(fields) || fields.some(field=>!['title','description','spentTime','customFields','archived','labelIds','color','dueComplete','startAt','endAt','dueAt','receivedAt','members'].includes(field)))) return false;
  // Each expected hook consumes its own slot. Nested/unrelated writes and
  // delayed callbacks after the owning mutation must keep normal recording.
  scope.kinds.delete(kind);
  return true;
}
// The same one-shot slots for the one checklist item a scope names.
function deferSyncItemRecording(kind, doc) {
  const scope=storage.getStore();
  if(!scope?.active || scope.itemId===null || !scope.kinds.has(kind) || doc?._id!==scope.itemId ||
      doc.cardId!==scope.cardId) return false;
  scope.kinds.delete(kind);
  return true;
}
module.exports={withSyncRecordingDeferred,deferSyncRecording,deferSyncItemRecording};
