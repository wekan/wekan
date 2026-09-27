'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const directory = path.resolve(__dirname, '../../packages/wekan-ldap/server');
const read = file => fs.readFileSync(path.join(directory, file), 'utf8');
const stripImports = source => source.replace(/^import[\s\S]*?;\n/gm, '');
module.exports = function harness(overrides = {}) {
 const settings = {LDAP_ENABLE:true, LDAP_USER_AUTHENTICATION:true, LDAP_BASEDN:'dc=example,dc=test',
  LDAP_USER_AUTHENTICATION_FIELD:'uid',LDAP_USER_SEARCH_FIELD:'uid',LDAP_USERNAME_FIELD:'',LDAP_EMAIL_FIELD:'',
  LDAP_LOGIN_FALLBACK:false, ...overrides};
 const state = {events:[], entries:[{dn:'uid=alice,dc=example,dc=test',uid:'alice'}], group:true, allowEmpty:true};
 const log = {info(){}, debug(){}, warn(){}, error(){}};
 let login;
 const context = vm.createContext({process:{env:{}}, Buffer, global,
  Log:log, normalizeLdapEncryption:()=>({mode:'off'}),resolveConfigValue:()=>({value:undefined}),
  ...require(path.join(directory,'groupFilterConfig')), ...require(path.join(directory,'userCredentials')),
  Accounts:{registerLoginHandler(name,fn){login=fn;}, _runLoginHandlers:async()=>{state.events.push('fallback');return {userId:'fallback'};}},
  Meteor:{Error:class extends Error{},users:{findOneAsync:async()=>{state.events.push('lookup');return {_id:'alice-id',username:'alice',authenticationMethod:'ldap'};}}},
  slug:v=>v, getLdapUserUniqueID:()=>null, syncUserData:async()=>{},syncUserGroupsToOrgsTeams:async()=>{},
  log_debug:log.debug,log_info:log.info,log_warn:log.warn,log_error:log.error,
  runWithLdapDisconnect:require(path.join(directory,'connectionGuard')).runWithLdapDisconnect,
 });
 vm.runInContext(stripImports(read('ldap.js')).replace('export function ','function ').replace('export default class LDAP','class LDAP')+'\nglobalThis.LDAP=LDAP;',context);
 const LDAP=context.LDAP;
 LDAP.settings_get=key=>settings[key];
 LDAP.prototype.connect=async function(){state.events.push('connect');this.client={bind:async(dn,password)=>{
  state.events.push({dn,password});if(password!=='correct'&&!(state.allowEmpty&&password===''))throw Error('invalid credentials');
 },unbind:async()=>state.events.push('disconnect')};};
 LDAP.prototype.searchAll=async()=>{state.events.push('search');return state.entries;};
 const groupMethod=LDAP.prototype.isUserInGroup;
 LDAP.prototype.isUserInGroup=async()=>{state.events.push('group');return state.group;};
 vm.runInContext(stripImports(read('loginHandler.js')),context);
 return {LDAP,state,settings,groupMethod,login:request=>login({ldap:true,ldapOptions:{},username:'alice',ldapPass:'correct',...request})};
};
