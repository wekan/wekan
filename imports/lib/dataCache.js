import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';

class ReactiveValueCache {
  constructor(compare, shouldStop) {
    this.shouldStop = shouldStop || (() => true);
    this.compare = compare || ((a, b) => a === b);
    this.values = {};
    this.deps = {};
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
      Tracker.currentComputation.onStop(() => {
        if (!this.shouldStop(key)) {
          return;
        }
        this.checkDeletion(key);
      });
    }
    return data;
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
        this.cache.set(key, this.getData(key));
      }),
    );

    this.computations[key].onInvalidate(() => this.checkStop(key));
  }

  checkStop(key) {
    if (this.cache.ensureDependency(key).hasDependents()) {
      return;
    }
    if (this.timeouts[key]) {
      clearTimeout(this.timeouts[key]);
      delete this.timeouts[key];
    }
    this.timeouts[key] = setTimeout(() => {
      if (!this.computations[key]) {
        return;
      }
      this.computations[key].stop();
      delete this.computations[key];
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
    Tracker.currentComputation.onStop(() => this.checkStop(key));
    return data;
  }
}

export { DataCache };
export default DataCache;
