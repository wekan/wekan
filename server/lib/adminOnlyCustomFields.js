import { Meteor } from 'meteor/meteor';
import { EJSON } from 'meteor/ejson';
import { LocalCollection } from 'meteor/minimongo';
import { fieldReadContext } from '/server/lib/adminFieldReadContext';
const { redact, containsFields, protectedValues, mayReadField } = require('/models/lib/adminOnlyCustomFields');
// Lazy imports avoid a cycle while the shared collections are being registered.
const collections = () => ({
  Boards: require('/models/boards').default,
  CustomFields: require('/models/customFields').default,
});
export async function fieldPolicy(userId) {
  const { Boards, CustomFields } = collections();
  const [fields, boards] = await Promise.all([
    CustomFields.find({}, { fields: { adminOnly: 1, boardIds: 1 } }).fetchAsync(),
    userId ? Boards.find({ members: { $elemMatch: { userId, isActive: true, isAdmin: true } } }, { fields: { _id: 1 } }).fetchAsync() : [],
  ]);
  return { definitions: new Map(fields.map(f => [f._id, f])), adminBoards: new Set(boards.map(b => b._id)) };
}
export async function redactFields(value, userId, boardId) {
  if (!containsFields(value)) return value;
  const { definitions, adminBoards } = await fieldPolicy(userId);
  return redact(value, definitions, adminBoards, boardId);
}
export function fieldWriteDenied(userId, source) {
  try { require('/server/lib/securityLog').record({ key: 'authz.admin-only-field', action: 'blocked', source, userId,
    detail: 'Protected custom-field mutation refused' }); }
  catch (_) { /* logging must never break the guard */ }
  throw new Meteor.Error('not-authorized', 'Protected custom field');
}
export async function assertFieldWrite(userId, before, after, source) {
  if (!userId) return; // Trusted maintenance/background writes have no requester.
  const { definitions, adminBoards } = await fieldPolicy(userId);
  const oldValues = protectedValues(before, definitions, adminBoards);
  const newValues = protectedValues(after, definitions, adminBoards);
  if (!EJSON.equals(oldValues, newValues)) fieldWriteDenied(userId, source);
}
export function modifiedCard(doc, modifier) {
  const after = EJSON.clone(doc);
  LocalCollection._modify(after, modifier);
  return after;
}
// Until each binary/streaming exporter supports value-level projection, do not
// let another serialization format bypass the field boundary. No attack log:
// an ordinary member can legitimately reach the export menu.
export async function assertFieldExport(boardId, userId) {
  const { definitions, adminBoards } = await fieldPolicy(userId);
  const Cards = require('/models/cards').default;
  const readableIds = [...definitions.values()].filter(d => mayReadField(d, boardId, adminBoards)).map(d => d._id);
  // Authorization must inspect unreadable values, not the caller's narrowed
  // search results. Otherwise orphaned definitions would disappear from this check.
  const unknownValues = await fieldReadContext.exit(() => Cards.findOneAsync({ boardId,
    customFields: { $elemMatch: { _id: { $nin: readableIds }, value: { $ne: null } } } }, { fields: { _id: 1 } }));
  if (unknownValues || (!adminBoards.has(boardId) && [...definitions.values()].some(d => d.adminOnly && d.boardIds?.includes(boardId)))) {
    throw new Meteor.Error('not-authorized', 'This export requires board administrator access');
  }
}
