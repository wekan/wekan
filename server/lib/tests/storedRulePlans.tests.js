import assert from 'node:assert/strict';
import { Meteor } from 'meteor/meteor';
import { Random } from 'meteor/random';
import { Accounts } from 'meteor/accounts-base';
import { Email } from 'meteor/email';
import { getFeatureFlags } from '/models/lib/featureFlags';
import { runStoredSyncActivityDelivery } from '/server/notifications/storedActivityDelivery';
import Boards from '/models/boards';
import Lists from '/models/lists';
import Cards from '/models/cards';
import Activities from '/models/activities';
import ChangeHistory from '/models/changeHistory';
import Rules from '/models/rules';
import Triggers from '/models/triggers';
import Actions from '/models/actions';
import { runStoredSyncRuleArchive, captureStoredSyncRuleArchiveCommand, SyncRuleArchiveCommands, SyncRuleArchiveEffects, SyncRuleArchiveReceipts, captureStoredSyncRulePlan, captureStoredSyncRuleEmailCommand, runStoredSyncRuleEmail, SyncRuleEmailAttempts, runStoredSyncRules, SyncRulePlans, SyncRuleReceipts, SyncRuleEmailCommands } from '/server/notifications/storedRulePlans';

const { planId, actionId: invocationId } = require('/server/lib/syncRulePlan');

