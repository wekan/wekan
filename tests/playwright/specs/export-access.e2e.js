'use strict';
const {test,expect}=require('../fixtures');const db=require('../helpers/db');
const routes=['export','exportZip','export/csv','calendar.ics','exportPDF','exportExcel','charts/burndown/exportPDF','charts/burndown/exportExcel'];
for(const route of routes)test(`assigned-only private member cannot read unfiltered ${route}`,async({request,user2,board})=>{
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isNormalAssignedOnly:true}}});
 const card=db.find('cards',{boardId:board.boardId})[0];db.updateOne('cards',{_id:card._id},{$set:{assignees:[user2.id]}});
 const response=await request.get(`/api/boards/${board.boardId}/${route}?authToken=${encodeURIComponent(user2.token)}`);
 expect(response.status()).toBe(403);expect(await response.text()).not.toContain('Beta Card');
});
test('assigned-only member retains explicitly scoped Scrum chart export',async({request,user2,board})=>{
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isNormalAssignedOnly:true}}});
 const response=await request.get(`/api/boards/${board.boardId}/charts/scrumVelocity/exportExcel?authToken=${encodeURIComponent(user2.token)}`);
 expect(response.status()).toBe(200);expect(response.headers()['content-type']).toContain('spreadsheet');
});
for(const format of ['PDF','Excel'])test(`assigned-only member cannot export an unassigned card as ${format}`,async({request,user2,board})=>{
 db.updateOne('boards',{_id:board.boardId},{$push:{members:{userId:user2.id,isActive:true,isAdmin:false,isCommentAssignedOnly:true}}});
 const card=db.find('cards',{boardId:board.boardId})[0];
 const response=await request.get(`/api/boards/${board.boardId}/lists/${card.listId}/cards/${card._id}/export${format}?authToken=${encodeURIComponent(user2.token)}`);
 expect(response.status()).toBe(403);expect(await response.text()).not.toContain('Alpha Card');
});
