import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Boards from '/models/boards';
import Integrations from '/models/integrations';
import Settings from '/models/settings';
import { allowIsBoardAdminOrSiteAdmin } from '/server/lib/utils';
const { CHANNELS, MEMBER_CHANNELS, normalizeChannelSettings } = require('/models/lib/notificationDelivery');
const { normalizeMemberWebhookSettings } = require('/models/lib/webhookPayload');

// #3695 / #5171: notification delivery (content, grouping, schedule) per
// channel, set from the three Notification Settings places and each webhook's
// own form. models/lib/notificationDelivery.js says how the levels combine.
// Every value is validated by that pure module before anything is written.
//
//   scope 'admin'        instance default, any channel   - instance admins only
//   scope 'board'        targetId = board id, any channel - that board's admins (or an instance admin)
//   scope 'integration'  targetId = integration id,
//                        channel 'webhook'                - the webhook's board admins; a global
//                                                           webhook only instance admins
//   scope 'member'       the CALLER's own profile:
//                        channel 'email' | 'tray'         - their own delivery
//                        channel 'webhook'                - only { hideIdentity }: a member cannot
//                                                           change a board's webhooks
//
// `settings` is a CHANGE to that level: each key given is set, a key given as
// null is cleared (inherits), keys not given are kept. The merge happens here,
// on the stored value, so two quick changes from one form never overwrite
// each other with a stale copy. `settings` null clears the whole level.
const SCOPES = ['admin', 'board', 'integration', 'member'];

function invalid(e) {
  return new Meteor.Error('invalid-notification-delivery', e && e.message);
}

Meteor.methods({
  async setNotificationDelivery(scope, targetId, channel, settings) {
    check(scope, String);
    check(targetId, Match.Maybe(String));
    check(channel, String);
    check(settings, Match.Maybe(Object));
    if (!this.userId) throw new Meteor.Error('not-authorized');
    if (!SCOPES.includes(scope)) throw new Meteor.Error('invalid-scope');
    if (!CHANNELS.includes(channel)) throw new Meteor.Error('invalid-channel');

    if (scope === 'member') {
      if (targetId && targetId !== this.userId) throw new Meteor.Error('not-authorized');
      if (channel === 'webhook') {
        let member;
        try { member = normalizeMemberWebhookSettings(settings || {}); } catch (e) { throw invalid(e); }
        await Meteor.users.updateAsync(this.userId, member.hideIdentity
          ? { $set: { 'profile.webhookHideIdentity': true } }
          : { $unset: { 'profile.webhookHideIdentity': '' } });
        return member;
      }
      if (!MEMBER_CHANNELS.includes(channel)) throw new Meteor.Error('invalid-channel');
    }
    if (scope === 'integration' && channel !== 'webhook') throw new Meteor.Error('invalid-channel');

    // Validate the change itself first, so an unknown key or value is
    // refused even when it would be merged away.
    try { normalizeChannelSettings(channel, settings); } catch (e) { throw invalid(e); }
    const prefix = scope === 'member' ? 'profile.notificationDelivery' : 'notificationDelivery';
    const field = `${prefix}.${channel}`;
    const merged = stored => {
      if (settings === null) return null;
      const next = { ...(stored || {}) };
      for (const [key, value] of Object.entries(settings)) {
        if (value === null || value === undefined) delete next[key];
        else next[key] = value;
      }
      try { return normalizeChannelSettings(channel, next); } catch (e) { throw invalid(e); }
    };
    const modifierFor = normalized => (normalized ? { $set: { [field]: normalized } } : { $unset: { [field]: '' } });

    if (scope === 'member') {
      const me = await Meteor.users.findOneAsync(this.userId, { fields: { 'profile.notificationDelivery': 1 } });
      const normalized = merged(me?.profile?.notificationDelivery?.[channel]);
      await Meteor.users.updateAsync(this.userId, modifierFor(normalized));
      return normalized;
    }

    const user = await Meteor.users.findOneAsync(this.userId, { fields: { isAdmin: 1 } });
    const isInstanceAdmin = user?.isAdmin === true;

    if (scope === 'admin') {
      if (!isInstanceAdmin) throw new Meteor.Error('not-authorized');
      const setting = await Settings.findOneAsync({});
      if (!setting) throw new Meteor.Error('settings-not-found');
      const normalized = merged(setting.notificationDelivery?.[channel]);
      await Settings.updateAsync(setting._id, modifierFor(normalized));
      return normalized;
    }

    if (!targetId) throw new Meteor.Error('not-found');

    if (scope === 'board') {
      const board = await Boards.findOneAsync(targetId);
      if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) {
        throw new Meteor.Error('not-authorized');
      }
      const normalized = merged(board.notificationDelivery?.[channel]);
      await Boards.updateAsync(targetId, modifierFor(normalized));
      return normalized;
    }

    // scope === 'integration'
    const integration = await Integrations.findOneAsync(targetId);
    if (!integration) throw new Meteor.Error('not-authorized');
    if (integration.boardId === Integrations.Const.GLOBAL_WEBHOOK_ID) {
      if (!isInstanceAdmin) throw new Meteor.Error('not-authorized');
    } else {
      const board = await Boards.findOneAsync(integration.boardId);
      if (!board || !(await allowIsBoardAdminOrSiteAdmin(this.userId, board))) {
        throw new Meteor.Error('not-authorized');
      }
    }
    const normalized = merged(integration.notificationDelivery?.webhook);
    await Integrations.updateAsync({ _id: targetId, boardId: integration.boardId }, modifierFor(normalized));
    return normalized;
  },
});