describe('Stored Sync rule selection', function () {
  this.timeout(15000);
  it('uses actual matching, preserves saved actions and refuses revoked or changed scope', async function () {
    if (!Meteor.isAppTest) this.skip();
    const recipientId = Random.id(), childId = Random.id(), laterChildId = Random.id();
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), cardId = Random.id(), activityId = Random.id();
    const ruleId = Random.id(), triggerId = Random.id(), actionId = Random.id();
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Original card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'a'.repeat(64), policy: { activities: true, notifications: true }, trigger: 'manual', assertCurrent: async () => {} };
    const originalFrom = Accounts.emailTemplates.from, originalSend = Email.sendAsync;
    Accounts.emailTemplates.from = 'wekan@example.org';
    Email.sendAsync = async () => { throw new Error('capture must never send mail'); };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: actor });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Board', members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List' });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, title: 'Original card', assignees: [] });
      await Activities.rawCollection().insertOne(activity);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: ruleId, boardId, triggerId, actionId, enabled: true, title: 'Rule' });
      await Actions.rawCollection().insertOne({ _id: actionId, actionType: 'addLabel', boardId, labelId: 'original' });
      // Sync activation (maintainer decision of 2026-09-30): off unless the
      // board opted in; scheduled runs also need the instance switch; the
      // caller must name its trigger. Refusals write nothing.
      await assert.rejects(captureStoredSyncRulePlan({ ...input, trigger: undefined }), /trigger-required/);
      await Boards.rawCollection().updateOne({ _id: boardId }, { $unset: { syncEffectsEnabled: 1 } });
      await assert.rejects(captureStoredSyncRulePlan(input), /sync-effects-not-enabled/);
      await Boards.rawCollection().updateOne({ _id: boardId }, { $set: { syncEffectsEnabled: true } });
      const syncFlags = getFeatureFlags(), cron = syncFlags.enableSyncCronEffects;
      try {
        syncFlags.enableSyncCronEffects = false;
        await assert.rejects(captureStoredSyncRulePlan({ ...input, trigger: 'scheduled' }), /sync-cron-effects-not-enabled/);
        assert.equal(await SyncRulePlans.find({ _id: planId(input.effectId, activityId) }).countAsync(), 0);
        syncFlags.enableSyncCronEffects = true;
        assert.equal((await captureStoredSyncRulePlan({ ...input, trigger: 'scheduled' })).actions.length, 1);
      } finally { syncFlags.enableSyncCronEffects = cron; }
      const first = await captureStoredSyncRulePlan(input);
      assert.equal(first.actions.length, 1);
      assert.equal(first.actions[0].rule._id, ruleId);
      assert.equal(first.actions[0].action.labelId, 'original');
      await assert.rejects(runStoredSyncRules({ ...input, adapters: {} }), /adapter-required/);
      await assert.rejects(runStoredSyncRules({ ...input, adapters: { addLabel: async () => true } }), /action-unconfirmed/);
      assert.equal(await SyncRuleReceipts.find({ effectId: input.effectId }).countAsync(), 0);
      let calls = 0;
      assert.equal(await runStoredSyncRules({ ...input, adapters: { addLabel: async ({ invocation, assertCurrent }) => {
        await assertCurrent(); calls++;
        assert.equal(invocation.action.labelId, 'original');
        return invocation.id;
      } } }), input.effectId);
      assert.equal(await runStoredSyncRules({ ...input, adapters: {} }), input.effectId);
      assert.equal(calls, 1);
      assert.equal(await SyncRuleReceipts.find({ effectId: input.effectId }).countAsync(), 2);
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { labelId: 'edited' } });
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $set: { enabled: false } });
      assert.deepEqual(await captureStoredSyncRulePlan(input), first);
      const empty = await captureStoredSyncRulePlan({ ...input, effectId: 'b'.repeat(64) });
      assert.deepEqual(empty.actions, []);
      await Rules.rawCollection().updateOne({ _id: ruleId }, { $set: { enabled: true } });
      assert.deepEqual(await captureStoredSyncRulePlan({ ...input, effectId: 'b'.repeat(64) }), empty);
      assert.equal(await runStoredSyncRules({ ...input, effectId: 'b'.repeat(64), adapters: {} }), 'b'.repeat(64));
      assert.deepEqual(await Cards.rawCollection().findOne({ _id: cardId }),
        { _id: cardId, boardId, listId, title: 'Original card', assignees: [] });
      assert.equal(await Activities.rawCollection().countDocuments({ boardId }), 1);
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { archived: false, swimlaneId: 'lane' } });
      await Cards.rawCollection().insertOne({ _id: childId, boardId, listId, swimlaneId: 'lane',
        title: 'Child', parentId: cardId, archived: false });
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { actionType: 'archive' } });
      const archiveInput = { ...input, effectId: 'e'.repeat(64), index: 0 };
      const archive = await captureStoredSyncRuleArchiveCommand(archiveInput);
      assert.deepEqual(archive.cards.map(card => card._id), [childId, cardId]);
      assert.equal(await SyncRuleArchiveCommands.find({ boardId }).countAsync(), 1);
      assert.equal((await Cards.findOneAsync(cardId)).archived, false);
      await Cards.rawCollection().insertOne({ _id: laterChildId, boardId, listId, swimlaneId: 'lane',
        title: 'Later child', parentId: cardId, archived: false });
      assert.deepEqual(await captureStoredSyncRuleArchiveCommand(archiveInput), archive);
      await Cards.rawCollection().updateOne({ _id: childId }, { $set: { parentId: 'moved' } });
      await assert.rejects(captureStoredSyncRuleArchiveCommand(archiveInput), /card-denied/);
      await Cards.rawCollection().updateOne({ _id: childId }, { $set: { parentId: cardId } });
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { actionType: 'unarchive' } });
      await assert.rejects(captureStoredSyncRuleArchiveCommand(archiveInput), /configuration-changed/);
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { actionType: 'archive' } });
      assert.deepEqual(await captureStoredSyncRuleArchiveCommand(archiveInput), archive);
      await assert.rejects(runStoredSyncRuleArchive(archiveInput), /history-reservation-required/);
      const flags = getFeatureFlags(), oldFlags = { ...flags };
      try {
        flags.disableNotifications = true;
        const run = { ...archiveInput, policy: { activities: true, notifications: false }, trigger: 'manual',
          withHistoryReservation: async (id, work) => {
            assert.equal(id, boardId);
            return work({ previousHash: null, redoRows: [], assertCurrent: async () => {} });
          } };
        await assert.rejects(runStoredSyncRuleArchive({ ...run,
          completeDelivery: async () => { throw Error('delivery interrupted'); } }), /delivery interrupted/);
        assert.equal((await Cards.findOneAsync(childId)).archived, true);
        assert.equal((await Cards.findOneAsync(cardId)).archived, false);
        assert.equal(await ChangeHistory.find({ boardId }).countAsync(), 1);
        assert.equal(await SyncRuleArchiveReceipts.find({ commandId: archive._id }).countAsync(), 0);
        assert.equal(await runStoredSyncRuleArchive(run), archive.invocationId);
        assert.equal(await runStoredSyncRuleArchive(run), archive.invocationId);
        assert.equal((await Cards.findOneAsync(cardId)).archived, true);
        assert.equal((await Cards.findOneAsync(laterChildId)).archived, false);
        assert.equal(await ChangeHistory.find({ boardId }).countAsync(), 2);
        assert.equal(await Activities.find({ boardId }).countAsync(), 3);
        assert.equal(await SyncRuleArchiveEffects.find({ _id: archive._id }).countAsync(), 1);
        assert.equal(await SyncRuleArchiveReceipts.find({ commandId: archive._id }).countAsync(), 3);
      } finally { Object.assign(flags, oldFlags); }
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { actionType: 'sendEmail',
        emailTo: 'outside@example.org', emailSubject: 'Subject {card}', emailMsg: 'Body {board} {list}' } });
      const mailInput = { ...input, effectId: 'c'.repeat(64), index: 0 };
      const command = await captureStoredSyncRuleEmailCommand(mailInput);
      assert.equal(command.mail.to, 'outside@example.org');
      assert.equal(command.mail.from, 'wekan@example.org');
      assert.equal(command.mail.subject, 'Subject Original card');
      assert.match(command.mail.text, /Body Board List/);
      assert.match(command.mail.text, /Card: Original card/);
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { title: 'Later title' } });
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { emailTo: 'changed@example.org' } });
      assert.deepEqual(await captureStoredSyncRuleEmailCommand(mailInput), command);
      assert.equal(await SyncRuleEmailCommands.find({ boardId }).countAsync(), 1);
      await assert.rejects(runStoredSyncRuleEmail(mailInput), /configuration-changed/);
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { emailTo: 'outside@example.org' } });
      await Meteor.users.rawCollection().insertOne({ _id: recipientId, loginDisabled: true,
        emails: [{ address: 'Outside@Example.Org' }] });
      await assert.rejects(runStoredSyncRuleEmail(mailInput), /recipient-denied/);
      await Meteor.users.rawCollection().deleteOne({ _id: recipientId });
      let sent = 0;
      Email.sendAsync = async mail => { sent++; assert.deepEqual(mail, command.mail); return { accepted: ['outside@example.org'] }; };
      assert.equal(await runStoredSyncRuleEmail(mailInput), command.invocationId);
      assert.equal(await runStoredSyncRuleEmail(mailInput), command.invocationId);
      assert.equal(sent, 1);
      const uncertainInput = { ...mailInput, effectId: 'd'.repeat(64) };
      Email.sendAsync = async () => { sent++; return undefined; };
      await assert.rejects(runStoredSyncRuleEmail(uncertainInput), /delivery-unconfirmed/);
      await assert.rejects(runStoredSyncRuleEmail(uncertainInput), /delivery-uncertain/);
      assert.equal(sent, 2);
      await Meteor.users.rawCollection().updateOne({ _id: actor }, { $set: { loginDisabled: true } });
      await assert.rejects(captureStoredSyncRulePlan(input), /context-denied/);
      await assert.rejects(captureStoredSyncRuleEmailCommand(mailInput), /context-denied/);
      await assert.rejects(runStoredSyncRules({ ...input, adapters: {} }), /context-denied/);
      await Meteor.users.rawCollection().updateOne({ _id: actor }, { $set: { loginDisabled: false } });
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listId: 'moved' } });
      await assert.rejects(captureStoredSyncRulePlan(input), /context-denied/);
      await assert.rejects(captureStoredSyncRuleEmailCommand(mailInput), /context-denied/);
      await assert.rejects(runStoredSyncRules({ ...input, adapters: {} }), /context-denied/);
      await Cards.rawCollection().updateOne({ _id: cardId }, { $set: { listId } });
      await Activities.rawCollection().updateOne({ _id: activityId }, { $set: { cardTitle: 'changed' } });
      await assert.rejects(captureStoredSyncRulePlan(input), /activity-changed/);
      assert.equal(await SyncRulePlans.find({ 'plan.activityId': activityId }).countAsync(), 5);
    } finally {
      const archiveCommands = await SyncRuleArchiveCommands.find({ boardId }, { fields: { _id: 1 } }).fetchAsync();
      const archiveIds = archiveCommands.map(row => row._id);
      await SyncRuleArchiveEffects.rawCollection().deleteMany({ _id: { $in: archiveIds } });
      await SyncRuleArchiveReceipts.rawCollection().deleteMany({ commandId: { $in: archiveIds } });
      const archivePlans = await SyncRulePlans.find({ 'plan.boardId': boardId }).fetchAsync();
      await SyncRuleReceipts.rawCollection().deleteMany({ effectId: { $in: archivePlans.map(row => row.plan.effectId) } });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.boardId': boardId });
      await ChangeHistory.rawCollection().deleteMany({ boardId });
      await Activities.rawCollection().deleteMany({ boardId });
      await SyncRuleArchiveCommands.rawCollection().deleteMany({ boardId });
      await Cards.rawCollection().deleteMany({ _id: { $in: [childId, laterChildId] } });
      await Meteor.users.rawCollection().deleteOne({ _id: recipientId });
      Accounts.emailTemplates.from = originalFrom;
      Email.sendAsync = originalSend;
      const commands = await SyncRuleEmailCommands.find({ boardId, cardId }, { fields: { _id: 1 } }).fetchAsync();
      await SyncRuleEmailAttempts.rawCollection().deleteMany({ _id: { $in: commands.map(row => row._id) } });
      await SyncRuleEmailCommands.rawCollection().deleteMany({ boardId, cardId });
      const id = planId(input.effectId, activityId);
      await SyncRuleReceipts.rawCollection().deleteMany({ _id: { $in: [id, invocationId(id, 0), planId('b'.repeat(64), activityId)] } });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      for (const [collection, id] of [[Activities, activityId], [Cards, cardId], [Lists, listId], [Boards, boardId],
        [Rules, ruleId], [Triggers, triggerId], [Actions, actionId], [Meteor.users, actor]]) {
        await collection.rawCollection().deleteOne({ _id: id });
      }
    }
  });
});

