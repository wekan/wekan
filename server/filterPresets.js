import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check, Match } from 'meteor/check';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { publishComposite } from 'meteor/reywood:publish-composite';
import { createHash } from 'node:crypto';
import Boards from '/models/boards';
import { canReadBoard } from '/models/lib/boardVisibility';
import { validateFilterPresetState } from '/models/lib/filterPresetState';
const { withoutMembershipSelectors } = require('/models/lib/boardPermission');

const presets = new Mongo.Collection('savedCardFilters');
async function authorize(userId, boardId) {
  if (!userId || !canReadBoard(userId, await Boards.findOneAsync(boardId))) throw new Meteor.Error('not-authorized');
}
Meteor.methods({
  async 'filterPresets.save'(boardId, name, input) {
    check(boardId, String); check(name, String); check(input, Match.Any);
    await authorize(this.userId, boardId);
    name = name.trim();
    if (!name || name.length > 80) throw new Meteor.Error('invalid-preset-name');
    let state;
    try { state = validateFilterPresetState(input); } catch (error) { throw new Meteor.Error('invalid-filter-preset'); }
    const ownerId = this.userId;
    const _id = createHash('sha256').update(JSON.stringify([ownerId, boardId, name])).digest('hex');
    // Stable identity makes replacing the same name atomic, including concurrent saves.
    await presets.rawCollection().updateOne({ _id }, { $set: { ownerId, boardId, name, state, updatedAt: new Date() } }, { upsert: true });
    return _id;
  },
  async 'filterPresets.remove'(boardId, id) {
    check(boardId, String); check(id, String);
    await authorize(this.userId, boardId);
    const result = await presets.removeAsync({ _id: id, ownerId: this.userId, boardId });
    if (!result) throw new Meteor.Error('preset-not-found');
  },
});
publishComposite('savedCardFilters', function(boardId) {
  check(boardId, String);
  const ownerId = this.userId;
  if (!ownerId || !boardId) return;
  return {
    // #3249: signed in (checked above), so 'instance' boards count too.
    find: () => Boards.find({ _id: boardId, $or: [...withoutMembershipSelectors(true),
      { members: { $elemMatch: { userId: ownerId, isActive: true } } }] }, { fields: { _id: 1 } }),
    children: [{ find: board => presets.find({ ownerId, boardId: board._id }, { sort: { name: 1 } }) }],
  };
});
DDPRateLimiter.addRule({ type: 'method', name: name => ['filterPresets.save', 'filterPresets.remove'].includes(name),
  connectionId: () => true }, 30, 60000);

Boards.after.remove(async function(userId, board) {
  await presets.rawCollection().deleteMany({ boardId: board._id });
});
Meteor.users.after.remove(async function(userId, user) {
  await presets.rawCollection().deleteMany({ ownerId: user._id });
});
