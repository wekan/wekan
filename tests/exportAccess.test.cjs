'use strict';
// ExportScopeBleed: board visibility cannot authorize an unscoped export.
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');
const {canExportBoardData}=require('../models/lib/exportAccess');
test('export authorization denies every assigned-only role except scoped Scrum reports',()=>{
 for(const role of ['isReadAssignedOnly','isNormalAssignedOnly','isCommentAssignedOnly']){
  const board={members:[{userId:'u',isActive:true,[role]:true}],isVisibleBy:()=>true};
  for(const key of [null,'agingWip','velocity','scrumOther'])assert.equal(canExportBoardData(board,{_id:'u'},key),false);
  for(const key of ['scrumVelocity','scrumSprint','scrumDaily'])assert.equal(canExportBoardData(board,{_id:'u'},key),true);
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

// ExportScopeBleed sibling (2026-10-02): the in-app boardChartData method
// checked only board visibility, while its loaders read every card - so an
// assigned-only member got the chart data the export routes refuse them.
test('every caller of the chart loaders follows the export rule (negative)', () => {
  const fs = require('fs');
  const path = require('path');
  const root = path.join(__dirname, '..');
  const walk = dir => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap(e => {
    if (e.name === 'tests' || e.name.startsWith('_build') || e.name === 'node_modules') return [];
    const rel = `${dir}/${e.name}`;
    return e.isDirectory() ? walk(rel) : (rel.endsWith('.js') ? [rel] : []);
  });
  let callers = 0;
  for (const file of ['server', 'models'].flatMap(walk)) {
    if (file === 'server/lib/boardChartData.js') continue;
    const src = fs.readFileSync(path.join(root, file), 'utf8');
    for (const m of src.matchAll(/await loadBoardChartData\(/g)) {
      callers += 1;
      const before = src.slice(Math.max(0, m.index - 1500), m.index);
      assert.match(before, /canExportBoardData\(|exporter\.canExport\(|\.canExport\(user\)/, `${file}: loadBoardChartData without the export rule`);
    }
  }
  assert.ok(callers >= 1);
});
