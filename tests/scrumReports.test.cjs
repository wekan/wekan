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

test('chart scales separate incompatible estimates and policies, retaining zero and unknown values',()=>{
 const {reportChartGroups}=require('../models/lib/scrumReports');
 const report=(name,estimate,policy='dueComplete',unit='points')=>sprintReport({name,state:'closed',
  startSnapshot:{unit,completionPolicy:policy,estimateSource:'poker',cards:[{cardId:'a',estimate}]},
  closeSnapshot:{unit,completionPolicy:policy,estimateSource:'poker',cards:[{cardId:'a',estimate,done:true}]}});
 const rows=[report('First',3),report('Second',6),report('Other policy',30,'doneLists'),report('Hours',100,'dueComplete','hours')];
 const before=JSON.stringify(rows);
 const groups=reportChartGroups(rows,'estimate',true);
 assert.equal(groups.length,3);
 assert.equal(groups[0].rows[0].series[0].width,50);
 assert.equal(groups[0].rows[1].series[0].width,100);
 assert.equal(groups[1].rows[0].series[0].width,100);
 assert.equal(groups[0].rows[0].series.length,2);
 assert.equal(reportChartGroups(rows,'count')[0].rows[0].series.length,5);
 assert.equal(JSON.stringify(rows),before);
 const unknown=reportChartGroups([report('Unknown',null),report('Zero',0)],'estimate')[0];
 assert.equal(unknown.max,0);
 assert.equal(unknown.rows[0].series[0].width,0);
 assert.equal(unknown.rows[0].series[0].total.unknown,1);
 assert.equal(unknown.rows[1].series[0].total.unknown,0);
 assert.deepEqual(reportChartGroups([sprintReport({state:'active'})]),[]);
 assert.deepEqual(reportChartGroups([]),[]);
});

test('charts isolate custom fields and keep partial report warnings',()=>{
 const {reportChartGroups}=require('../models/lib/scrumReports');
 const base=sprintReport({name:'Partial',startSnapshot:{partial:true,cards:[]},closeSnapshot:{cards:[]}});
 const rows=['a','b'].map(estimateCustomFieldId=>({...base,estimateSource:'customField',estimateCustomFieldId}));
 const groups=reportChartGroups(rows);
 assert.equal(groups.length,2);
 assert.equal(groups[0].rows[0].partial,true);
 assert.equal(groups[1].rows[0].partial,true);
});
