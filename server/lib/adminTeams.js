import { Meteor } from 'meteor/meteor';
import Team from '/models/team';
import Settings from '/models/settings';
import securityLog from '/server/lib/securityLog';
import escapeForRegex from 'escape-string-regexp';

export const TEAM_FEATURE_FIELDS = Object.freeze([
  'teamSharedTemplates',
  'teamPropagateMembersToBoards',
  'teamSyncMembersFromAuth',
]);

export const TEAM_PUBLIC_FIELDS = Object.freeze([
  '_id', 'teamDisplayName', 'teamDesc', 'teamShortName', 'teamWebsite',
  'createdAt', 'teamIsActive', ...TEAM_FEATURE_FIELDS,
]);

function report(actor, context, detail, category = 'authz', severity = 'high') {
  securityLog.record({ severity, category, bleed: 'TeamBleed', action: 'blocked',
    source: 'adminTeams', userId: actor?._id || context.userId,
    username: actor?.username, req: context.req, detail });
}

async function requireSiteAdmin(userId, context = {}) {
  const actor = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, username: 1 },
  });
  if (actor?.isAdmin === true) return actor;
  report(actor, { ...context, userId }, 'refused Teams administration');
  throw new Meteor.Error('not-authorized', 'Site admin required');
}

function bounded(value, maximum, field) {
  if (typeof value !== 'string') throw new Meteor.Error('invalid-team-field', field);
  const clean = value.trim();
  if (clean.length > maximum) throw new Meteor.Error('team-field-too-long', field);
  return clean;
}

function normalizeTeam(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Meteor.Error('invalid-team');
  }
  if (typeof input.teamIsActive !== 'boolean') throw new Meteor.Error('invalid-team-field');
  return {
    teamDisplayName: bounded(input.teamDisplayName || '', 1000, 'teamDisplayName'),
    teamDesc: bounded(input.teamDesc || '', 190, 'teamDesc'),
    teamShortName: bounded(input.teamShortName || '', 255, 'teamShortName'),
    teamWebsite: bounded(input.teamWebsite || '', 255, 'teamWebsite'),
    teamIsActive: input.teamIsActive,
  };
}

function projection() {
  return Object.fromEntries(TEAM_PUBLIC_FIELDS.map(field => [field, 1]));
}

export async function teamsPageForAdmin(userId, params = {}, context = {}) {
  await requireSiteAdmin(userId, context);
  const search = String(params.search || '').trim().slice(0, 500);
  const requested = Number(params.page);
  const requestedPage = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  const query = search ? { $or: [
    { teamDisplayName: new RegExp(escapeForRegex(search), 'i') },
    { teamShortName: new RegExp(escapeForRegex(search), 'i') },
  ] } : {};
  const perPage = 10;
  const total = await Team.find(query).countAsync();
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  const rows = await Team.find(query, { fields: projection(), sort: { createdAt: -1 },
    skip: (page - 1) * perPage, limit: perPage }).fetchAsync();
  const setting = await Settings.findOneAsync({}, {
    fields: { boardMembersFromSameTeamOnly: 1 },
  });
  return { rows, search, total, page, totalPages, perPage,
    boardMembersFromSameTeamOnly: setting?.boardMembersFromSameTeamOnly === true };
}

export async function teamForAdmin(userId, teamId, context = {}) {
  await requireSiteAdmin(userId, context);
  const team = await Team.findOneAsync(teamId, { fields: projection() });
  if (!team) throw new Meteor.Error('team-not-found');
  return team;
}

export async function createTeamForAdmin(userId, input, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  let clean;
  try { clean = normalizeTeam(input); } catch (error) {
    report(actor, context, `refused invalid team creation: ${error.error || error.message}`,
      'validation');
    throw error;
  }
  if (await Team.findOneAsync({ teamShortName: clean.teamShortName }, { fields: { _id: 1 } })) {
    throw new Meteor.Error('teamname-already-taken');
  }
  return Team.insertAsync(clean);
}

