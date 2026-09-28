'use strict';
const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();
const KINDS = ['create','archive','title','description','customFields','history'];
async function withSyncRecordingDeferred({ cardId, boardId, listId, kinds }, work) {
  if (![cardId,boardId,listId].every(value=>typeof value==='string'&&value) || !Array.isArray(kinds) ||
      kinds.some(kind=>!KINDS.includes(kind)) || typeof work!=='function') throw new Error('sync-recording-scope-invalid');
  const scope={cardId,boardId,listId,kinds:new Set(kinds),active:true};
  return storage.run(scope,async()=>{
    try{return await work();}finally{scope.active=false;}
  });
}
function deferSyncRecording(kind, doc, fields) {
  const scope=storage.getStore();
  if(!scope?.active || !scope.kinds.has(kind) || doc?._id!==scope.cardId ||
      doc.boardId!==scope.boardId || doc.listId!==scope.listId) return false;
  if(kind==='history' && (!Array.isArray(fields) || fields.some(field=>!['title','description','spentTime','customFields','archived'].includes(field)))) return false;
  // Each expected hook consumes its own slot. Nested/unrelated writes and
  // delayed callbacks after the owning mutation must keep normal recording.
  scope.kinds.delete(kind);
  return true;
}
module.exports={withSyncRecordingDeferred,deferSyncRecording};
