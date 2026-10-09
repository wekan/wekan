import { Tracker } from 'meteor/tracker';
import { EJSON } from 'meteor/ejson';

// #6745: a reactive "documents grouped by key" index whose readers depend on
// THEIR OWN group only.
//
// The client indexes (comments by card, checklists by card, checklist items by
// checklist, subtasks by parent - imports/reactiveCache.js) used to be one
// cached object per collection. Every minicard read its card's group out of
// that one object, so every minicard depended on the whole object: one new
// comment, one ticked checklist item, or the opened card's comments arriving
// re-ran the comment / checklist helpers of EVERY minicard on the board. On a
// lazy board of 480 rendered minicards that was ~1,500 invalidations for one
// card open and again for its close.
//
// Here the index is still built by one computation, but each key has its own
// Tracker.Dependency, and after a rebuild only the keys whose group actually
// differs are told. A reader of card A is not re-run by a change on card B.
//
// `compute()` returns `{ key: [doc, ...] }` (or a Map). It runs inside a
// computation, so it is reactive to whatever it reads.
class KeyedGroupIndex {
  constructor(compute) {
    this.compute = compute;
    this.groups = new Map();
    this.deps = new Map();
    this.computation = null;
    // Which keys each reading computation already has an onStop for: a
    // computation re-runs many times and must not queue one per run.
    this.stopRegistered = new WeakMap();
  }

  dependency(key) {
    let dep = this.deps.get(key);
    if (!dep) {
      dep = new Tracker.Dependency();
      this.deps.set(key, dep);
    }
    return dep;
  }

  ensure() {
    if (this.computation && !this.computation.stopped) return;
    this.computation = Tracker.nonreactive(() => Tracker.autorun(computation => {
      const result = this.compute();
      const next = result instanceof Map ? result : new Map(Object.entries(result || {}));
      const previous = this.groups;
      this.groups = next;
      if (computation.firstRun) return;
      for (const [key, dep] of this.deps) {
        if (!sameGroup(previous.get(key), next.get(key))) dep.changed();
      }
    }));
  }

  get(key) {
    this.ensure();
    if (Tracker.active) {
      const dep = this.dependency(key);
      dep.depend();
      const computation = Tracker.currentComputation;
      let keys = this.stopRegistered.get(computation);
      if (!keys) {
        keys = new Set();
        this.stopRegistered.set(computation, keys);
      }
      if (!keys.has(key)) {
        keys.add(key);
        // Forget a key's dependency once nobody reads it any more, so the map
        // does not keep one entry per card ever rendered.
        computation.onStop(() => {
          const current = this.deps.get(key);
          if (current && !current.hasDependents()) this.deps.delete(key);
        });
      }
    }
    return this.groups.get(key) || [];
  }
}

function sameGroup(a, b) {
  const left = a || [];
  const right = b || [];
  if (left === right) return true;
  if (left.length !== right.length) return false;
  for (let i = 0; i < left.length; i += 1) {
    if (left[i] !== right[i] && !EJSON.equals(left[i], right[i])) return false;
  }
  return true;
}

export { KeyedGroupIndex, sameGroup };
export default KeyedGroupIndex;
