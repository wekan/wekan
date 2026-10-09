import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
const { shouldDeferCacheMiss } = require('./staleWhileRevalidate');

// #6745: register a computation's onStop callback for a key ONCE, not on every
// read. A helper's computation is re-run (not stopped) each time its data
// changes, and Tracker keeps every onStop callback until the computation is
// stopped - so a callback added per read piled up one closure per re-run.
// On a large board a card open re-runs thousands of helpers; closing the card
// then stopped those computations and ran every queued callback, each one
// arming a timer: four seconds of checkStop() for one close, and memory that
// grew with every re-run until then. The Set per computation remembers which
// keys already have their callback.
function onStopOnce(seen, computation, key, callback) {
  let keys = seen.get(computation);
  if (!keys) {
    keys = new Set();
    seen.set(computation, keys);
  }
  if (keys.has(key)) return;
  keys.add(key);
  computation.onStop(callback);
}

class ReactiveValueCache {
  constructor(compare, shouldStop) {
    this.shouldStop = shouldStop || (() => true);
    this.compare = compare || ((a, b) => a === b);
    this.values = {};
    this.deps = {};
    this.stopRegistered = new WeakMap();
  }

  ensureDependency(key) {
    if (!this.deps[key]) {
      this.deps[key] = new Tracker.Dependency();
    }
    return this.deps[key];
  }

  checkDeletion(key) {
    const dep = this.ensureDependency(key);
    if (dep.hasDependents()) {
      return false;
    }
    delete this.values[key];
    delete this.deps[key];
    return true;
  }

  del(key) {
    const dep = this.ensureDependency(key);
    delete this.values[key];
    if (this.checkDeletion(key)) {
      return;
    }
    dep.changed();
  }

  set(key, data, bypassCompare) {
    const dep = this.ensureDependency(key);
    const current = this.values[key];
    this.values[key] = data;
    if (!this.compare(current, data) || bypassCompare) {
      dep.changed();
    }
  }

  get(key) {
    const data = this.values[key];
    if (Tracker.currentComputation) {
      const dep = this.ensureDependency(key);
      dep.depend();
      onStopOnce(this.stopRegistered, Tracker.currentComputation, key, () => {
        if (!this.shouldStop(key)) {
          return;
        }
        this.checkDeletion(key);
      });
    }
    return data;
  }

  // Non-reactive read of the currently cached value (no dependency registered).
  peek(key) {
    return this.values[key];
  }
}

class DataCache {
  constructor(getData, options) {
    this.options = {
      timeout: 60 * 1000,
      ...(typeof options === 'function' ? { compare: options } : options),
    };
    this.getData = getData;
    this.cache = new ReactiveValueCache(this.options.compare, () => false);
    this.timeouts = {};
    this.computations = {};
    // Pending stale-while-revalidate re-checks, keyed like the cache.
    this.staleTimers = {};
    this.stopRegistered = new WeakMap();
  }

  ensureComputation(key) {
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
      delete this.timeouts[key];
    }
    if (this.computations[key] && !this.computations[key].stopped) {
      return;
    }
    this.computations[key] = Tracker.nonreactive(() =>
      Tracker.autorun(() => {
        this.applyData(key, this.getData(key));
      }),
    );

    this.computations[key].onInvalidate(() => this.checkStop(key));
  }

  // Write a freshly-fetched value into the cache, honouring stale-while-revalidate.
  // A transient miss (null/undefined while a value is still cached) is not written
  // immediately: keep the last value and re-check after options.staleMs, so a board
  // that momentarily vanishes from minimongo during a subscription re-settle does
  // not flash the "Board not found" shell. A miss that is still a miss after the
  // delay (genuine deletion / access loss) is then surfaced.
  applyData(key, data) {
    if (shouldDeferCacheMiss(this.options, data, this.cache.peek(key))) {
      if (this.staleTimers[key]) {
        return; // a re-check is already pending
      }
      this.staleTimers[key] = setTimeout(() => {
        delete this.staleTimers[key];
        const fresh = Tracker.nonreactive(() => this.getData(key));
        this.cache.set(key, fresh);
      }, this.options.staleMs || 1500);
      return;
    }
    // Real value (or no cached value to preserve): resolve now, cancel any pending
    // re-check — the live autorun already delivered a fresher value.
    if (this.staleTimers[key]) {
      clearTimeout(this.staleTimers[key]);
      delete this.staleTimers[key];
    }
    this.cache.set(key, data);
  }

  // Called when a computation that read `key` stops. Arms ONE pending
  // teardown check per key; the check itself (below) asks whether anything
  // still depends on the value.
  //
  // #6745: this used to ask hasDependents() first, on every call. Tracker
  // answers that with a for-in over every dependent, and a value like the
  // current board has one dependent per minicard helper - thousands on a large
  // board. Closing a card stops a few hundred computations, each calling this
  // for each key it read: 700 calls at ~3 ms each, over two seconds of a
  // frozen page for one close. A pending check is not re-armed either: the
  // teardown re-checks hasDependents() when it fires, and ensureComputation()
  // cancels it as soon as the key is read again.
  checkStop(key) {
    if (this.timeouts[key]) {
      return;
    }
    this.timeouts[key] = setTimeout(() => {
      delete this.timeouts[key];
      if (!this.computations[key]) {
        return;
      }
      // A dependent may have re-attached during the timeout window (e.g. the
      // board view re-rendered). Re-check before tearing down, otherwise we
      // stop the live computation and delete a value something is still using,
      // which surfaces as a transient `undefined` (the board-not-found flicker).
      if (this.cache.ensureDependency(key).hasDependents()) {
        return;
      }
      this.computations[key].stop();
      delete this.computations[key];
      if (this.staleTimers[key]) {
        clearTimeout(this.staleTimers[key]);
        delete this.staleTimers[key];
      }
      this.cache.del(key);
    }, this.options.timeout);
  }

  get(key) {
    if (!Tracker.currentComputation) {
      let data = this.cache.get(key);
      if (data == null) {
        data = this.getData(key);
        this.cache.set(key, data);
        this.checkStop(key);
      }
      return data;
    }

    this.ensureComputation(key);
    const data = this.cache.get(key);
    onStopOnce(this.stopRegistered, Tracker.currentComputation, key, () => this.checkStop(key));
    return data;
  }
}

export { DataCache };
export default DataCache;