export async function updateTeamForAdmin(userId, teamId, input, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  let clean;
  try { clean = normalizeTeam(input); } catch (error) {
    report(actor, context, `refused invalid team update: ${error.error || error.message}`,
      'validation');
    throw error;
  }
  const duplicate = await Team.findOneAsync({ _id: { $ne: teamId },
    teamShortName: clean.teamShortName }, { fields: { _id: 1 } });
  if (duplicate) throw new Meteor.Error('teamname-already-taken');
  const existing = await Team.findOneAsync(teamId, { fields: { teamDisplayName: 1 } });
  if (!existing) throw new Meteor.Error('team-not-found');
  await Team.direct.updateAsync(teamId, { $set: clean });
  if (existing.teamDisplayName !== clean.teamDisplayName) {
    const members = await Meteor.users.find({ 'teams.teamId': teamId }, {
      fields: { _id: 1 },
    }).fetchAsync();
    for (const member of members) {
      await Meteor.users.updateAsync({ _id: member._id, 'teams.teamId': teamId }, {
        $set: { 'teams.$.teamDisplayName': clean.teamDisplayName },
      });
    }
  }
  return teamForAdmin(userId, teamId, context);
}

export async function setTeamFeatureForAdmin(userId, teamId, field, value, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  if (!TEAM_FEATURE_FIELDS.includes(field) || typeof value !== 'boolean') {
    report(actor, context, `refused invalid team feature ${String(field).slice(0, 100)}`,
      'validation');
    throw new Meteor.Error('invalid-field');
  }
  if (!await Team.findOneAsync(teamId, { fields: { _id: 1 } })) {
    throw new Meteor.Error('team-not-found');
  }
  await Team.direct.updateAsync(teamId, { $set: { [field]: value } });
  if (field === 'teamPropagateMembersToBoards' && value) {
    const { propagateGroupMembersToBoards } = require('/server/propagateOrgTeamMembers');
    await propagateGroupMembersToBoards('team', teamId);
  }
  return teamForAdmin(userId, teamId, context);
}

export async function setAllTeamsFeatureForAdmin(userId, field, value, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  if (!TEAM_FEATURE_FIELDS.includes(field) || typeof value !== 'boolean') {
    report(actor, context, `refused invalid bulk team feature ${String(field).slice(0, 100)}`,
      'validation');
    throw new Meteor.Error('invalid-field');
  }
  const result = await Team.direct.updateAsync({}, { $set: { [field]: value } }, { multi: true });
  if (field === 'teamPropagateMembersToBoards' && value) {
    const { propagateAllFlaggedGroupsToBoards } = require('/server/propagateOrgTeamMembers');
    await propagateAllFlaggedGroupsToBoards('team');
  }
  return result;
}

export async function setBoardMembersSameTeamForAdmin(userId, value, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  if (typeof value !== 'boolean') {
    report(actor, context, 'refused invalid same-Team restriction', 'validation');
    throw new Meteor.Error('invalid-setting-value');
  }
  const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
  await Settings.direct.updateAsync(setting._id, {
    $set: { boardMembersFromSameTeamOnly: value },
  });
  return value;
}

export async function deleteTeamForAdmin(userId, teamId, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  const members = await Meteor.users.find({ 'teams.teamId': teamId }).countAsync();
  if (members > 0) {
    report(actor, context, `refused deletion of non-empty team ${teamId}`,
      'validation', 'medium');
    throw new Meteor.Error('team-not-empty');
  }
  const removed = await Team.direct.removeAsync(teamId);
  if (!removed) throw new Meteor.Error('team-not-found');
  return true;
}

export default { teamsPageForAdmin, teamForAdmin, createTeamForAdmin,
  updateTeamForAdmin, setTeamFeatureForAdmin, setAllTeamsFeatureForAdmin,
  setBoardMembersSameTeamForAdmin, deleteTeamForAdmin };
