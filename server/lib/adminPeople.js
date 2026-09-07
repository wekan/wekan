import { Meteor } from 'meteor/meteor';
import { Accounts } from 'meteor/accounts-base';
import Org from '/models/org';
import Team from '/models/team';
import * as tenantAdmin from '/models/lib/tenantAdmin';
import securityLog from '/server/lib/securityLog';
import escapeForRegex from 'escape-string-regexp';
import { peopleLoginLocationsForAdmin } from '/server/methods/loginOffices';
import { addUserToTeamBoards } from '/server/lib/teamBoardMembership';
import { enabledLoginAuthenticationMethods } from '/server/lib/adminLoginSettings';
const { lockSummary } = require('/models/lib/accountLockout');

export const PEOPLE_FILTERS = Object.freeze(['all', 'locked', 'active', 'inactive', 'admin']);
export const PEOPLE_PUBLIC_FIELDS = Object.freeze({
  username: 1, emails: 1, isAdmin: 1, createdAt: 1, loginDisabled: 1,
  authenticationMethod: 1, importUsernames: 1, orgs: 1, teams: 1,
  'profile.fullname': 1, 'profile.initials': 1, 'profile.avatarUrl': 1,
  'services.accounts-lockout': 1, loginAddresses: 1,
});

function report(actor, context, detail, category = 'authz') {
  securityLog.record({ severity: 'high', category, bleed: 'UserBleed', action: 'blocked',
    source: 'adminPeople', userId: actor?._id || context.userId,
    username: actor?.username, req: context.req, detail });
}

export async function peopleActor(userId, context = {}) {
  const actor = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, orgs: 1, username: 1 },
  });
  if (tenantAdmin.canOpenAdminPanel(actor)) return actor;
  report(actor, { ...context, userId }, 'refused People administration');
  throw new Meteor.Error('not-authorized', 'Admin access required');
}

