'use strict';

// #6837 (decided 2026-11-18): feature profiles. An administrator defines named
// profiles in Admin Panel / Settings / Visibility / Features, each naming the
// optional features (models/lib/instanceFeatures.js FEATURES) its users do not
// see, and assigns them to users, teams or organizations - to give new or
// occasional users a smaller WeKan.
//
// Strictly opt-in. A simple/advanced mode with features hidden by DEFAULT was
// tried on 2026-11-02 and removed: a feature missing by default is a support
// nightmare. So:
//   * a user with no profile sees everything the instance offers - nothing
//     changes for anybody until an administrator assigns a profile;
//   * a profile only HIDES, like the instance switch: data is untouched and no
//     permission changes, so a profile never grants or takes away access;
//   * the user is told which profile they have (featureProfileNotice), so a
//     hidden feature is never mistaken for a missing one.
//
// Which profile applies: the user's own (users.featureProfileId), else the
// first profile in the administrator's order naming one of the user's teams,
// else one naming one of their organizations, else none.
//
// Stored on the Settings document as featureProfiles: [{ _id, name, hidden,
// teamIds, orgIds }]. Pure CommonJS: the page, the save method, the client and
// server decisions and tests/featureProfiles.test.cjs all use these functions.

const MAX_PROFILES = 50;
const MAX_NAME = 100;
const MAX_GROUPS = 500;
const ID_RE = /^[A-Za-z0-9_-]{1,64}$/;

const ids = (value, limit) => [...new Set((Array.isArray(value) ? value : [])
  .filter(id => typeof id === 'string' && ID_RE.test(id)))].slice(0, limit);

// The profiles to store, cleaned: known features only, unique ids and names,
// bounded. `featureKeys` is the catalog (FEATURE_KEYS); `newId` makes an id
// for a profile that has none yet. Returns { profiles } or { error }.
function cleanProfiles(input, featureKeys, newId) {
  if (!Array.isArray(input)) return { error: 'invalid' };
  if (input.length > MAX_PROFILES) return { error: 'too-many-profiles' };
  const profiles = [];
  const seenIds = new Set();
  const seenNames = new Set();
  for (const raw of input) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return { error: 'invalid' };
    const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, MAX_NAME) : '';
    if (!name) return { error: 'profile-name-required' };
    if (seenNames.has(name.toLowerCase())) return { error: 'profile-name-taken', name };
    seenNames.add(name.toLowerCase());
    const id = typeof raw._id === 'string' && ID_RE.test(raw._id) ? raw._id : newId();
    if (seenIds.has(id)) return { error: 'invalid' };
    seenIds.add(id);
    const hidden = Array.isArray(raw.hidden) ? raw.hidden : [];
    const unknown = hidden.filter(key => !featureKeys.includes(key));
    if (unknown.length) return { error: 'unknown-feature', keys: unknown };
    profiles.push({ _id: id, name, hidden: featureKeys.filter(key => hidden.includes(key)),
      teamIds: ids(raw.teamIds, MAX_GROUPS), orgIds: ids(raw.orgIds, MAX_GROUPS) });
  }
  return { profiles };
}

function storedProfiles(setting) {
  const profiles = setting && setting.featureProfiles;
  return Array.isArray(profiles) ? profiles.filter(p => p && typeof p._id === 'string') : [];
}

const groupIds = (list, field) => (Array.isArray(list) ? list : [])
  .map(entry => entry && entry[field]).filter(id => typeof id === 'string' && id);

// The profile that applies to this user, or null.
function profileForUser(setting, user) {
  if (!user) return null;
  const profiles = storedProfiles(setting);
  if (!profiles.length) return null;
  if (typeof user.featureProfileId === 'string' && user.featureProfileId) {
    const own = profiles.find(p => p._id === user.featureProfileId);
    if (own) return own;
  }
  const teams = groupIds(user.teams, 'teamId');
  const byTeam = profiles.find(p => (p.teamIds || []).some(id => teams.includes(id)));
  if (byTeam) return byTeam;
  const orgs = groupIds(user.orgs, 'orgId');
  return profiles.find(p => (p.orgIds || []).some(id => orgs.includes(id))) || null;
}

// Whether this user's profile hides this catalog feature.
function hiddenByProfile(setting, user, key) {
  const profile = profileForUser(setting, user);
  return !!(profile && Array.isArray(profile.hidden) && profile.hidden.includes(key));
}

// What the user is told: their profile's name and how many features it hides,
// or null when nothing is hidden for them.
function featureProfileNotice(setting, user) {
  const profile = profileForUser(setting, user);
  if (!profile || !Array.isArray(profile.hidden) || !profile.hidden.length) return null;
  return { name: profile.name, hiddenCount: profile.hidden.length };
}

// "alice, bob\ncarol" -> ['alice', 'bob', 'carol'], unique, bounded.
function parseNames(text, limit = MAX_GROUPS) {
  if (typeof text !== 'string') return [];
  return [...new Set(text.split(/[\n,;]+/).map(name => name.trim()).filter(Boolean))].slice(0, limit);
}

module.exports = {
  MAX_PROFILES,
  cleanProfiles,
  storedProfiles,
  profileForUser,
  hiddenByProfile,
  featureProfileNotice,
  parseNames,
};
