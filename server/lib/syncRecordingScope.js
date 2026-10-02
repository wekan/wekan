'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();
// 'position' is not a hook: it lets 'history' defer the hook's position row
// too, for a durable rule move (server/lib/syncRuleMoveCommand.js), whose
// 'move' is the update hook's moveCard activity.
// 'boardMove' lets 'history' defer the dependencies row too, and
// 'labelActivities' is the before-update hook that re-points a card's
// addedLabel activities - both for a durable rule move to another board
// (server/lib/syncRuleMoveBoardCommand.js), whose scope names the board the
// card leaves as `fromBoardId`: that hook runs while the card is still there.
const KINDS = ['create','archive','title','description','customFields','history','timing','position','move',
  'boardMove','labelActivities'];
// A checklist item's three hooks, for a scope that names that item.
const ITEM_KINDS = ['itemUncomplete','itemCheck','itemHistory'];
// A checklist's activity hook and its History lifecycle hook, for a scope that
// names that checklist (server/lib/syncRuleChecklistLifecycleCommand.js).
// ...and its items' two hooks, for each item the same command inserts.
const CHECKLIST_KINDS = ['checklistActivity','checklistHistory','checklistItemActivity','checklistItemHistory'];
// A copied attachment's History lifecycle hook, for a scope that names it
// (server/lib/syncRuleCopyCardCommand.js).
const ATTACHMENT_KINDS = ['attachmentHistory'];
async function withSyncRecordingDeferred({ cardId, boardId, listId, kinds, itemId = null, checklistId = null,
  attachmentId = null, fromBoardId = null }, work) {
  const named = [itemId, checklistId, attachmentId].filter(value => value !== null);
  if (![cardId,boardId,listId].every(value=>typeof value==='string'&&value) || !Array.isArray(kinds) ||
      named.length > 1 || named.some(value => typeof value!=='string' || !value) ||
      kinds.some(kind=>!(itemId!==null ? ITEM_KINDS : checklistId!==null ? CHECKLIST_KINDS
        : attachmentId!==null ? ATTACHMENT_KINDS : KINDS).includes(kind)) ||
      typeof work!=='function' ||
      (kinds.includes('labelActivities') !== (typeof fromBoardId==='string' && fromBoardId.length>0))) {
    throw new Error('sync-recording-scope-invalid');
  }
  const scope={cardId,boardId,listId,itemId,checklistId,attachmentId,fromBoardId,kinds:new Set(kinds),active:true};
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
    ...(scope.kinds.has('position') ? ['position'] : []), ...(scope.kinds.has('boardMove') ? ['cardDependencies'] : [])];
  if(kind==='history' && (!Array.isArray(fields) || fields.some(field=>!allowed.includes(field)))) return false;
  // Each expected hook consumes its own slot. Nested/unrelated writes and
  // delayed callbacks after the owning mutation must keep normal recording.
  scope.kinds.delete(kind);
  return true;
}
// The label-activity hook of a move to another board: a before-update hook, so
// it sees the card on the board it leaves.
function deferSyncLabelActivities(doc) {
  const scope=storage.getStore();
  if(!scope?.active || !scope.kinds.has('labelActivities') || doc?._id!==scope.cardId ||
      doc.boardId!==scope.fromBoardId) return false;
  scope.kinds.delete('labelActivities');
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
// The same one-shot slot for the one attachment a scope names.
function deferSyncAttachmentRecording(kind, doc) {
  const scope=storage.getStore();
  if(!scope?.active || scope.attachmentId===null || !scope.kinds.has(kind) || doc?._id!==scope.attachmentId ||
      doc.meta?.cardId!==scope.cardId) return false;
  scope.kinds.delete(kind);
  return true;
}
// A swimlane's creation activity, for a durable rule addSwimlane
// (server/lib/syncRuleAddSwimlaneCommand.js), which writes it itself. A
// swimlane has no card, so this scope names the swimlane alone.
const swimlaneStorage = new AsyncLocalStorage();
async function withSyncSwimlaneActivityDeferred(swimlaneId, work) {
  if (typeof swimlaneId!=='string' || !swimlaneId || typeof work!=='function') throw new Error('sync-recording-scope-invalid');
  const scope={swimlaneId,active:true};
  return swimlaneStorage.run(scope,async()=>{ try{return await work();}finally{scope.active=false;} });
}
function deferSyncSwimlaneActivity(doc) {
  const scope=swimlaneStorage.getStore();
  if(!scope?.active || doc?._id!==scope.swimlaneId) return false;
  scope.active=false;
  return true;
}
module.exports={withSyncRecordingDeferred,deferSyncRecording,deferSyncLabelActivities,deferSyncItemRecording,deferSyncChecklistRecording,
  deferSyncAttachmentRecording,withSyncSwimlaneActivityDeferred,deferSyncSwimlaneActivity};
