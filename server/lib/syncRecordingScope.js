'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();
// 'position' is not a hook: it lets 'history' defer the hook's position row
// too, for a durable rule move (server/lib/syncRuleMoveCommand.js).
const KINDS = ['create','archive','title','description','customFields','history','timing','position'];
// A checklist item's three hooks, for a scope that names that item.
const ITEM_KINDS = ['itemUncomplete','itemCheck','itemHistory'];
// A checklist's activity hook and its History lifecycle hook, for a scope that
// names that checklist (server/lib/syncRuleChecklistLifecycleCommand.js).
// ...and its items' two hooks, for each item the same command inserts.
const CHECKLIST_KINDS = ['checklistActivity','checklistHistory','checklistItemActivity','checklistItemHistory'];
async function withSyncRecordingDeferred({ cardId, boardId, listId, kinds, itemId = null, checklistId = null }, work) {
  if (![cardId,boardId,listId].every(value=>typeof value==='string'&&value) || !Array.isArray(kinds) ||
      (itemId!==null && (typeof itemId!=='string' || !itemId)) ||
      (checklistId!==null && (typeof checklistId!=='string' || !checklistId || itemId!==null)) ||
      kinds.some(kind=>!(itemId!==null ? ITEM_KINDS : checklistId!==null ? CHECKLIST_KINDS : KINDS).includes(kind)) ||
      typeof work!=='function') throw new Error('sync-recording-scope-invalid');
  const scope={cardId,boardId,listId,itemId,checklistId,kinds:new Set(kinds),active:true};
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
  // A move's position row only when the scope says so: other Sync writes that
  // change placement keep recording it ordinarily.
  const allowed=['title','description','spentTime','customFields','archived','labelIds','color','dueComplete','startAt','endAt','dueAt','receivedAt','members',
    ...(scope.kinds.has('position') ? ['position'] : [])];
  if(kind==='history' && (!Array.isArray(fields) || fields.some(field=>!allowed.includes(field)))) return false;
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
// The same one-shot slots for the one checklist a scope names.
function deferSyncChecklistRecording(kind, doc) {
  const scope=storage.getStore();
  // An item kind names the item by its checklist: the scope wraps one insert.
  const owner=kind.startsWith('checklistItem') ? doc?.checklistId : doc?._id;
  if(!scope?.active || scope.checklistId===null || !scope.kinds.has(kind) || owner!==scope.checklistId ||
      doc.cardId!==scope.cardId) return false;
  scope.kinds.delete(kind);
  return true;
}
module.exports={withSyncRecordingDeferred,deferSyncRecording,deferSyncItemRecording,deferSyncChecklistRecording};
