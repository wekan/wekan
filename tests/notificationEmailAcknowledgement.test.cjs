'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

// Execute the production subscriber; storage/delivery is exercised against
// MongoDB in integration/emailOutbox.test.cjs and SMTP in Playwright.
test('production subscriber persists rendered metadata with stable activity identity', async () => {
  let notify; const jobs = [];
  const source = fs.readFileSync(require.resolve('../server/notifications/email.js'), 'utf8').replace(/^import .*;\n/gm, '').replace(/export /g, '');
  vm.runInNewContext(source, { structuredClone,
    Meteor: { startup: fn => fn() }, Notifications: { subscribe: (name, fn) => { notify = fn; } },
    ReactiveCache: { getCurrentSetting: async () => ({ notifyDefaultEmail: true }), getBoard: async () => ({}) },
    TAPi18n: { ensureLanguageLoaded: async () => {}, __: key => key },
    emailOutbox: { hasPending: async () => false, enqueue: async job => jobs.push(job) },
    formatActivityNotificationTitle: title => title, resolveNotificationSetting: () => true,
    require: id => require(`..${id}`), console,
  });
  await notify({ _id: 'watcher', getLanguage: () => 'fi' }, 'Title', 'Description',
    { activityId: 'activity', cardId: 'card', user: 'Author', url: 'https://example.test/card' });
  assert.equal(jobs.length, 1);
  assert.equal(jobs[0].userId, 'watcher'); assert.equal(jobs[0].eventId, 'activity');
  assert.equal(jobs[0].language, 'fi'); assert.equal(jobs[0].cardId, 'card');
  assert.equal(jobs[0].subject, 'Title'); assert.match(jobs[0].html, /Description/);
});
test('outbox collections are server-only and the scan reschedules even after failure', () => {
  const queue = fs.readFileSync(require.resolve('../server/notifications/emailQueue.js'), 'utf8');
  assert.match(queue, /new Mongo.Collection\('notificationEmailJobs'\)/);
  assert.doesNotMatch(queue, /Meteor\.(publish|methods)\(/);
  assert.match(queue, /finally\s*\{\s*Meteor.setTimeout\(scan, 1000\)/);
  assert.match(queue, /await emailOutbox.drain\(\)/);
  assert.match(queue, /await scan\(\)/);
});

test('preparation performs no enqueue and captures language, parameters and one template snapshot', async () => {
  let resume,entered,settingsReads=0,language='fi';const jobs=[],loaded=[];
  const waiting=new Promise(resolve=>{entered=resolve;}),gate=new Promise(resolve=>{resume=resolve;});
  const setting={notifyDefaultEmail:true,activityEmailSubjectTemplate:'{card}',activityEmailBodyTemplate:'{username}: {card}'};
  const source=fs.readFileSync(require.resolve('../server/notifications/email.js'),'utf8').replace(/^import .*;\n/gm,'').replace(/export /g,'');
  const context={structuredClone,Meteor:{startup(){}},Notifications:{},
    ReactiveCache:{getCurrentSetting:async()=>{settingsReads++;return setting;},getBoard:async()=>({})},
    TAPi18n:{ensureLanguageLoaded:async language=>{loaded.push(language);entered();await gate;},__:key=>key},
    emailOutbox:{hasPending:async()=>false,enqueue:async job=>jobs.push(job)},
    formatActivityNotificationTitle:()=> 'Title',resolveNotificationSetting:()=>true,
    require:id=>require(`..${id}`),console};
  vm.runInNewContext(source,context);
  const params={activityId:'event',card:'Original',user:'Author',url:'https://example.test/card'},
    user={_id:'user',getLanguage:()=>language,profile:{notifyOverrideEmail:true}};
  const preparing=context.prepareActivityEmail(user,'Title','Description',params);
  await waiting;params.card='Later';params.user='Other';language='en';user._id='other';
  setting.activityEmailSubjectTemplate='Changed';setting.activityEmailBodyTemplate='Changed';
  resume();const job=await preparing;
  assert.equal(jobs.length,0);assert.equal(settingsReads,1);assert.deepEqual(loaded,['fi']);
  assert.equal(job.userId,'user');assert.equal(job.eventId,'event');assert.equal(job.language,'fi');
  assert.equal(job.subject,'Original');assert.equal(job.html,'Author: Original');
  assert.deepEqual(Object.keys(job).sort(),['boardId','cardId','eventId','html','language','subject','userId']);
});
