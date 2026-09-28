'use strict';
// DirectoryGroupBleed: both LDAP bind modes must enforce configured group restrictions.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const harness=require('./helpers/ldapAuthHarness.cjs');
const {requireUserCredentials}=require('../packages/wekan-ldap/server/userCredentials');

test('user credentials reject empty/malformed values without normalizing real passwords',()=>{
 for(const value of ['',undefined,null,0,false,[],{},{$ne:null}]){
  assert.throws(()=>requireUserCredentials('alice',value));
  assert.throws(()=>requireUserCredentials(value,'correct'));
 }
 requireUserCredentials('alice',' correct ');
 requireUserCredentials('alice',' ');
 const previous=global.__wekanTripCanary;
 const events=[];
 try{
  global.__wekanTripCanary=(...args)=>events.push(args);
  assert.throws(()=>requireUserCredentials('alice',''));
  assert.deepEqual(events,[['ldap.invalid-credentials']]);
  global.__wekanTripCanary=()=>{throw Error('logger unavailable');};
  assert.throws(()=>requireUserCredentials('alice',''),/credentials/);
 }finally{global.__wekanTripCanary=previous;}
});
test('DDP/REST LDAP handler refuses empty passwords before bind, lookup or fallback',async()=>{
 for(const LDAP_USER_AUTHENTICATION of [true,false])for(const LDAP_ENABLE of [true,false]){
  const h=harness({LDAP_USER_AUTHENTICATION,LDAP_ENABLE,LDAP_LOGIN_FALLBACK:true});
  for(const ldapPass of ['',null,undefined,{},[]])await assert.rejects(h.login({ldapPass}));
  assert.deepEqual(h.state.events,[]);
 }
});
test('both modes authenticate valid passwords, reject wrong passwords, and require one matching entry',async()=>{
 for(const LDAP_USER_AUTHENTICATION of [true,false]){
  const h=harness({LDAP_USER_AUTHENTICATION});
  assert.equal((await h.login()).userId,'alice-id');
  await assert.rejects(h.login({ldapPass:'wrong'}));
  for(const entries of [[],[h.state.entries[0],h.state.entries[0]]]){
   h.state.entries=entries;await assert.rejects(h.login());
  }
 }
});
test('every LDAP login mode enforces group restrictions before lookup and never falls back on group denial',async()=>{
 for(const LDAP_USER_AUTHENTICATION of [true,false]){
  const h=harness({LDAP_USER_AUTHENTICATION,LDAP_LOGIN_FALLBACK:true});h.state.group=false;
  await assert.rejects(h.login());
  assert.ok(h.state.events.includes('group'));
  assert.ok(!h.state.events.includes('lookup'));assert.ok(!h.state.events.includes('fallback'));
 }
});
test('both bind helpers reject empty/malformed passwords, including already-bound user connections',async()=>{
 const {LDAP}=harness();const ldap=new LDAP();await ldap.connect();
 for(const value of ['',null,undefined,{}]){
  await assert.rejects(ldap.bindUserIfNecessary('alice',value));
  assert.equal(await ldap.auth('uid=alice',value),false);
 }
 ldap.domainBinded=true;await assert.rejects(ldap.bindUserIfNecessary('alice',''));
 // Service searches may intentionally use anonymous credentials.
 ldap.domainBinded=false;ldap.options.Authentication=true;
 ldap.options.Authentication_UserDN='';ldap.options.Authentication_Password='';
 await ldap.bindIfNecessary();assert.equal(ldap.domainBinded,true);
});
test('group queries cannot lose the membership clause when a configured attribute is absent',async()=>{
 const {LDAP,groupMethod}=harness();const ldap=new LDAP();
 Object.assign(ldap.options,{group_filter_enabled:true,group_filter_object_class:'group',group_filter_group_id_attribute:'cn',
  group_filter_group_member_attribute:'member',group_filter_group_member_format:'missing',group_filter_group_name:'allowed'});
 ldap.getUserGroups=async()=>[];
 const filters=[];ldap.searchAll=async(base,options)=>{filters.push(options.filter);return [{cn:'allowed'}];};
 assert.equal(await groupMethod.call(ldap,'alice',{}),false);assert.equal(filters.length,0);
 assert.equal(await groupMethod.call(ldap,'alice',{dn:'uid=alice,dc=example'}),true);
 assert.ok(filters[0].includes('(member=uid=alice,dc=example)'));
});
test('all user-password bind call sites retain guards; low-level and service binds stay distinct',()=>{
 const root=path.resolve(__dirname,'../packages/wekan-ldap/server');
 const source=fs.readFileSync(path.join(root,'ldap.js'),'utf8');
 for(const name of ['bindUserIfNecessary','auth']){
  const start=source.indexOf(`  async ${name}(`);const end=source.indexOf('\n  async ',start+1);
  const body=source.slice(start,end<0?undefined:end);
  assert.ok(body.indexOf('requireUserCredentials(')<body.indexOf('await this.bind('));
 }
 const callers=[];
 for(const file of fs.readdirSync(root).filter(f=>f.endsWith('.js'))){
  const text=fs.readFileSync(path.join(root,file),'utf8');
  if(/\.bindUserIfNecessary\(/.test(text))callers.push(file);
 }
 assert.deepEqual(callers,['loginHandler.js']);
 const login=fs.readFileSync(path.join(root,'loginHandler.js'),'utf8');
 assert.ok(login.indexOf('requireUserCredentials(loginRequest.username, loginRequest.ldapPass)')<login.indexOf('const ldap = new LDAP()'));
 assert.equal((login.match(/await ldap\.isUserInGroup\(/g)||[]).length,1);
 const rest=fs.readFileSync(path.resolve(root,'../../../server/lib/restAuthenticationMethod.js'),'utf8');
 assert.match(rest,/ldapPass: password/);
});
test('LDAP identity values cannot introduce wildcard filters or extra DN components',async()=>{
 const {LDAP,state}=harness();const ldap=new LDAP();await ldap.connect();
 const identifier='a*)(uid=*)';
 assert.equal(ldap.getUserFilter(identifier),'(&(uid=a\\2a\\29\\28uid=\\2a\\29))');
 assert.equal(ldap.getUserFilter('a\\2ab'),'(&(uid=a\\5c2ab))');
 await ldap.bindUserIfNecessary('alice,ou=other','correct');
 assert.equal(state.events.find(e=>e.dn).dn,'uid=alice\\,ou\\=other,dc=example,dc=test');
 const source=fs.readFileSync(path.resolve(__dirname,'../packages/wekan-ldap/server/ldap.js'),'utf8');
 assert.doesNotMatch(source,/escapedToHex\(username\)/);
 assert.doesNotMatch(source,/replace\(\/\#\{username\}\/g, escapedUsername\)/);
});
test('service-search mode checks groups before rebinding as the user',async()=>{
 const h=harness({LDAP_USER_AUTHENTICATION:false});await h.login();
 assert.ok(h.state.events.indexOf('group')<h.state.events.findIndex(e=>e.dn==='uid=alice,dc=example,dc=test'));
});
