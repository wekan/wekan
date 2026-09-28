'use strict';
// DirectoryGroupBleed: CAS membership uses complete literal CNs, never substring matches.
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');const vm=require('node:vm');
const {isCasGroupAllowed}=require('../packages/wekan-accounts-cas/groupPolicy');
test('CAS group policy compares complete literal CN values, including escaped DN characters',()=>{
 assert.equal(isCasGroupAllowed(['wekan'],['CN=WeKan,OU=Groups,DC=example']),true);
 assert.equal(isCasGroupAllowed(['team.a'],['cn=team.a,dc=example']),true);
 assert.equal(isCasGroupAllowed(['Team, A'],['CN=Team\\, A,OU=Groups']),true);
 assert.equal(isCasGroupAllowed(['Team, A'],['CN=Team\\2c A,OU=Groups']),true);
 assert.equal(isCasGroupAllowed(['wekan'],['uid=group+cn=wekan,dc=example']),true);
 for(const dn of ['cn=wekan-other,dc=example','cn=other,ou=cn=wekan,dc=example','cn=other\\,cn=wekan,dc=example',null])
  assert.equal(isCasGroupAllowed(['wekan'],[dn]),false,String(dn));
 assert.equal(isCasGroupAllowed(['team.a'],['cn=teamXa,dc=example']),false);
 assert.equal(isCasGroupAllowed(['wekan'],undefined),false);
 for(const config of [[],[''],['wekan',null],'wekan',0,{},true])assert.equal(isCasGroupAllowed(config,['cn=wekan']),false);
 assert.equal(isCasGroupAllowed(undefined,undefined),true);
 assert.equal(isCasGroupAllowed(false,undefined),true);
});
test('actual CAS validator rejects a prefix-only membership without a later success callback',async()=>{
 const source=fs.readFileSync(path.resolve(__dirname,'../packages/wekan-accounts-cas/cas_server.js'),'utf8');
 const code=source.slice(source.indexOf('class CAS {'),source.indexOf('////// END OF CAS MODULE'));
 let group='cn=wekan-other,dc=example';const reported=[];
 const context=vm.createContext({URL,isCasGroupAllowed,validationUrl:v=>v,console:{log(){}},
  Meteor:{settings:{cas:{allowedLdapGroups:['wekan']}}},global:{__wekanTripCanary:key=>reported.push(key)},
  https:{get(url,callback){const handlers={};callback({on(event,fn){handlers[event]=fn;},setEncoding(){}});handlers.data('xml');handlers.end();}},
  xml2js:{parseString(xml,callback){callback(null,{'cas:serviceResponse':{'cas:authenticationSuccess':[{'cas:user':['alice'],'cas:attributes':[{'cas:memberOf':[group]}]}]}});}},
 });
 vm.runInContext(code+'\nglobalThis.CAS=CAS;',context);
 const cas=new context.CAS({validate_url:'https://example.invalid/validate',service:'https://wekan.invalid'});
 let replies=[];cas.validate('ST-test',(...args)=>replies.push(args));
 assert.equal(replies.length,1);assert.equal(replies[0][1],false);assert.deepEqual(reported,['cas.group-denied']);
 group='cn=wekan,dc=example';replies=[];cas.validate('ST-test',(...args)=>replies.push(args));
 assert.equal(replies.length,1);assert.equal(replies[0][1],true);assert.equal(replies[0][2].id,'alice');
 assert.doesNotMatch(source,/str\.search\(/);
 assert.match(source,/isCasGroupAllowed\(Meteor\.settings\.cas\.allowedLdapGroups/);
});
