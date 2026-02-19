import Tracker from './meteor/tracker';

export default class ReactiveCache {
  constructor(compare, shouldStop) {
    this.shouldStop = shouldStop || (() => true);
    this.compare = compare || ((a, b) => a === b);
    this.values = {};
    this.deps = {};
  }

  ensureDependency(key) {
    if (!this.deps[key]) this.deps[key] = new Tracker.Dependency();
    return this.deps[key];
  }

  checkDeletion(key) {
    const dep = this.ensureDependency(key);
    if (dep.hasDependents()) return false;
    delete this.values[key];
    delete this.deps[key];
    return true;
  }

  clear() {
    Object.keys(this.values).forEach((key) => this.del(key));
  }

  del(key) {
    const dep = this.ensureDependency(key);
    delete this.values[key];
    if (this.checkDeletion(key)) return;
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
        if (!this.shouldStop(key)) return;
        this.checkDeletion(key);
      });
    }
    return data;
  }
}