function pageRequest(params = {}) {
  const search = String(params.search || '').trim().slice(0, 500);
  const filter = PEOPLE_FILTERS.includes(params.filter) ? params.filter : 'all';
  const requested = Number(params.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  return { search, filter, page, perPage: 25 };
}

function peopleQuery(search, filter, now) {
  const parts = [];
  if (search) {
    const rx = new RegExp(escapeForRegex(search), 'i');
    parts.push({ $or: [{ username: rx }, { 'profile.fullname': rx },
      { 'emails.address': rx }] });
  }
  if (filter === 'locked') {
    parts.push({ 'services.accounts-lockout.lockedUntil': { $gt: now } });
  } else if (filter === 'active') parts.push({ loginDisabled: { $ne: true } });
  else if (filter === 'inactive') parts.push({ loginDisabled: true });
  else if (filter === 'admin') parts.push({ isAdmin: true });
  if (!parts.length) return {};
  return parts.length === 1 ? parts[0] : { $and: parts };
}

export async function peoplePageForAdmin(userId, params = {}, context = {}) {
  const actor = await peopleActor(userId, context);
  const { search, filter, page: requestedPage, perPage } = pageRequest(params);
  const now = Date.now();
  const selector = tenantAdmin.peopleScopeSelector(actor, peopleQuery(search, filter, now));
  const total = await Meteor.users.find(selector).countAsync();
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  const users = await Meteor.users.find(selector, { fields: PEOPLE_PUBLIC_FIELDS,
    sort: { createdAt: -1 }, skip: (page - 1) * perPage, limit: perPage }).fetchAsync();
  const locations = await peopleLoginLocationsForAdmin(userId, users.map(user => user._id));
  const locationsByUser = new Map(locations.map(item => [item.userId, item.countries]));
  const rows = users.map(user => ({
    _id: user._id,
    username: user.username || '',
    fullname: user.profile?.fullname || '',
    initials: user.profile?.initials || '',
    avatarUrl: user.profile?.avatarUrl || '',
    email: user.emails?.[0]?.address || '',
    emailVerified: user.emails?.[0]?.verified === true,
    isAdmin: user.isAdmin === true,
    loginDisabled: user.loginDisabled === true,
    authenticationMethod: user.authenticationMethod || 'password',
    importUsernames: Array.isArray(user.importUsernames) ? user.importUsernames : [],
    orgs: Array.isArray(user.orgs) ? user.orgs : [],
    teams: Array.isArray(user.teams) ? user.teams : [],
    createdAt: user.createdAt,
    lock: lockSummary(user, now),
    countries: locationsByUser.get(user._id) || [],
  }));
  const orgSelector = tenantAdmin.orgScopeSelector(actor, {});
  const [orgs, teams] = await Promise.all([
    Org.find(orgSelector, { fields: { orgDisplayName: 1 },
      sort: { orgDisplayName: 1 }, limit: 1000 }).fetchAsync(),
    actor.isAdmin ? Team.find({}, { fields: { teamDisplayName: 1 },
      sort: { teamDisplayName: 1 }, limit: 1000 }).fetchAsync() : [],
  ]);
  return { rows, search, filter, total, page, totalPages, perPage,
    canManageInstance: actor.isAdmin === true, orgs, teams,
    authenticationMethods: enabledLoginAuthenticationMethods() };
}

export async function personForAdmin(userId, targetUserId, context = {}) {
  const actor = await peopleActor(userId, context);
  const target = await Meteor.users.findOneAsync(
    tenantAdmin.peopleScopeSelector(actor, { _id: targetUserId }),
    { fields: PEOPLE_PUBLIC_FIELDS });
  if (!target) {
    report(actor, context, `refused out-of-scope person ${String(targetUserId).slice(0, 100)}`);
    throw new Meteor.Error('user-not-found');
  }
  if (!tenantAdmin.canManageUser(actor, target)) {
    report(actor, context, `refused management of person ${String(targetUserId).slice(0, 100)}`);
    throw new Meteor.Error('not-authorized');
  }
  return target;
}

export async function setPersonActiveForAdmin(
  userId, targetUserId, active, context = {},
) {
  const actor = await peopleActor(userId, context);
  if (typeof active !== 'boolean') throw new Meteor.Error('invalid-active-state');
  const target = await personForAdmin(userId, targetUserId, context);
  if (target.isAdmin && actor._id === target._id && !active) {
    throw new Meteor.Error('cannot-disable-current-admin');
  }
  await Meteor.users.updateAsync(targetUserId, { $set: { loginDisabled: !active } });
  return true;
}

function bounded(value, maximum, field, required = false, forbidSlash = true) {
  if (typeof value !== 'string') throw new Meteor.Error('invalid-user-field', field);
  const clean = value.trim();
  if ((required && !clean) || clean.length > maximum
    || (forbidSlash && clean.includes('/'))) {
    throw new Meteor.Error('invalid-user-field', field);
  }
  return clean;
}

function boolean(value, field) {
  if (typeof value !== 'boolean') throw new Meteor.Error('invalid-user-field', field);
  return value;
}

function stringList(value, field) {
  if (!Array.isArray(value) || value.length > 100) {
    throw new Meteor.Error('invalid-user-field', field);
  }
  return [...new Set(value.map(item => bounded(item, 255, field)).filter(Boolean))];
}

async function memberships(actor, input, context) {
  const orgIds = stringList(input.orgIds || [], 'orgIds');
  const teamIds = stringList(input.teamIds || [], 'teamIds');
  const orgSelector = tenantAdmin.orgScopeSelector(actor, { _id: { $in: orgIds } });
  const orgs = orgIds.length ? await Org.find(orgSelector, {
    fields: { orgDisplayName: 1 }, limit: 100,
  }).fetchAsync() : [];
  const teams = actor.isAdmin && teamIds.length ? await Team.find(
    { _id: { $in: teamIds } }, { fields: { teamDisplayName: 1 }, limit: 100 },
  ).fetchAsync() : [];
  if (orgs.length !== orgIds.length || teams.length !== teamIds.length) {
    report(actor, context, 'refused unknown or out-of-scope Organization/Team membership');
    throw new Meteor.Error('invalid-user-membership');
  }
  const orgById = new Map(orgs.map(org => [org._id, org]));
  const teamById = new Map(teams.map(team => [team._id, team]));
  return {
    orgs: orgIds.map(orgId => ({ orgId, orgDisplayName: orgById.get(orgId).orgDisplayName || '' })),
    teams: teamIds.map(teamId => ({ teamId,
      teamDisplayName: teamById.get(teamId).teamDisplayName || '' })),
  };
}

async function uniqueIdentity(username, email, exceptUserId) {
  const usernameOwner = await Meteor.users.findOneAsync({
    username: new RegExp(`^${escapeForRegex(username)}$`, 'i'),
    ...(exceptUserId ? { _id: { $ne: exceptUserId } } : {}) }, { fields: { _id: 1 } });
  if (usernameOwner) throw new Meteor.Error('username-already-taken');
  const emailOwner = await Meteor.users.findOneAsync({
    'emails.address': new RegExp(`^${escapeForRegex(email)}$`, 'i'),
    ...(exceptUserId ? { _id: { $ne: exceptUserId } } : {}) }, { fields: { _id: 1 } });
  if (emailOwner) throw new Meteor.Error('email-already-taken');
}

async function normalizedPersonInput(actor, input, context,
  { creating = false, target = null } = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Meteor.Error('invalid-user');
  }
  const username = bounded(input.username, 255, 'username', true);
  const email = bounded(input.email, 320, 'email', true).toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Meteor.Error('invalid-email');
  const authenticationMethod = bounded(
    input.authenticationMethod || 'password', 100, 'authenticationMethod', true);
  const allowedMethods = enabledLoginAuthenticationMethods();
  if (!allowedMethods.includes(authenticationMethod)
    && !(target && authenticationMethod === target.authenticationMethod)) {
    throw new Meteor.Error('invalid-authentication-method');
  }
  if (typeof input.password !== 'string' || input.password.length > 1000
    || (creating && !input.password)) throw new Meteor.Error('invalid-user-field', 'password');
  const password = input.password;
  const groupData = await memberships(actor, actor.isAdmin ? input : {
    ...input, teamIds: [],
  }, context);
  if (!actor.isAdmin) groupData.teams = target?.teams || [];
  return {
    username, email, password,
    fullname: bounded(input.fullname || '', 256, 'fullname'),
    initials: bounded(input.initials || '', 20, 'initials'),
    isAdmin: actor.isAdmin ? boolean(input.isAdmin, 'isAdmin') : target?.isAdmin === true,
    loginDisabled: boolean(input.loginDisabled, 'loginDisabled'),
    emailVerified: boolean(input.emailVerified, 'emailVerified'),
    authenticationMethod,
    importUsernames: stringList(input.importUsernames || [], 'importUsernames'),
    ...groupData,
  };
}

