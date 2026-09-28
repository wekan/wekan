import { Tracker } from 'meteor/tracker';

// Providers are trusted, bundled application code. Their selectors narrow the
// normal board/card scope; registration never grants read or write permission.
export class FilterProviderRegistry {
  constructor() { this._entries = new Map(); this._dep = new Tracker.Dependency(); }
  register(input) {
    if (!input || !/^[a-z][a-z0-9]*(?:[.-][a-z0-9]+)+$/.test(input.id) ||
        input.id.length > 128 || !Number.isSafeInteger(input.version) || input.version < 1 || !['board', 'global'].includes(input.scope) ||
        typeof input.template !== 'string' || !input.template ||
        (input.section !== undefined && !['dates', 'additional'].includes(input.section)) ||
        (input.legacyPreset && input.id !== 'wekan.date-recency') ||
        ['isActive', 'selector', 'reset', 'capture', 'validate', 'restore', 'data'].some(key => typeof input[key] !== 'function')) {
      throw new Error('Invalid filter provider');
    }
    if (this._entries.has(input.id)) throw new Error(`Duplicate filter provider: ${input.id}`);
    const entry = Object.freeze({ ...input });
    this._entries.set(entry.id, entry); this._dep.changed();
    let registered = true;
    return () => {
      if (!registered) return;
      entry.reset(); this._entries.delete(entry.id); registered = false; this._dep.changed();
    };
  }
  entries() { this._dep.depend(); return [...this._entries.values()]; }
  views(section = 'additional') {
    return this.entries().filter(entry => (entry.section || 'additional') === section)
      .map(entry => ({ id: entry.id, template: entry.template, data: entry.data() }));
  }
  isActive() { return this.entries().some(entry => entry.isActive()); }
  selectors() {
    return this.entries().filter(entry => entry.isActive()).map(entry => {
      const selector = entry.selector();
      if (!selector || typeof selector !== 'object' || Array.isArray(selector)) throw new Error(`Invalid selector from ${entry.id}`);
      return selector;
    });
  }
  reset(boardOnly = false) { for (const entry of this.entries()) if (!boardOnly || entry.scope === 'board') entry.reset(); }
  snapshot() {
    const result = {};
    for (const entry of this.entries()) {
      // Existing v1 preset fields remain authoritative for legacy providers.
      if (entry.legacyPreset) continue;
      const value = entry.capture();
      if (entry.validate(value) !== true) throw new Error(`Invalid state from ${entry.id}`);
      result[entry.id] = { version: entry.version, value };
    }
    return result;
  }
  prepareRestore(snapshot = {}) {
    const actions = Object.entries(snapshot).map(([id, saved]) => {
      const entry = this._entries.get(id);
      if (!entry || entry.legacyPreset || saved.version !== entry.version || entry.validate(saved.value) !== true) {
        throw new Error(`Unavailable or invalid filter provider: ${id}`);
      }
      return () => entry.restore(saved.value);
    });
    // Validation is complete before the caller resets any live filters.
    return () => { for (const restore of actions) restore(); };
  }
}
