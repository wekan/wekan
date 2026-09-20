'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('client/components/cards/cardDetails.js', 'utf8');
const start = source.indexOf("EscapeActions.register(\n  'detailsPane',");
assert.ok(start > 0);
const registration = source.slice(start, source.indexOf('\n);', start) + 3);

(async () => {
  for (const user of [null, undefined, {}, { profile: null }, { profile: {} },
    { profile: { rescueCardDescription: false } }, { profile: { rescueCardDescription: true } }]) {
    for (const draft of ['saved', 'changed']) {
      for (const accept of [false, true]) {
        let close, reads = 0, prompts = 0, closed = 0;
        const saved = [];
        const card = { _id: 'card', getDescription: () => 'saved',
          setDescription: async value => { saved.push(value); } };
        vm.runInNewContext(registration, {
          EscapeActions: { register: (_name, callback) => { close = callback; } },
          ReactiveCache: { getCurrentUser: () => { reads++; return user; } },
          getCurrentCardFromContext: () => card,
          getCardDetailsElement: () => ({ querySelector: () => ({ value: draft }) }),
          confirm: () => { prompts++; return accept; },
          TAPi18n: { __: key => key }, console: { log() {} },
          isTextSelectionInsideCard: () => false,
          Session: { get: () => false },
          $: () => ({ first: () => ({ trigger: () => { closed++; } }) }),
        });
        await close();
        const shouldPrompt = user?.profile?.rescueCardDescription === true && draft !== 'saved';
        assert.equal(reads, 1, 'one user snapshot per close');
        assert.equal(prompts, Number(shouldPrompt), 'only opted-in changed drafts prompt');
        assert.deepEqual(saved, shouldPrompt && accept ? ['changed'] : []);
        assert.equal(closed, 1, 'missing profiles and declined recovery still close normally');
      }
    }
  }
  console.log('cardDescriptionRescue: partial users, opt-in, unchanged drafts, save and discard passed');
})().catch(error => { console.error(error); process.exitCode = 1; });
