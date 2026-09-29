'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require.resolve('../server/rulesHelper.js'), 'utf8');
const object = source.slice(source.indexOf('export const RulesHelper = ') + 'export const RulesHelper = '.length).trim().replace(/;$/, '');
const action = { actionType: 'sendEmail', emailTo: 'person@example.org', emailSubject: 'Subject', emailMsg: 'Body' };
const activity = { boardId: 'board', cardId: 'card', userId: 'actor' };
function fixture(fallback = false) {
  let resolve, reject, entered;
  const started = new Promise(done => { entered = done; });
  const pending = new Promise((done, fail) => { resolve = done; reject = fail; });
  const mails = [], errors = [];
  const cache = { getCard: async () => ({ _id: 'card' }), getUser: async () => ({ _id: 'recipient', getLanguage: () => 'fi' }) };
  const send = async mail => { mails.push(mail); entered(); await pending; };
  const helper = vm.runInNewContext(`(${object})`, {
    ReactiveCache: cache, console: { error: error => errors.push(error) },
    buildRuleVars: async () => ({ cardname: 'Card', description: 'Description', cardlink: 'https://example.org/card' }),
    // recipientVars turns people tokens into addresses; identity is enough here.
    substituteVars: value => value, recipientVars: vars => vars, TAPi18n: { getLanguage: () => 'en' },
    // Rules with several triggers/actions (models/lib/ruleParts.js).
    ...require('../models/lib/ruleParts.js'),
    Accounts: { emailTemplates: { from: 'sender@example.org' } },
    EmailLocalization: fallback ? undefined : { sendEmail: send }, Email: { sendAsync: send },
  });
  helper.findMatchingRules = async () => [{ getAction: async () => action }, { getAction: async () => action }];
  return { helper, cache, resolve, reject, started, mails, errors };
}
for (const fallback of [false, true]) {
  const mode = fallback ? 'standard' : 'localized';
  test(`${mode} email waits for completion and preserves card context`, async () => {
    const f = fixture(fallback);
    let finished = false;
    const run = f.helper.executeRules(activity).then(() => { finished = true; });
    await f.started;
    await new Promise(resolve => setImmediate(resolve));
    assert.equal(finished, false);
    assert.equal(f.mails.length, 1);
    assert.equal(f.mails[0].to, action.emailTo);
    assert.equal(f.mails[0].subject, action.emailSubject);
    assert.match(f.mails[0].text, /Body[\s\S]*Card: Card[\s\S]*Description: Description[\s\S]*Link: https:\/\/example.org\/card/);
    if (!fallback) assert.equal(f.mails[0].language, 'fi');
    f.resolve(); await run;
    assert.equal(f.mails.length, 2);
  });
  test(`${mode} email rejection stops subsequent matched actions`, async () => {
    const f = fixture(fallback), failure = new Error('delivery refused');
    const run = f.helper.executeRules(activity);
    const rejected = assert.rejects(run, error => error === failure);
    await f.started; f.reject(failure); await rejected;
    assert.equal(f.mails.length, 1);
    assert.deepEqual(f.errors, [failure]);
  });
}
test('recipient lookup failure propagates without sending mail', async () => {
  const f = fixture(), failure = new Error('lookup unavailable');
  f.cache.getUser = async () => { throw failure; };
  await assert.rejects(f.helper.executeRules(activity), error => error === failure);
  assert.equal(f.mails.length, 0);
});
test('scheduled email failure retains an unfinished slot while other triggers run', async () => {
  const f = fixture(), failure = new Error('SMTP unavailable'), writes = [];
  f.cache.getRule = async () => ({ actionId: 'action' });
  f.cache.getAction = async () => action;
  f.cache.getBoard = async () => ({ createdBy: 'actor' });
  f.cache.getCards = async () => [{ _id: 'card' }];
  const triggers = ['failed', 'healthy'].map(_id => ({ _id, boardId: 'board', scheduleKind: 'calendar', scheduleType: 'daily' }));
  // scheduledRules.js's imports are stripped below; provide the pure helpers it uses.
  const context = { ...require('../models/lib/ruleParts.js'), ...require('../models/lib/scheduledDueFilter.js'),
    Meteor: { startup() {} }, ReactiveCache: f.cache, RulesHelper: f.helper,
    console: { error() {} }, Triggers: { find: () => ({ fetchAsync: async () => triggers }),
      updateAsync: async (id, update) => writes.push({ id, update }) } };
  const scheduled = fs.readFileSync(require.resolve('../server/scheduledRules.js'), 'utf8').replace(/^import .*;\n/gm, '').replace(/^export /gm, '');
  vm.createContext(context); vm.runInContext(scheduled, context);
  // Fail only the first dispatch; the scanner must continue to the next rule.
  const perform = f.helper.performAction.bind(f.helper);
  let calls = 0;
  f.helper.performAction = async (...args) => {
    if (++calls === 1) return perform(...args);
    return undefined;
  };
  const run = context.scanScheduledRules(new Date(2026, 8, 28, 12, 0));
  await f.started; f.reject(failure); await run;
  assert.equal(calls, 2);
  assert.deepEqual(writes.map(row => row.id), ['healthy']);
  assert.equal(writes[0].update.$set.lastRunKey, '2026-09-28 12:00');
});
