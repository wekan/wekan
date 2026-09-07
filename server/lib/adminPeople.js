import { Meteor } from 'meteor/meteor';
import Org from '/models/org';
import Team from '/models/team';
import * as tenantAdmin from '/models/lib/tenantAdmin';
import securityLog from '/server/lib/securityLog';
import escapeForRegex from 'escape-string-regexp';
import { peopleLoginLocationsForAdmin } from '/server/methods/loginOffices';
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
    canManageInstance: actor.isAdmin === true, orgs, teams };
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

export default { peoplePageForAdmin, personForAdmin, setPersonActiveForAdmin };