export async function createPersonForAdmin(userId, input, context = {}) {
  const actor = await peopleActor(userId, context);
  if (!actor.isAdmin) {
    report(actor, context, 'refused site-wide user creation');
    throw new Meteor.Error('not-authorized', 'Site admin required');
  }
  const person = await normalizedPersonInput(actor, input, context, { creating: true });
  await uniqueIdentity(person.username, person.email);
  const targetUserId = await Accounts.createUserAsync({ username: person.username,
    email: person.email, password: person.password });
  try {
    await Meteor.users.updateAsync(targetUserId, { $set: {
      'profile.fullname': person.fullname,
      'profile.initials': person.initials,
      isAdmin: person.isAdmin,
      loginDisabled: person.loginDisabled,
      authenticationMethod: person.authenticationMethod,
      importUsernames: person.importUsernames,
      orgs: person.orgs,
      teams: person.teams,
      'emails.0.verified': person.emailVerified,
    } });
    await addUserToTeamBoards(targetUserId, [], person.teams);
  } catch (error) {
    await Meteor.users.removeAsync(targetUserId);
    throw error;
  }
  return targetUserId;
}

export async function updatePersonForAdmin(userId, targetUserId, input, context = {}) {
  const actor = await peopleActor(userId, context);
  const target = await personForAdmin(userId, targetUserId, context);
  const person = await normalizedPersonInput(actor, input, context, { target });
  if (!actor.isAdmin && person.isAdmin !== (target.isAdmin === true)) {
    report(actor, context, 'refused site administrator flag change');
    throw new Meteor.Error('not-authorized');
  }
  if (target._id === actor._id && (person.loginDisabled || !person.isAdmin)) {
    throw new Meteor.Error('cannot-disable-current-admin');
  }
  if (target.isAdmin && !person.isAdmin
    && await Meteor.users.find({ isAdmin: true }).countAsync() === 1) {
    throw new Meteor.Error('cannot-demote-last-admin');
  }
  await uniqueIdentity(person.username, person.email, targetUserId);
  const emails = [{ address: person.email, verified: person.emailVerified },
    ...(Array.isArray(target.emails) ? target.emails.slice(1) : [])];
  await Meteor.users.updateAsync(targetUserId, { $set: {
    username: person.username,
    emails,
    'profile.fullname': person.fullname,
    'profile.initials': person.initials,
    isAdmin: person.isAdmin,
    loginDisabled: person.loginDisabled,
    authenticationMethod: person.authenticationMethod,
    importUsernames: person.importUsernames,
    orgs: person.orgs,
    teams: person.teams,
  } });
  if (person.password) await Accounts.setPasswordAsync(targetUserId, person.password);
  await addUserToTeamBoards(targetUserId, target.teams || [], person.teams);
  return true;
}

export default { peoplePageForAdmin, personForAdmin, setPersonActiveForAdmin,
  createPersonForAdmin, updatePersonForAdmin };
