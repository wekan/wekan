import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';
import { Email } from 'meteor/email';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Swimlanes from '/models/swimlanes';
import Cards from '/models/cards';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import UserPositionHistory from '/models/userPositionHistory';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import EmailLocalization from '/server/lib/emailLocalization';
import { runStoredSyncRules, SyncRuleMoveBoardCommands, SyncRuleEmailCommands, SyncRuleEmailAttempts,
  SyncRuleEmailOutcomes, SyncRulePlans, SyncRuleReceipts, SyncRuleCompletions } from '/server/notifications/storedRulePlans';
import { durableSyncDecision } from '/server/lib/listSyncApplication';
import { RulesHelper } from '/server/rulesHelper';

// An email after the rule's own move to another board (maintainer decision of
// 2026-10-03): it reads the card where the move put it, in the ordinary
// engine and in durable Sync, only when that board opted into Sync effects;
// a card that left the board any other way is refused as before.
describe('Rule email after the rule\'s own move to another board', function () {
  this.timeout(60000);
  it('sends the card from the board it went to, once, and refuses every other placement', async function () {
    if (!Meteor.isAppTest) this.skip();
    const actor = Random.id(), from = Random.id(), to = Random.id(), third = Random.id();
    const ids = { list: Random.id(), lane: Random.id(), inbox: Random.id(), toLane: Random.id(), card: Random.id(),
      twin: Random.id(), stray: Random.id(), activity: Random.id(), twinActivity: Random.id() };
    const activityFor = (_id, cardId, title) => ({ _id, activityType: 'createCard', boardId: from, listId: ids.list, cardId,
      userId: actor, cardTitle: title, listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) });
    const activity = activityFor(ids.activity, ids.card, 'Pump');
    const input = { activity, effectId: '9'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual',
      assertCurrent: async () => {} };
    const admin = userId => ({ userId, isAdmin: true, isActive: true });
    const originalFrom = Accounts.emailTemplates.from, originalSend = Email.sendAsync, originalLocalized = EmailLocalization.sendEmail;
    const durable = [], ordinary = [];
    Accounts.emailTemplates.from = 'wekan@example.org';
    Email.sendAsync = async mail => { durable.push(mail); return { accepted: ['a@example.com'] }; };
    EmailLocalization.sendEmail = async options => { ordinary.push(options); };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: `follow-${actor}` });
      await Boards.rawCollection().insertMany([
        { _id: from, title: 'From', syncEffectsEnabled: true, members: [admin(actor)] },
        { _id: to, title: 'To', syncEffectsEnabled: true, members: [admin(actor)] },
        { _id: third, title: 'Third', syncEffectsEnabled: true, members: [admin(actor)] }]);
      await Swimlanes.rawCollection().insertMany([{ _id: ids.lane, boardId: from, title: 'Lane', sort: 0, archived: false },
        { _id: ids.toLane, boardId: to, title: 'Lane', sort: 0, archived: false }]);
      await Lists.rawCollection().insertMany([{ _id: ids.list, boardId: from, title: 'List', archived: false },
        { _id: ids.inbox, boardId: to, title: 'Inbox', archived: false }]);
      const card = (_id, title) => ({ _id, boardId: from, listId: ids.list, swimlaneId: ids.lane, title, sort: 0,
        archived: false, labelIds: [], members: [], customFields: [], description: `${title} description` });
      await Cards.rawCollection().insertMany([card(ids.card, 'Pump'), card(ids.twin, 'Twin')]);
      await Activities.rawCollection().insertMany([activity, activityFor(ids.twinActivity, ids.twin, 'Twin')]);
      const moveId = Random.id(), emailId = Random.id(), triggerId = Random.id(), ruleId = Random.id();
      // Card details make the email read its source (server/lib/ruleEmailSource.js).
      await Actions.rawCollection().insertMany([
        { _id: moveId, boardId: to, actionType: 'moveCardToBottom', listName: 'Inbox', swimlaneName: 'Lane' },
        { _id: emailId, boardId: from, actionType: 'sendEmail', emailTo: 'a@example.com', emailSubject: 'Moved',
          emailMsg: 'Card {card}', includeCardDetails: true }]);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId: from, activityType: 'createCard', listName: 'List',
        userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: ruleId, boardId: from, triggerId, actionId: moveId,
        extraActionIds: [emailId], enabled: true, title: 'Move and tell' });
      const list = { _id: ids.list, boardId: from, syncRevision: 'rev', syncCredentialIncarnation: 'life' };
      assert.deepEqual(await durableSyncDecision({ list, board: await Boards.findOneAsync(from), trigger: 'manual', actorId: actor }),
        { eligible: true, reason: null }, 'a move then an email is durable');

      // Durable Sync: moved, mailed from the board it went to, once.
      assert.equal(await runStoredSyncRules(input), input.effectId);
      assert.equal((await Cards.rawCollection().findOne({ _id: ids.card })).boardId, to);
      assert.equal(durable.length, 1);
      assert.match(durable[0].text, /Card Pump/);
      assert.match(durable[0].text, /Pump description/);
      const command = await SyncRuleEmailCommands.rawCollection().findOne({ cardId: ids.card });
      assert.deepEqual([command.sourceBinding.version, command.sourceBinding.followedFrom, command.sourceBinding.cards[0][1]],
        [6, from, to]);
      assert.equal(await runStoredSyncRules(input), input.effectId, 'replay');
      assert.equal(durable.length, 1, 'never twice');

      // The ordinary engine, for the twin: the same.
      await RulesHelper.executeRules(activityFor(ids.twinActivity, ids.twin, 'Twin'));
      assert.equal((await Cards.rawCollection().findOne({ _id: ids.twin })).boardId, to);
      assert.equal(ordinary.length, 1);
      assert.match(ordinary[0].text, /Card Twin/);

      // NEGATIVE: a card on another board that this run did not move there.
      const email = await Actions.findOneAsync(emailId);
      await Cards.rawCollection().insertOne({ ...card(ids.stray, 'Stray'), boardId: to, listId: ids.inbox, swimlaneId: ids.toLane });
      const stray = { activityType: 'createCard', boardId: from, cardId: ids.stray, userId: actor };
      await assert.rejects(RulesHelper.performAction(stray, email, {}), /rule-email-source-not-authorized/, 'nobody\'s move');
      await assert.rejects(RulesHelper.performAction(stray, email, undefined), /rule-email-source-not-authorized/, 'no run');
      await assert.rejects(RulesHelper.performAction(stray, email, { movedTo: third }), /rule-email-source-not-authorized/,
        'the run moved it to another board');
      // ...and a move of this run to a board that did not opt into Sync effects.
      await Boards.rawCollection().updateOne({ _id: to }, { $set: { syncEffectsEnabled: false } });
      await assert.rejects(RulesHelper.performAction(stray, email, { movedTo: to }), /rule-email-source-not-authorized/,
        'destination opted out');
      assert.equal(ordinary.length, 1, 'nothing more was sent');
      await Boards.rawCollection().updateOne({ _id: to }, { $set: { syncEffectsEnabled: true } });
      await RulesHelper.performAction(stray, email, { movedTo: to });
      assert.equal(ordinary.length, 2, 'the same card, proven moved by this run, is sent');
    } finally {
      Accounts.emailTemplates.from = originalFrom;
      Email.sendAsync = originalSend;
      EmailLocalization.sendEmail = originalLocalized;
      const commands = await SyncRuleEmailCommands.rawCollection().find({ cardId: { $in: [ids.card, ids.twin] } },
        { projection: { _id: 1 } }).toArray();
      await SyncRuleEmailAttempts.rawCollection().deleteMany({ _id: { $in: commands.map(row => row._id) } });
      await SyncRuleEmailOutcomes.rawCollection().deleteMany({ _id: { $in: commands.map(row => row._id) } });
      await SyncRuleEmailCommands.rawCollection().deleteMany({ cardId: { $in: [ids.card, ids.twin] } });
      for (const board of [from, to, third]) {
        const plans = await SyncRulePlans.rawCollection().find({ 'plan.boardId': board }, { projection: { _id: 1 } }).toArray();
        await SyncRuleCompletions.rawCollection().deleteMany({ _id: { $in: plans.map(row => row._id) } });
        await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': board });
        for (const model of [SyncRuleMoveBoardCommands, Rules, Triggers, Actions, ChangeHistory, UserPositionHistory,
          Activities, Cards, Lists, Swimlanes]) {
          await model.rawCollection().deleteMany({ boardId: board });
        }
      }
      await Activities.rawCollection().deleteMany({ cardId: { $in: [ids.card, ids.twin, ids.stray] } });
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: input.effectId });
      await Boards.rawCollection().deleteMany({ _id: { $in: [from, to, third] } });
      await Meteor.users.rawCollection().deleteMany({ _id: actor });
    }
  });
});
