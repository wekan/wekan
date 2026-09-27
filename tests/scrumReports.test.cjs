'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {total,sprintReport,velocityRows}=require('../models/lib/scrumReports');
test('Scrum totals preserve missing estimates and genuine zeroes',()=>{
 assert.deepEqual(total([{estimate:null},{estimate:0},{estimate:3},{estimate:-1}]),{count:4,estimate:3,unknown:2});
});
test('sprint report keeps commitment estimates and distinguishes scope changes',()=>{
 const sprint={_id:'s',name:'Sprint',state:'closed',startSnapshot:{unit:'points',cards:[{cardId:'a',estimate:3},{cardId:'b',estimate:null}]},closeSnapshot:{at:new Date(),unit:'points',cards:[{cardId:'a',estimate:5,done:true},{cardId:'c',estimate:0,done:true},{cardId:'d',estimate:8,done:false}]}};
 const report=sprintReport(sprint);
 assert.deepEqual(report.committed,{count:2,estimate:3,unknown:1});
 assert.deepEqual(report.completedCommitment,{count:1,estimate:3,unknown:0});
 assert.deepEqual(report.completed,{count:2,estimate:5,unknown:0});
 assert.equal(report.added.count,2);assert.equal(report.removed.unknown,1);
 assert.equal(report.incomplete.estimate,8);
 assert.equal(velocityRows([{...sprint,state:'active'},sprint]).length,1);
 assert.equal(sprint.startSnapshot.cards[0].estimate,3);
});
test('unscheduled and unfinished sprints do not pretend to have measured velocity',()=>{
 assert.equal(sprintReport({_id:'x'}).hasClose,false);
 assert.deepEqual(velocityRows([{state:'closed'},{state:'planned'}]),[]);
});
test('Excel and PDF rows retain numeric unknown counts without substituting zero estimates',()=>{
 const {chartExportRows}=require('../models/lib/chartExportRows');
 const report=sprintReport({name:'Sprint 1',startSnapshot:{unit:'points',cards:[{cardId:'x',estimate:null}]},closeSnapshot:{unit:'points',cards:[{cardId:'x',estimate:null,done:true}]}});
 const table=chartExportRows('scrumVelocity',{reports:[report]});
 assert.equal(table.headers.length,17);
 assert.deepEqual(table.rows[0].slice(0,8),['Sprint 1','points',1,0,1,1,0,1]);
 assert.equal(chartExportRows('scrumSprint',{reports:[]}).rows.length,0);
});

test('restricted sprint exports are explicitly labelled as partial',()=>{
 const {chartExportRows}=require('../models/lib/chartExportRows');
 assert.match(chartExportRows('scrumSprint',{partial:true,reports:[]}).title,/Visible assigned cards only/);
 assert.doesNotMatch(chartExportRows('scrumSprint',{partial:false,reports:[]}).title,/Visible assigned cards only/);
});
test('copied or imported partial snapshots remain labelled in report and export rows',()=>{
 const {chartExportRows}=require('../models/lib/chartExportRows');
 const report=sprintReport({name:'Reduced sprint',state:'closed',startSnapshot:{partial:true,cards:[]},closeSnapshot:{cards:[],unit:'points'}});
 assert.equal(report.partial,true);
 assert.match(chartExportRows('scrumVelocity',{reports:[report]}).rows[0][0],/Partial original snapshot/);
 assert.equal(sprintReport({startSnapshot:{cards:[]},closeSnapshot:{cards:[]}}).partial,false);
});
