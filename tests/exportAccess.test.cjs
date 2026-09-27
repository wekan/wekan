'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {canExportBoardData}=require('../models/lib/exportAccess');
test('export authorization denies every assigned-only role except scoped Scrum reports',()=>{
 for(const role of ['isReadAssignedOnly','isNormalAssignedOnly','isCommentAssignedOnly']){
  const board={members:[{userId:'u',isActive:true,[role]:true}],isVisibleBy:()=>true};
  for(const key of [null,'agingWip','velocity','scrumOther'])assert.equal(canExportBoardData(board,{_id:'u'},key),false);
  for(const key of ['scrumVelocity','scrumSprint'])assert.equal(canExportBoardData(board,{_id:'u'},key),true);
 }
 assert.equal(canExportBoardData({members:[],isVisibleBy:()=>false},{_id:'u'},'scrumSprint'),false);
 assert.equal(canExportBoardData(null,{_id:'u'}),false);
 assert.equal(canExportBoardData({members:[],isVisibleBy:()=>true},{_id:'u'}),true);
 assert.equal(canExportBoardData({members:[],isVisibleBy:()=>true},null),true);
});
test('every exporter authorization uses the shared scope decision rather than board visibility alone',()=>{
 const root=path.join(__dirname,'../models');
 const files=['exporter.js',...fs.readdirSync(path.join(root,'server')).filter(n=>/^Exporter.*\.js$/.test(n)).map(n=>`server/${n}`)];
 let checks=0;
 for(const file of files){
  const source=fs.readFileSync(path.join(root,file),'utf8');
  const methods=[...source.matchAll(/async canExport\(user\)\s*\{([\s\S]*?)\n  \}/g)];
  for(const [,body] of methods){checks++;assert.match(body,/return canExportBoardData\(board, user/ ,file);assert.doesNotMatch(body,/return board && board\.isVisibleBy/,file);}
 }
 assert.equal(checks,9);
});
