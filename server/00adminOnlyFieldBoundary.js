import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import { EJSON } from 'meteor/ejson';
import { fieldReadContext } from '/server/lib/adminFieldReadContext';
import { redactFields } from '/server/lib/adminOnlyCustomFields';
const { redact } = require('/models/lib/adminOnlyCustomFields');

// Protect EVERY publication, including composite cursors and manually diffed
// lazy windows. Per-user policy observers are shared by that user's subscriptions.
const policies = new Map();
async function acquire(userId) {
  const key = userId || '';
  let entry = policies.get(key);
  if (!entry) {
    entry = { refs: 0, definitions: new Map(), adminBoards: new Set(), listeners: new Set(), handles: [] };
    policies.set(key, entry);
    const notify = () => { for (const listener of entry.listeners) listener(); };
    entry.ready = (async () => {
      const Fields = require('/models/customFields').default;
      const Boards = require('/models/boards').default;
      entry.handles.push(await Fields.find({}, { fields: { adminOnly: 1, boardIds: 1 } }).observeChangesAsync({
        added(id, fields) { entry.definitions.set(id, { ...fields, _id: id }); notify(); },
        changed(id, fields) { entry.definitions.set(id, { ...entry.definitions.get(id), ...fields }); notify(); },
        removed(id) { entry.definitions.delete(id); notify(); },
      }));
      if (userId) entry.handles.push(await Boards.find({ members: { $elemMatch: { userId, isActive: true, isAdmin: true } } }, { fields: { _id: 1 } }).observeChangesAsync({
        added(id) { entry.adminBoards.add(id); notify(); },
        removed(id) { entry.adminBoards.delete(id); notify(); },
      }));
      return entry;
    })();
  }
  entry.refs++;
  try { await entry.ready; } catch (error) { release(key, entry); throw error; }
  return { entry, release: () => release(key, entry) };
}
function release(key, entry) {
  if (--entry.refs) return;
  policies.delete(key);
  entry.handles.forEach(handle => handle.stop());
}
const publish = Meteor.publish;
Meteor.publish = function(name, handler, ...options) {
  if (typeof handler !== 'function') return publish.call(this, name, handler, ...options);
  return publish.call(this, name, async function(...args) {
    // Meteor audits arguments synchronously before the first await. The actual
    // publisher still performs its original, stricter validation below.
    check(args, [Match.Any]);
    let stopped = false;
    this.onStop(() => { stopped = true; });
    const subscription = this, held = await acquire(this.userId);
    if (stopped) { held.release(); return; }
    const rows = new Map();
    const added = this.added.bind(this), changed = this.changed.bind(this), removed = this.removed.bind(this);
    const clean = row => redact(row, held.entry.definitions, held.entry.adminBoards);
    const update = (collection, id, raw) => {
      const key = `${collection}\0${id}`, previous = rows.get(key), safe = clean(raw);
      rows.set(key, { collection, id, raw, safe });
      if (!previous) return added(collection, id, safe);
      const diff = {};
      for (const field of new Set([...Object.keys(previous.safe), ...Object.keys(safe)])) {
        if (!EJSON.equals(previous.safe[field], safe[field])) diff[field] = safe[field];
      }
      if (Object.keys(diff).length) changed(collection, id, diff);
    };
    this.added = (collection, id, fields) => update(collection, id, fields);
    this.changed = (collection, id, fields) => {
      const previous = rows.get(`${collection}\0${id}`);
      if (previous) update(collection, id, { ...previous.raw, ...fields });
    };
    this.removed = (collection, id) => { rows.delete(`${collection}\0${id}`); removed(collection, id); };
    let queryDependent = false;
    const readContext = { definitions: held.entry.definitions, adminBoards: held.entry.adminBoards,
      onQuery: () => { queryDependent = true; } };
    const refresh = () => {
      // An existing database observer has a frozen selector. Retract a value
      // search on policy changes rather than keep an old-policy membership oracle.
      if (queryDependent) { subscription.stop(); return; }
      for (const row of rows.values()) update(row.collection, row.id, row.raw);
    };
    held.entry.listeners.add(refresh);
    this.onStop(() => { held.entry.listeners.delete(refresh); rows.clear(); held.release(); });
    return fieldReadContext.run(readContext, () => handler.apply(subscription, args));
  }, ...options);
};

// Method-returned snapshots/history must not provide an alternate raw read path.
const methods = Meteor.methods;
Meteor.methods = function(entries) {
  const wrapped = {};
  for (const [name, method] of Object.entries(entries)) wrapped[name] = async function(...args) {
    check(args, [Match.Any]);
    const held = await acquire(this.userId);
    try {
      const result = await fieldReadContext.run(held.entry, () => method.apply(this, args));
      return await redactFields(result, this.userId);
    } finally { held.release(); }
  };
  return methods.call(this, wrapped);
};
