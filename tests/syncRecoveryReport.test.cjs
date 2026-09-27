'use strict';
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
test('Recovery Sync method requires administrator access before and after its private read',async()=>{
  for(const scenario of ['admin','regular','anonymous','revoked']){
    let methods,reads=0,checks=0;
    const context={Meteor:{methods:value=>{methods=value;},users:{findOneAsync:async()=>({isAdmin:scenario==='admin'||scenario==='revoked'&&++checks===1})},Error:class extends Error{constructor(code){super(code);this.error=code;}}},
      DDPRateLimiter:{addRule(){}},check(){},ListSyncRunReports:{rawCollection:()=>({})},
      require:id=>id==='/server/lib/syncRunReportPage'?{syncRunReportPage:async()=>{reads++;return {rows:[],total:0};}}:{},};
    vm.createContext(context);vm.runInContext(fs.readFileSync('server/methods/listSync.js','utf8').replace(/^import .*;\n/gm,''),context);
    const call=()=>methods.syncRecoveryReport.call({userId:scenario==='anonymous'?null:'user'},{search:'',status:'all',page:1});
    if(scenario==='admin'){assert.equal((await call()).total,0);assert.equal(reads,1);}
    else{await assert.rejects(call(),/not-authorized/);assert.equal(reads,scenario==='revoked'?1:0);}
  }
});
