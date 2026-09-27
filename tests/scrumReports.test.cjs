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
 assert.equal(table.headers.length,24);
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

test('partial snapshots never share a chart scale with whole-board totals',()=>{
 const {reportChartGroups}=require('../models/lib/scrumReports');
 const base=sprintReport({name:'Whole board',startSnapshot:{cards:[{cardId:'x',estimate:10}]},closeSnapshot:{cards:[{cardId:'x',estimate:10,done:true}]}});
 const partial={...base,name:'Partial import',partial:true,committed:{count:1,estimate:1,unknown:0},completed:{count:1,estimate:1,unknown:0}};
 const groups=reportChartGroups([base,partial],'estimate',true);
 assert.equal(groups.length,2);
 assert.equal(groups[0].max,10);
 assert.equal(groups[1].max,1);
 assert.equal(groups[1].rows[0].partial,true);
});

test('maximum-size snapshots match completed commitments with bounded ID reads',()=>{
 // Count work rather than timing it: CI speed does not affect this bound.
 // The old nested scan needed tens of millions of reads at the allowed limit.
 const size=10000;let reads=0;
 const row=(id,estimate)=>Object.freeze({get cardId(){
  assert.ok(++reads<=size*10,'report performs repeated full-snapshot scans');
  return id;
 },estimate,done:true});
 const start=Object.freeze(Array.from({length:size},(_,i)=>row(`card-${i}`,1)));
 const end=Object.freeze(Array.from({length:size},(_,i)=>row(`card-${i+size/2}`,2)));
 const report=sprintReport({startSnapshot:{cards:start},closeSnapshot:{cards:end}});
 assert.deepEqual(report.completedCommitment,{count:5000,estimate:5000,unknown:0});
 assert.deepEqual(report.completed,{count:10000,estimate:20000,unknown:0});
 assert.deepEqual(report.added,{count:5000,estimate:10000,unknown:0});
 assert.deepEqual(report.removed,{count:5000,estimate:5000,unknown:0});
});

test('planned working days use the recorded UTC calendar, preserving unknown and zero',()=>{
 const {plannedWorkingDays}=require('../models/lib/scrumReports');
 assert.equal(plannedWorkingDays('2026-09-21','2026-09-27',[1,2,3,4,5]),5);
 assert.equal(plannedWorkingDays('2026-09-26','2026-09-27',[1,2,3,4,5]),0);
 assert.equal(plannedWorkingDays('2024-02-28','2024-03-01',[1,2,3,4,5]),3);
 assert.equal(plannedWorkingDays('2026-09-21','2026-10-04',[7,7]),2);
 for(const args of [[null,'2026-09-27',[1]],['invalid','2026-09-27',[1]],['2026-09-27','2026-09-21',[1]],['2026-09-21','2026-09-27',undefined],['2026-09-21','2026-09-27',[8]]])assert.equal(plannedWorkingDays(...args),null);
 const report=sprintReport({plannedStart:'2026-09-21',plannedEnd:'2026-09-27',startSnapshot:{workingDays:[1,3,5],cards:[]},closeSnapshot:{workingDays:[1,2,3,4,5],cards:[]}});
 assert.equal(report.plannedWorkingDays,3);
 const {chartExportRows}=require('../models/lib/chartExportRows');
 assert.equal(chartExportRows('scrumSprint',{reports:[report]}).rows[0][17],3);
 assert.equal(chartExportRows('scrumSprint',{reports:[sprintReport({})]}).rows[0][17],'');
});

test('snapshot calendar is copied independently from current settings',()=>{
 const {sprintSnapshot,DEFAULT_SCRUM_SETTINGS}=require('../models/lib/scrum');
 const settings={...DEFAULT_SCRUM_SETTINGS,workingDays:[1,3,5]};
 const snapshot=sprintSnapshot([],settings,[]);
 settings.workingDays.push(7);
 assert.deepEqual(snapshot.workingDays,[1,3,5]);
});

test('exports preserve policy context and completed original commitment estimates',()=>{
 const {chartExportRows}=require('../models/lib/chartExportRows');
 const report=sprintReport({name:'Context',startSnapshot:{cards:[{cardId:'original',estimate:2},{cardId:'unknown',estimate:null}]},closeSnapshot:{estimateSource:'customField',estimateCustomFieldId:'field-id',completionPolicy:'doneLists',cards:[{cardId:'original',estimate:8,done:true},{cardId:'unknown',estimate:5,done:true},{cardId:'added',estimate:10,done:true}]}});
 for(const key of ['scrumSprint','scrumVelocity']){
  const table=chartExportRows(key,{reports:[report]});
  assert.equal(table.headers.length,table.rows[0].length);
  assert.deepEqual(table.rows[0].slice(18),['customField','field-id','doneLists',2,2,1]);
  assert.equal(report.completed.estimate,23);
 }
 const legacy=chartExportRows('scrumSprint',{reports:[sprintReport({})]}).rows[0];
 assert.deepEqual(legacy.slice(18,21),['','','']);
});

test('Scrum PDF renders every metric as wrapped labels while other charts keep tables',async()=>{
 const fs=require('node:fs');
 const {line,tableRow,wrapTextBlock,TEXT_WIDTH}=await import('../models/lib/pdfDocument.js');
 const source=fs.readFileSync('models/server/ExporterChartPDF.js','utf8');
 const start=source.indexOf("    if (['scrumVelocity', 'scrumSprint', 'scrumDaily'].includes(this._chartKey)) {");
 const end=source.indexOf('    if (!rows.length)',start);
 assert.ok(start>=0&&end>start);
 const render=new Function('headers','rows','lines','line','tableRow','wrapTextBlock',source.slice(start,end)+';return lines;');
 const headers=['Sprint','Completion policy','Unknown estimate'];
 const rows=[['A long sprint name '.repeat(15),'doneLists',0]];
 for(const key of ['scrumVelocity','scrumSprint']){
  const result=render.call({_chartKey:key},headers,rows,[],line,tableRow,wrapTextBlock);
  assert.ok(result.every(row=>!row.tableCells));
  assert.ok(result.every(row=>!row.text||row.text.length<=TEXT_WIDTH));
  assert.ok(result.some(row=>row.text==='Completion policy: doneLists'));
  assert.ok(result.some(row=>row.text==='Unknown estimate: 0'));
  assert.ok(result.filter(row=>row.bold).length>1);
 }
 const other=render.call({_chartKey:'burndown'},headers,rows,[],line,tableRow,wrapTextBlock);
 assert.equal(other.length,2);assert.equal(other[0].tableHeader,true);
});
