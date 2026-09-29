import { DDP } from 'meteor/ddp';
import { fieldReadContext } from '/server/lib/adminFieldReadContext';
const { scopeFieldSelector, containsFieldQuery } = require('/models/lib/adminOnlyCustomFields');
import Cards from '/models/cards';
import CustomFields from '/models/customFields';
import { currentReportRequest } from '/server/lib/requestReportContext';
import { assertFieldWrite, modifiedCard, fieldPolicy, fieldWriteDenied } from '/server/lib/adminOnlyCustomFields';

function actor() {
  return DDP._CurrentMethodInvocation.get()?.userId || currentReportRequest()?.userId;
}
function touches(modifier, names) {
  if (!modifier || Array.isArray(modifier) || Object.keys(modifier).some(k => !k.startsWith('$'))) return true;
  return Object.entries(modifier).some(([op, fields]) => Object.entries(fields || {}).some(([key, value]) =>
    names.some(name => key === name || key.startsWith(`${name}.`) || (op === '$rename' && (value === name || String(value).startsWith(`${name}.`))))));
}
// Guard the Meteor driver boundary, below collection-hooks, so both ordinary
// and `.direct` server writes are checked with the actual request actor. Raw
// native-driver writes remain reserved for trusted maintenance/Sync adapters.
const driver = Cards._collection;
const insert = driver.insertAsync;
driver.insertAsync = async function(doc, ...args) {
  await assertFieldWrite(actor(), null, doc, 'cards.insert');
  return insert.call(this, doc, ...args);
};
for (const operation of ['updateAsync', 'upsertAsync']) {
  const write = driver[operation];
  driver[operation] = async function(selector, modifier, ...args) {
    selector = scoped(selector);
    const userId = actor();
    if (userId && touches(modifier, ['customFields', 'boardId'])) {
      const rows = await Cards.find(selector, { fields: { boardId: 1, customFields: 1 } }).fetchAsync();
      if (!rows.length) {
        // Do not allow a client-originated upsert to escape the insertion check.
        if (operation === 'upsertAsync' || args[0]?.upsert) fieldWriteDenied(userId, 'cards.upsert');
      }
      for (const row of rows) {
        let after;
        try { after = modifiedCard(row, modifier); }
        catch (_) { fieldWriteDenied(userId, 'cards.modifier'); }
        await assertFieldWrite(userId, row, after, 'cards.update');
      }
      // Guard against concurrent array replacement between the check and write.
      if (rows.length) selector = { $and: [typeof selector === 'string' ? { _id: selector } : selector,
        { $or: rows.map(row => ({ _id: row._id, boardId: row.boardId,
          customFields: Object.hasOwn(row, 'customFields') ? row.customFields : { $exists: false } })) }] };
    }
    // The caller selector is already scoped and the requested mutation checked.
    // Hooks now need the exact server-generated snapshot predicate above. Running
    // that read through the search filter again rejects array equality, silently
    // skipping every before/after hook while the actual write still succeeds.
    return fieldReadContext.exit(() => write.call(this, selector, modifier, ...args));
  };
}
// A shared definition's protection cannot be removed by an administrator of
// just one of its boards, nor by replacing boardIds before changing adminOnly.
const fieldsDriver = CustomFields._collection;
for (const operation of ['updateAsync', 'upsertAsync', 'removeAsync']) {
  const write = fieldsDriver[operation];
  fieldsDriver[operation] = async function(selector, modifier, ...args) {
    const userId = actor();
    if (userId) {
      const policy = await fieldPolicy(userId);
      const rows = await CustomFields.find(selector).fetchAsync();
      if (!rows.length && (operation === 'upsertAsync' || args[0]?.upsert)) {
        fieldWriteDenied(userId, 'customFields.upsert');
      }
      for (const row of rows) {
        const after = operation === 'removeAsync' ? null : modifiedCard(row, modifier);
        if (row.adminOnly || after?.adminOnly) {
          const boardIds = new Set([...(row.boardIds || []), ...(after?.boardIds || [])]);
          if (!boardIds.size || [...boardIds].some(id => !policy.adminBoards.has(id))) fieldWriteDenied(userId, 'customFields.definition');
        }
      }
    }
    return write.call(this, selector, modifier, ...args);
  };
}
const insertField = fieldsDriver.insertAsync;
fieldsDriver.insertAsync = async function(doc, ...args) {
  const userId = actor();
  if (userId && doc.adminOnly) {
    const policy = await fieldPolicy(userId);
    if (!doc.boardIds?.length || doc.boardIds.some(id => !policy.adminBoards.has(id))) fieldWriteDenied(userId, 'customFields.definition');
  }
  return insertField.call(this, doc, ...args);
};

// The same query rule covers Meteor cursors and native-driver read adapters.
function scoped(selector) {
  const policy = fieldReadContext.getStore();
  if (!policy || !containsFieldQuery(selector)) return selector;
  policy.onQuery?.();
  return scopeFieldSelector(selector, policy.definitions, policy.adminBoards);
}
function scopedOptions(options) {
  if (!fieldReadContext.getStore() || !containsFieldQuery(options?.sort)) return options;
  // Arbitrary custom-field array positions are not a supported server sort key.
  return { ...options, sort: { _id: 1 } };
}
const find = driver.find;
driver.find = function(selector, options, ...args) { return find.call(this, scoped(selector), scopedOptions(options), ...args); };
const findOne = driver.findOneAsync;
driver.findOneAsync = function(selector, options, ...args) { return findOne.call(this, scoped(selector), scopedOptions(options), ...args); };
const rawCollection = driver.rawCollection;
driver.rawCollection = function(...args) {
  const collection = rawCollection.apply(this, args);
  return new Proxy(collection, { get(target, name) {
    if (['find', 'findOne', 'countDocuments'].includes(name)) return (selector, options, ...rest) => target[name](scoped(selector), scopedOptions(options), ...rest);
    const value = Reflect.get(target, name);
    return typeof value === 'function' ? value.bind(target) : value;
  } });
};
