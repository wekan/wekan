'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const {ruleButtonMetadata}=require('../models/lib/ruleButtonMetadata');
test('button metadata retains explicit scope and label with sensible defaults',()=>{
 assert.deepEqual(ruleButtonMetadata({activityType:'button',buttonType:'board',buttonLabel:'Run'},'Title'),{$set:{buttonType:'board',buttonLabel:'Run'}});
 assert.deepEqual(ruleButtonMetadata({activityType:'button'},'Title'),{$set:{buttonType:'card',buttonLabel:'Title'}});
});
test('automatic triggers remove stale metadata even when old button fields remain in a REST patch',()=>{
 assert.deepEqual(ruleButtonMetadata({activityType:'createCard',buttonType:'board',buttonLabel:'Old'},'Title'),{$unset:{buttonType:'',buttonLabel:''}});
 assert.deepEqual(ruleButtonMetadata(null,'Title'),{$unset:{buttonType:'',buttonLabel:''}});
});
