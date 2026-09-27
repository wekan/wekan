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
