'use strict';
// Stored Sync stages nest: a rule archive's delivery runs inside the rule
// stage, inside activity delivery, inside the Sync journal. Every layer's
// guard checks before and after by calling the guard below it twice, so ONE
// innermost check re-ran every outer guard - journal scope, intent, lease,
// access - 2^depth times. One rule-archived card took 36 s (measured
// 2026-09-30).
//
// reuseWithinEvaluation(check) runs each guard at most once per EVALUATION: a
// call made while another guard's check is running (in the same async
// context) shares the result of any guard already checked in it. A call made
// from ordinary work - between stages, after an adapter, after a write -
// starts a new evaluation and checks everything afresh. So a change made by
// or during work is always seen by the next check; only the redundant repeats
// inside one read-only check are removed. A failure fails the evaluation it
// happened in and is never carried into another one.
const { AsyncLocalStorage } = require('node:async_hooks');
const storage = new AsyncLocalStorage();

function reuseWithinEvaluation(check) {
  if (typeof check !== 'function') throw new Error('sync-guard-evaluation-invalid');
  const guard = () => {
    const outer = storage.getStore();
    const memo = outer ? outer.memo : new Map();
    const stack = outer ? outer.stack : new Set();
    // A guard reached again through its own check must not wait on itself.
    if (stack.has(guard)) return Promise.resolve().then(check);
    if (!memo.has(guard)) {
      memo.set(guard, storage.run({ memo, stack: new Set([...stack, guard]) }, () => Promise.resolve().then(check)));
    }
    return memo.get(guard);
  };
  return guard;
}
module.exports = { reuseWithinEvaluation };
