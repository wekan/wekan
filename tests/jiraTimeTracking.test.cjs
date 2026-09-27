'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {jiraTimeTracking}=require('../models/lib/jiraTimeTracking');
test('Jira numeric seconds become hours with zero and missing values distinct',()=>{
 assert.deepEqual(jiraTimeTracking({timetracking:{originalEstimateSeconds:7200,remainingEstimateSeconds:0,timeSpentSeconds:1800}}),{original:2,remaining:0,spent:.5});
 assert.deepEqual(jiraTimeTracking({timeoriginalestimate:3600,timeestimate:900,timespent:1}),{original:1,remaining:.25,spent:1/3600});
 assert.deepEqual(jiraTimeTracking({timespent:3600,timetracking:{timeSpentSeconds:0}}),{spent:0});
 assert.deepEqual(jiraTimeTracking({timespent:3600,timetracking:{timeSpentSeconds:null}}),{spent:1});
});
test('localized strings and partial worklogs are not guessed as aggregate time',()=>{
 assert.deepEqual(jiraTimeTracking({timetracking:{originalEstimate:'1w',timeSpent:'1h'},worklog:{worklogs:[{timeSpentSeconds:3600}]}}),{});
 assert.deepEqual(jiraTimeTracking(),{});
});
test('invalid numeric durations fail instead of creating corrupt time data',()=>{
 for(const value of [-1,1.5,Infinity,NaN,'3600',true,{},Number.MAX_SAFE_INTEGER+1]) {
  assert.throws(()=>jiraTimeTracking({timetracking:{timeSpentSeconds:value}}),/expected nonnegative integer seconds/);
  assert.throws(()=>jiraTimeTracking({timeestimate:value}),/expected nonnegative integer seconds/);
 }
});

test('Jira export uses stable field markers and respects section selection',()=>{
 const {jiraTimeTrackingExport}=require('../models/lib/jiraTimeTracking');
 const definitions=[{_id:'a',name:'Renamed',type:'number',settings:{jiraTimeField:'original'}},{_id:'b',type:'number',settings:{jiraTimeField:'remaining'}}];
 const card={spentTime:.5,customFields:[{_id:'a',value:1/3600},{_id:'b',value:0}]};
 assert.deepEqual(jiraTimeTrackingExport(card,definitions),{timeSpentSeconds:1800,originalEstimateSeconds:1,remainingEstimateSeconds:0});
 assert.deepEqual(jiraTimeTrackingExport(card,definitions,new Set(['dates'])),{timeSpentSeconds:1800});
 assert.deepEqual(jiraTimeTrackingExport(card,definitions,new Set(['custom-fields'])),{originalEstimateSeconds:1,remainingEstimateSeconds:0});
 assert.deepEqual(jiraTimeTrackingExport(card,definitions,new Set(['description'])),{});
 assert.deepEqual(jiraTimeTracking({timetracking:jiraTimeTrackingExport(card,definitions)}),{original:1/3600,remaining:0,spent:.5});
});
test('Jira export does not infer field semantics from names or emit invalid or ambiguous values',()=>{
 const {jiraTimeTrackingExport}=require('../models/lib/jiraTimeTracking');
 const definition={_id:'a',name:'Jira original estimate (hours)',type:'number',settings:{}};
 assert.deepEqual(jiraTimeTrackingExport({customFields:[{_id:'a',value:2}]},[definition]),{});
 definition.settings.jiraTimeField='original';
 for(const value of [-1,Infinity,NaN,'2',null,Number.MAX_VALUE]) assert.deepEqual(jiraTimeTrackingExport({spentTime:value,customFields:[{_id:'a',value}]},[definition]),{});
 assert.deepEqual(jiraTimeTrackingExport({customFields:[{_id:'a',value:2}]},[definition,{...definition,_id:'b'}]),{});
});

test('import selections remove nested and fallback Jira time fields before creation',async()=>{
 const fs=require('node:fs');
 const source=fs.readFileSync('models/lib/importParts.js','utf8');
 const {pruneImportDocument}=await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
 const input=()=>({issues:[{fields:{summary:'Kept',timeoriginalestimate:7200,timeestimate:3600,timespent:1800,
  timetracking:{originalEstimateSeconds:7200,remainingEstimateSeconds:3600,timeSpentSeconds:1800}}}]});
 for(const [fields,expected] of [[['dates'],{spent:.5}],[['custom-fields'],{original:2,remaining:1}],[['description'],{}],[[],{original:2,remaining:1,spent:.5}]]){
  const result=pruneImportDocument(input(),fields);
  assert.deepEqual(jiraTimeTracking(result.issues[0].fields),expected);
  assert.equal(result.issues[0].fields.summary,'Kept');
 }
});

test('the shared Jira parser exposes spent hours without fabricating absent totals',async()=>{
 const {parseJira}=await import('../models/lib/externalParsers.js');
 assert.equal(parseJira({issues:[{key:'T-1',fields:{timespent:1800}}]}).tasks[0].spentTime,.5);
 assert.equal(parseJira({issues:[{key:'T-1',fields:{timetracking:{timeSpentSeconds:0}}}]}).tasks[0].spentTime,0);
 assert.equal(parseJira({issues:[{key:'T-1',fields:{}}]}).tasks[0].spentTime,undefined);
});
