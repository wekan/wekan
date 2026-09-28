'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture() {
 const errors=[];
 const source=fs.readFileSync(require.resolve('../server/notifications/notifications.js'),'utf8')
  .replace(/^import .*;\n/gm,'').replace('export const Notifications =','globalThis.Notifications =');
 const ctx={console:{error:(...args)=>errors.push(args)},ReactiveCache:{}};
 vm.runInNewContext(source,ctx);return {notify:ctx.Notifications,errors};
}
const user={_id:'user'},params={activityId:'event'};
test('awaited dispatch waits for all subscribers after synchronous and asynchronous failures',async()=>{
 const {notify}=fixture();let release,finished=false;
 const gate=new Promise(resolve=>{release=resolve;});
 notify.subscribe('throw',()=>{throw new Error('sync failure');});
 notify.subscribe('reject',async()=>{throw new Error('async failure');});
 notify.subscribe('pending',async()=>{await gate;finished=true;});
 let settled=false;
 const outcome=notify.notifyAndWait(user,'title','description',params).catch(error=>{settled=true;return error;});
 await new Promise(resolve=>setImmediate(resolve));assert.equal(settled,false);
 release();const error=await outcome;
 assert.equal(finished,true);assert.equal(error.message,'notification-delivery-incomplete');
 assert.deepEqual(Array.from(error.services),['throw','reject']);assert.equal(error.errors.length,2);
});
test('awaited dispatch captures subscribers and requires a stable recipient/event identity',async()=>{
 const {notify}=fixture();await assert.rejects(notify.notifyAndWait(user,'','',params),/services-unavailable/);
 let called=0;
 notify.subscribe('email',async(u,t,d,p)=>{assert.equal(u,user);assert.equal(p,params);called++;});
 for(const [u,p] of [[null,params],[{},params],[user,{}]])await assert.rejects(notify.notifyAndWait(u,'','',p),/identity-required/);
 const pending=notify.notifyAndWait(user,'','',params);notify.unsubscribe('email');
 assert.deepEqual(Array.from(await pending),['email']);assert.equal(called,1);
});
test('ordinary dispatch remains nonblocking and isolates service failures',async()=>{
 const {notify,errors}=fixture();let called=0;
 notify.subscribe('throw',()=>{throw new Error('sync');});
 notify.subscribe('reject',async()=>{throw new Error('async');});
 notify.subscribe('ok',()=>{called++;});
 assert.equal(notify.notify(user,'','',params),undefined);
 await new Promise(resolve=>setImmediate(resolve));assert.equal(called,1);assert.equal(errors.length,2);
});
function subscriber(name,extra) {
 let callback;
 const source=fs.readFileSync(require.resolve(`../server/notifications/${name}.js`),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
 vm.runInNewContext(source,{structuredClone,Meteor:{startup:fn=>fn()},Notifications:{subscribe:(n,fn)=>{callback=fn;}},
  ReactiveCache:{getCurrentSetting:async()=>({})},resolveNotificationSetting:()=>true,
  TAPi18n:{ensureLanguageLoaded:async()=>{},__:key=>key},formatActivityNotificationTitle:()=> 'Subject',
  require:id=>require(`..${id}`),console,...extra});
 return callback;
}
test('production email and profile subscribers propagate persistence failures and allow disabled preferences',async()=>{
 const failure=new Error('database unavailable');
 const email=subscriber('email',{emailOutbox:{hasPending:async()=>false,enqueue:async()=>{throw failure;}}});
 const recipient={_id:'user',getLanguage:()=> 'en',addNotification:()=>({$set:{}})};
 await assert.rejects(email(recipient,'','',params),error=>error===failure);
 const profile=subscriber('profile',{trayDelivery:{deliver:async()=>{throw failure;}}});
 await assert.rejects(profile(recipient,'','',params),error=>error===failure);
 let writes=0;const working=subscriber('profile',{trayDelivery:{deliver:async(userId,id)=>{
  assert.equal(userId,'user');assert.equal(id,'event');writes++;return 'receipt';
 }}});
 await working(recipient,'','',params);assert.equal(writes,1);
 for(const name of ['email','profile']) {
  const disabled=subscriber(name,{resolveNotificationSetting:()=>false});
  await disabled(recipient,'','',params);
  await assert.rejects(subscriber(name,{})(null,'','',params),/invalid-.*-notification-user/);
 }
});
