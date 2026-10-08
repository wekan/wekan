// #6736: Admin Panel / Settings / Visibility / Features. Site admin only.
// The decisions are models/lib/instanceFeatures.js; this stores them and the
// pilot users who preview disabled features (a flag on the user, published
// only to that user, so nobody learns who the pilots are).
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Settings from '/models/settings';
const { featureSettingsModifier, parsePilotUsernames } = require('/models/lib/instanceFeatures');
const { cardFieldStatesValue } = require('/models/lib/cardFieldVisibility');

async function requireSiteAdmin() {
  const user = await Meteor.userAsync();
  if (user?.isAdmin !== true) throw new Meteor.Error('error-notAuthorized');
  return user;
}

Meteor.methods({
  // The usernames of the current pilot users, for the page's text box.
  async getFeaturePilotUsernames() {
    await requireSiteAdmin();
    const users = await Meteor.users.find({ featurePreview: true },
      { fields: { username: 1 }, sort: { username: 1 }, limit: 500 }).fetchAsync();
    return users.map(user => user.username).filter(Boolean);
  },

  // Saves every feature's decision, the two policies and the pilot users.
  // Unknown usernames are returned rather than silently ignored.
  async saveInstanceFeatures(input) {
    await requireSiteAdmin();
    check(input, {
      states: Object,
      approvalRequired: Boolean,
      previewAdmins: Boolean,
      pilotUsernames: Match.Optional(String),
      // The card fields every board shows (models/lib/cardFieldVisibility.js).
      cardFields: Match.Optional(Object),
    });
    const { pilotUsernames, cardFields, ...decisions } = input;
    const modifier = featureSettingsModifier(decisions);
    if (modifier.error) throw new Meteor.Error('invalid-features', modifier.error);
    if (cardFields !== undefined) {
      const value = cardFieldStatesValue(cardFields);
      if (value.error) throw new Meteor.Error('invalid-card-fields', value.error);
      modifier.$set.cardFieldStates = value.cardFieldStates;
    }
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, modifier);

    let unknownUsernames = [];
    if (typeof pilotUsernames === 'string') {
      const names = parsePilotUsernames(pilotUsernames);
      const pilots = names.length ? await Meteor.users.find({ username: { $in: names } },
        { fields: { _id: 1, username: 1 } }).fetchAsync() : [];
      const ids = pilots.map(user => user._id);
      unknownUsernames = names.filter(name => !pilots.some(user => user.username === name));
      await Meteor.users.updateAsync({ featurePreview: true, _id: { $nin: ids } },
        { $unset: { featurePreview: '' } }, { multi: true });
      if (ids.length) {
        await Meteor.users.updateAsync({ _id: { $in: ids } }, { $set: { featurePreview: true } }, { multi: true });
      }
    }
    return { saved: true, unknownUsernames };
  },
});
