// #6736: Admin Panel / Settings / Visibility / Features. Site admin only.
// The decisions are models/lib/instanceFeatures.js; this stores them and the
// pilot users who preview disabled features (a flag on the user, published
// only to that user, so nobody learns who the pilots are).
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';
import Settings from '/models/settings';
const { featureSettingsModifier, parsePilotUsernames } = require('/models/lib/instanceFeatures');
const { cardFieldStatesValue } = require('/models/lib/cardFieldVisibility');
const { cleanOptionalApis } = require('/models/lib/optionalApis');

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
  // Admin Panel / Settings / Visibility / Optional APIs: which compatible
  // APIs (Trello, Jira, GitHub, Gitea) answer. Site admins only; unknown keys
  // are dropped and every value is a boolean (models/lib/optionalApis.js).
  async saveOptionalApis(input) {
    await requireSiteAdmin();
    check(input, Object);
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    const optionalApis = cleanOptionalApis(input);
    await Settings.updateAsync(setting._id, { $set: { optionalApis } });
    return optionalApis;
  },

  // #2217: Admin Panel / Settings / Visibility - boards may show their Rules
  // to members, read-only (models/lib/rulesReadOnly.js). Site admins only.
  async saveRulesReadOnlyForMembers(enabled) {
    await requireSiteAdmin();
    check(enabled, Boolean);
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    await Settings.updateAsync(setting._id, { $set: { rulesReadOnlyForMembers: enabled } });
    return enabled;
  },

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

// #6837: feature profiles (models/lib/featureProfiles.js). Site admin only.
// The page names teams, organizations and users; they are resolved here, and a
// name that matches nothing is returned rather than silently dropped.
const { cleanProfiles, storedProfiles, parseNames } = require('/models/lib/featureProfiles');
const { FEATURE_KEYS } = require('/models/lib/instanceFeatures');

Meteor.methods({
  // The profiles with the names of what they apply to, for the page.
  async getFeatureProfiles() {
    await requireSiteAdmin();
    const Org = require('/models/org').default;
    const Team = require('/models/team').default;
    const setting = await Settings.findOneAsync({});
    const profiles = storedProfiles(setting);
    const allTeamIds = profiles.flatMap(p => p.teamIds || []);
    const allOrgIds = profiles.flatMap(p => p.orgIds || []);
    const [teams, orgs, users] = await Promise.all([
      Team.find({ _id: { $in: allTeamIds } }, { fields: { teamDisplayName: 1 } }).fetchAsync(),
      Org.find({ _id: { $in: allOrgIds } }, { fields: { orgDisplayName: 1 } }).fetchAsync(),
      Meteor.users.find({ featureProfileId: { $in: profiles.map(p => p._id) } },
        { fields: { username: 1, featureProfileId: 1 }, sort: { username: 1 }, limit: 5000 }).fetchAsync(),
    ]);
    const teamName = new Map(teams.map(t => [t._id, t.teamDisplayName]));
    const orgName = new Map(orgs.map(o => [o._id, o.orgDisplayName]));
    return profiles.map(p => ({
      _id: p._id, name: p.name, hidden: p.hidden || [],
      teams: (p.teamIds || []).map(id => teamName.get(id)).filter(Boolean),
      orgs: (p.orgIds || []).map(id => orgName.get(id)).filter(Boolean),
      usernames: users.filter(u => u.featureProfileId === p._id).map(u => u.username).filter(Boolean),
    }));
  },

  // Saves every profile: [{ _id?, name, hidden: [key], teams, orgs, usernames }]
  // with teams/orgs/usernames as text, one name per line or comma. A user is in
  // at most one profile directly: listed in two, the later one wins.
  async saveFeatureProfiles(input) {
    await requireSiteAdmin();
    check(input, [Match.ObjectIncluding({ name: String, hidden: [String],
      teams: Match.Optional(String), orgs: Match.Optional(String), usernames: Match.Optional(String) })]);
    const Org = require('/models/org').default;
    const Team = require('/models/team').default;
    const { Random } = require('meteor/random');
    const setting = await Settings.findOneAsync({});
    if (!setting) throw new Meteor.Error('settings-not-found');
    const unknown = { teams: [], orgs: [], usernames: [] };
    const resolve = async (names, collection, field, missing) => {
      if (!names.length) return [];
      const found = await collection.find({ [field]: { $in: names } }, { fields: { [field]: 1 } }).fetchAsync();
      for (const name of names) if (!found.some(doc => doc[field] === name)) missing.push(name);
      return found.map(doc => doc._id);
    };
    const prepared = [];
    for (const row of input) {
      prepared.push({ _id: row._id, name: row.name, hidden: row.hidden,
        teamIds: await resolve(parseNames(row.teams), Team, 'teamDisplayName', unknown.teams),
        orgIds: await resolve(parseNames(row.orgs), Org, 'orgDisplayName', unknown.orgs),
        usernames: parseNames(row.usernames) });
    }
    const cleaned = cleanProfiles(prepared, FEATURE_KEYS, () => Random.id());
    if (cleaned.error) throw new Meteor.Error(cleaned.error, cleaned.keys ? cleaned.keys.join(', ') : cleaned.name);
    // Users: who is in which profile now. Everybody else loses a direct one.
    const assigned = new Map();
    cleaned.profiles.forEach((profile, i) => { for (const name of prepared[i].usernames) assigned.set(name, profile._id); });
    const users = assigned.size
      ? await Meteor.users.find({ username: { $in: [...assigned.keys()] } }, { fields: { username: 1 } }).fetchAsync() : [];
    for (const name of assigned.keys()) if (!users.some(u => u.username === name)) unknown.usernames.push(name);
    await Settings.updateAsync(setting._id, { $set: { featureProfiles: cleaned.profiles } });
    await Meteor.users.updateAsync({ featureProfileId: { $exists: true }, _id: { $nin: users.map(u => u._id) } },
      { $unset: { featureProfileId: '' } }, { multi: true });
    for (const user of users) {
      await Meteor.users.updateAsync(user._id, { $set: { featureProfileId: assigned.get(user.username) } });
    }
    return { profiles: cleaned.profiles.length, unknown };
  },
});
