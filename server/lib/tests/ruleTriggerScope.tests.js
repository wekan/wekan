import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { DDP } from 'meteor/ddp';
import { Random } from 'meteor/random';
import Boards from '/models/boards';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { RulesHelper } from '/server/rulesHelper';

// RepointBleed sibling (2026-10-03): a rule naming another board's trigger.
describe('Rules and the board of their trigger', function () {
  this.timeout(30000);
  it('a board\'s own rule runs even when another board\'s rule names its trigger first, and such a rule is refused', async function () {
    if (!Meteor.isAppTest) this.skip();
    const [attacker, owner, mine, victim, trigger, victimRule, foreignRule, action] = Array.from({ length: 8 }, () => Random.id());
    const insertRule = doc => {
      const context = { userId: attacker, isSimulation: false, connection: null, setUserId() {}, unblock() {} };
      return DDP._CurrentMethodInvocation.withValue(context, () => Meteor.server.method_handlers['/rules/insert'].apply(context, [doc]));
    };
    try {
      await Meteor.users.rawCollection().insertMany([{ _id: attacker, username: `a-${attacker}` }, { _id: owner, username: `o-${owner}` }]);
      await Boards.rawCollection().insertMany([
        { _id: mine, title: 'Mine', archived: false, members: [{ userId: attacker, isAdmin: true, isActive: true }] },
        { _id: victim, title: 'Victim', archived: false, members: [{ userId: owner, isAdmin: true, isActive: true }] }]);
      await Triggers.rawCollection().insertOne({ _id: trigger, boardId: victim, activityType: 'createCard', listName: '*',
        swimlaneName: '*', userId: '*', cardTitle: '*' });
      await Actions.rawCollection().insertOne({ _id: action, boardId: mine, actionType: 'setColor', selectedColor: 'red' });
      // NEGATIVE: saving a rule on the attacker's own board that names the
      // victim board's trigger is refused.
      await assert.rejects(insertRule({ _id: Random.id(), boardId: mine, triggerId: trigger, actionId: action, title: 'Steal' }),
        /Access denied|403/);
      // Stored anyway (as legacy data could be), and FIRST, before the
      // victim's own rule: the matcher still finds the victim's rule.
      await Rules.rawCollection().insertOne({ _id: foreignRule, boardId: mine, triggerId: trigger, actionId: action, title: 'Foreign' });
      await Rules.rawCollection().insertOne({ _id: victimRule, boardId: victim, triggerId: trigger, actionId: action, title: 'Own' });
      const matched = await RulesHelper.findMatchingRules({ activityType: 'createCard', boardId: victim, listName: 'L',
        swimlaneName: 'S', userId: owner, cardTitle: 'C', cardId: Random.id() });
      assert.deepEqual(matched.map(rule => rule._id), [victimRule]);
      // And the attacker's board's activities never run the victim's rule.
      const theirs = await RulesHelper.findMatchingRules({ activityType: 'createCard', boardId: mine, listName: 'L',
        swimlaneName: 'S', userId: attacker, cardTitle: 'C', cardId: Random.id() });
      assert.equal(theirs.some(rule => rule._id === victimRule), false);
    } finally {
      await Rules.rawCollection().deleteMany({ _id: { $in: [victimRule, foreignRule] } });
      await Rules.rawCollection().deleteMany({ boardId: mine });
      await Triggers.rawCollection().deleteMany({ _id: trigger });
      await Actions.rawCollection().deleteMany({ _id: action });
      await Boards.rawCollection().deleteMany({ _id: { $in: [mine, victim] } });
      await Meteor.users.rawCollection().deleteMany({ _id: { $in: [attacker, owner] } });
    }
  });
});