describe('Stored Sync rule email network delivery', function () {
  this.timeout(20000);
  it('uses real SMTP and preserves sent or uncertain evidence across repeated calls', async function () {
    if (!Meteor.isAppTest) this.skip();
    const net = require('node:net'), sockets = new Set(), bodies = [], recipients = [];
    let mode = 'accept', connections = 0;
    const smtp = net.createServer(socket => {
      connections++; sockets.add(socket);
      socket.on('error', () => {}); socket.on('close', () => sockets.delete(socket));
      socket.write('220 localhost test SMTP\r\n');
      let buffer = '', body = null;
      socket.on('data', chunk => {
        buffer += chunk.toString(); let end;
        while ((end = buffer.indexOf('\r\n')) !== -1) {
          const line = buffer.slice(0, end); buffer = buffer.slice(end + 2);
          if (body !== null) {
            if (line === '.') {
              bodies.push(body.join('\n')); body = null;
              if (mode === 'disconnect') socket.destroy();
              else socket.write('250 message accepted\r\n');
            } else body.push(line);
          } else if (line.startsWith('EHLO') || line.startsWith('HELO')) socket.write('250 localhost\r\n');
          else if (line.startsWith('RCPT TO:')) {
            recipients.push(line);
            socket.write(mode === 'partial' && line.includes('rejected@example.org')
              ? '550 recipient refused\r\n' : '250 recipient accepted\r\n');
          } else if (line === 'DATA') { body = []; socket.write('354 send data\r\n'); }
          else if (line === 'QUIT') socket.end('221 closing\r\n');
          else socket.write('250 OK\r\n');
        }
      });
    });
    await new Promise((resolve, reject) => { smtp.once('error', reject); smtp.listen(0, '127.0.0.1', resolve); });
    const actor = Random.id(), boardId = Random.id(), listId = Random.id(), cardId = Random.id(), activityId = Random.id();
    const ruleId = Random.id(), triggerId = Random.id(), actionId = Random.id();
    const extraRule = Random.id(), extraAction = Random.id(), extraTrigger = Random.id();
    const flags = getFeatureFlags(), previousNotifications = flags.disableNotifications;
    flags.disableNotifications = true;
    const originalURL = process.env.MAIL_URL, originalFrom = Accounts.emailTemplates.from, originalTransport = Email.customTransport;
    process.env.MAIL_URL = `smtp://127.0.0.1:${smtp.address().port}/?wekanTotalTimeout=5000`;
    Accounts.emailTemplates.from = 'sender@example.org'; Email.customTransport = undefined;
    const activity = { _id: activityId, activityType: 'createCard', boardId, listId, cardId, userId: actor,
      cardTitle: 'Network card', listName: 'List', swimlaneName: 'Lane', createdAt: new Date(1000), modifiedAt: new Date(1000) };
    const input = { activity, effectId: 'e'.repeat(64), index: 0, policy: { activities: true, notifications: false }, trigger: 'manual', assertCurrent: async () => {} };
    try {
      await Meteor.users.rawCollection().insertOne({ _id: actor, username: actor });
      await Boards.rawCollection().insertOne({ _id: boardId, syncEffectsEnabled: true, title: 'Network board', members: [{ userId: actor, isAdmin: true, isActive: true }] });
      await Lists.rawCollection().insertOne({ _id: listId, boardId, title: 'List' });
      await Cards.rawCollection().insertOne({ _id: cardId, boardId, listId, title: 'Network card', description: 'Saved description' });
      await Activities.rawCollection().insertOne(activity);
      await Triggers.rawCollection().insertOne({ _id: triggerId, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: ruleId, boardId, triggerId, actionId, enabled: true });
      await Actions.rawCollection().insertOne({ _id: actionId, boardId, actionType: 'sendEmail', emailTo: 'Recipient <accepted@example.org>', emailSubject: 'Network {card}', emailMsg: 'Real SMTP {board}' });
      const first = await captureStoredSyncRuleEmailCommand(input);
      assert.equal(await runStoredSyncActivityDelivery(input), input.effectId);
      assert.equal(await runStoredSyncRules(input), input.effectId);
      assert.equal(await SyncRuleReceipts.find({ effectId: input.effectId }).countAsync(), 2);
      assert.equal(connections, 1); assert.equal(bodies.length, 1);
      assert.match(bodies[0], /Subject: Network Network card/);
      assert.match(bodies[0], /Real SMTP Network board/);
      assert.match(bodies[0], /Description: Saved description/);
      assert.equal((await SyncRuleEmailAttempts.findOneAsync(first._id)).state, 'sent');
      mode = 'disconnect';
      const lostInput = { ...input, effectId: 'f'.repeat(64) };
      const lost = await captureStoredSyncRuleEmailCommand(lostInput);
      await assert.rejects(runStoredSyncRules(lostInput));
      await assert.rejects(runStoredSyncRules(lostInput), /delivery-uncertain/);
      assert.equal(await SyncRuleReceipts.find({ effectId: lostInput.effectId }).countAsync(), 0);
      assert.equal(connections, 2); assert.equal(bodies.length, 2);
      assert.equal((await SyncRuleEmailAttempts.findOneAsync(lost._id)).state, 'sending');
      mode = 'partial';
      await Actions.rawCollection().updateOne({ _id: actionId }, { $set: { emailTo: 'accepted@example.org, rejected@example.org' } });
      const partialInput = { ...input, effectId: '1'.repeat(64) };
      const partial = await captureStoredSyncRuleEmailCommand(partialInput);
      await assert.rejects(runStoredSyncRules(partialInput), /delivery-unconfirmed/);
      await assert.rejects(runStoredSyncRules(partialInput), /delivery-uncertain/);
      assert.equal(await SyncRuleReceipts.find({ effectId: partialInput.effectId }).countAsync(), 0);
      assert.equal(connections, 3); assert.equal(bodies.length, 3);
      assert.ok(recipients.some(line => line.includes('rejected@example.org')));
      assert.equal((await SyncRuleEmailAttempts.findOneAsync(partial._id)).state, 'sending');
      await Actions.rawCollection().insertOne({ _id: extraAction, boardId, actionType: 'archive' });
      await Triggers.rawCollection().insertOne({ _id: extraTrigger, boardId, activityType: 'createCard', listName: '*', userId: '*', swimlaneName: '*', cardTitle: '*' });
      await Rules.rawCollection().insertOne({ _id: extraRule, boardId, triggerId: extraTrigger, actionId: extraAction, enabled: true });
      const blockedInput = { ...input, effectId: '2'.repeat(64) };
      const blockedPlan = await captureStoredSyncRulePlan(blockedInput);
      assert.equal(blockedPlan.actions.length, 2);
      await assert.rejects(runStoredSyncActivityDelivery(blockedInput), /adapter-required/);
      assert.equal(connections, 3);
      assert.equal(await SyncRuleReceipts.find({ effectId: blockedInput.effectId }).countAsync(), 0);
    } finally {
      flags.disableNotifications = previousNotifications;
      if (originalURL === undefined) delete process.env.MAIL_URL; else process.env.MAIL_URL = originalURL;
      Accounts.emailTemplates.from = originalFrom; Email.customTransport = originalTransport;
      for (const socket of sockets) socket.destroy();
      await new Promise(resolve => smtp.close(resolve));
      const commands = await SyncRuleEmailCommands.find({ boardId, cardId }, { fields: { _id: 1 } }).fetchAsync();
      await SyncRuleEmailAttempts.rawCollection().deleteMany({ _id: { $in: commands.map(row => row._id) } });
      await SyncRuleEmailCommands.rawCollection().deleteMany({ boardId, cardId });
      const receiptPlanId = planId(input.effectId, activityId);
      await SyncRuleReceipts.rawCollection().deleteMany({ _id: { $in: [receiptPlanId, invocationId(receiptPlanId, 0)] } });
      await SyncRulePlans.rawCollection().deleteMany({ 'plan.activityId': activityId });
      for (const [collection, id] of [[Rules, extraRule], [Actions, extraAction], [Triggers, extraTrigger], [Activities, activityId], [Cards, cardId], [Lists, listId], [Boards, boardId],
        [Rules, ruleId], [Triggers, triggerId], [Actions, actionId], [Meteor.users, actor]]) {
        await collection.rawCollection().deleteOne({ _id: id });
      }
    }
  });
});
