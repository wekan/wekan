import { Meteor } from 'meteor/meteor';
import Org from '/models/org';
import Settings from '/models/settings';
import * as tenantAdmin from '/models/lib/tenantAdmin';
import * as tenants from '/models/lib/tenants';
import securityLog from '/server/lib/securityLog';
import escapeForRegex from 'escape-string-regexp';

export const ORGANIZATION_FEATURE_FIELDS = Object.freeze([
  'orgSharedTemplates',
  'orgPropagateMembersToBoards',
  'orgSyncMembersFromAuth',
]);

export const ORGANIZATION_PUBLIC_FIELDS = Object.freeze([
  '_id', 'orgDisplayName', 'orgDesc', 'orgShortName',
  'orgAutoAddUsersWithDomainName', 'orgWebsite', 'createdAt', 'orgIsActive',
  ...ORGANIZATION_FEATURE_FIELDS,
  'orgDomains', 'orgProductName', 'orgCustomLoginLogoImageUrl',
  'orgCustomLoginLogoLinkUrl', 'orgTextBelowCustomLoginLogo',
  'orgCustomTopLeftCornerLogoImageUrl', 'orgCustomTopLeftCornerLogoLinkUrl',
  'orgCustomHelpLinkUrl', 'orgLegalNotice',
]);

const TENANT_TEXT_LIMITS = Object.freeze({
  orgProductName: 255,
  orgTextBelowCustomLoginLogo: 1000,
});
const TENANT_LINK_FIELDS = Object.freeze([
  'orgCustomLoginLogoLinkUrl', 'orgCustomTopLeftCornerLogoLinkUrl',
  'orgCustomHelpLinkUrl', 'orgLegalNotice',
]);

function report(actor, context, detail, category = 'authz', severity = 'high') {
  securityLog.record({ severity, category, bleed: 'TenantBleed',
    action: 'blocked', source: 'adminOrganizations', userId: actor?._id || context.userId,
    username: actor?.username, req: context.req, detail });
}

async function actorFor(userId, context = {}) {
  const actor = userId && await Meteor.users.findOneAsync(userId, {
    fields: { isAdmin: 1, orgs: 1, username: 1 },
  });
  if (tenantAdmin.canOpenAdminPanel(actor)) return actor;
  report(actor, { ...context, userId }, 'refused Organizations administration');
  throw new Meteor.Error('not-authorized', 'Admin access required');
}

async function requireSiteAdmin(userId, context = {}) {
  const actor = await actorFor(userId, context);
  if (actor.isAdmin === true) return actor;
  report(actor, context, 'refused site-wide Organizations operation');
  throw new Meteor.Error('not-authorized', 'Site admin required');
}

async function requireOrganizationAdmin(userId, orgId, context = {}) {
  const actor = await actorFor(userId, context);
  if (tenantAdmin.canManageOrg(actor, orgId)) return actor;
  report(actor, context, `refused administration of organization ${String(orgId).slice(0, 100)}`);
  throw new Meteor.Error('not-authorized', 'Organization admin required');
}

function bounded(value, maximum, field) {
  if (typeof value !== 'string') throw new Meteor.Error('invalid-organization-field', field);
  const clean = value.trim();
  if (clean.length > maximum) throw new Meteor.Error('organization-field-too-long', field);
  return clean;
}

function safeLink(value, field) {
  const clean = bounded(value, 1000, field);
  if (!clean) return '';
  if (clean.startsWith('/') && !clean.startsWith('//')) return clean;
  try {
    const url = new URL(clean);
    if (url.protocol === 'http:' || url.protocol === 'https:') return url.href;
  } catch (_) { /* fixed error below */ }
  throw new Meteor.Error('invalid-url', field);
}

function normalizeBase(input = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Meteor.Error('invalid-organization');
  }
  if (typeof input.orgIsActive !== 'boolean') throw new Meteor.Error('invalid-organization-field');
  return {
    orgDisplayName: bounded(input.orgDisplayName || '', 1000, 'orgDisplayName'),
    orgDesc: bounded(input.orgDesc || '', 190, 'orgDesc'),
    orgShortName: bounded(input.orgShortName || '', 255, 'orgShortName'),
    orgAutoAddUsersWithDomainName: bounded(
      input.orgAutoAddUsersWithDomainName || '', 255, 'orgAutoAddUsersWithDomainName'),
    // The table renders this as text rather than an href, and existing
    // installations commonly store a bare hostname here.
    orgWebsite: bounded(input.orgWebsite || '', 255, 'orgWebsite'),
    orgIsActive: input.orgIsActive,
  };
}

function fieldsProjection() {
  return Object.fromEntries(ORGANIZATION_PUBLIC_FIELDS.map(field => [field, 1]));
}

function pageRequest(params = {}) {
  const search = String(params.search || '').trim().slice(0, 500);
  const requested = Number(params.page);
  const page = Number.isSafeInteger(requested) && requested > 0 ? requested : 1;
  return { search, page, perPage: 10 };
}

export async function organizationsPageForAdmin(userId, params = {}, context = {}) {
  const actor = await actorFor(userId, context);
  const { search, page: requestedPage, perPage } = pageRequest(params);
  const query = search ? { $or: [
    { orgDisplayName: new RegExp(escapeForRegex(search), 'i') },
    { orgShortName: new RegExp(escapeForRegex(search), 'i') },
  ] } : {};
  const selector = tenantAdmin.orgScopeSelector(actor, query);
  const total = await Org.find(selector).countAsync();
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const page = Math.min(requestedPage, totalPages);
  const rows = await Org.find(selector, { fields: fieldsProjection(),
    sort: { createdAt: -1 }, skip: (page - 1) * perPage, limit: perPage }).fetchAsync();
  const setting = actor.isAdmin ? await Settings.findOneAsync({}, {
    fields: { boardMembersFromSameOrgOnly: 1 },
  }) : null;
  return { rows, search, total, page, totalPages, perPage,
    canManageInstance: actor.isAdmin === true,
    boardMembersFromSameOrgOnly: setting?.boardMembersFromSameOrgOnly === true };
}

export async function organizationForAdmin(userId, orgId, context = {}) {
  await requireOrganizationAdmin(userId, orgId, context);
  const org = await Org.findOneAsync(orgId, { fields: fieldsProjection() });
  if (!org) throw new Meteor.Error('organization-not-found');
  return org;
}

export async function createOrganizationForAdmin(userId, input, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  let clean;
  try { clean = normalizeBase(input); } catch (error) {
    report(actor, context, `refused invalid organization creation: ${error.error || error.message}`,
      'validation');
    throw error;
  }
  if (await Org.findOneAsync({ orgShortName: clean.orgShortName }, { fields: { _id: 1 } })) {
    throw new Meteor.Error('orgname-already-taken');
  }
  return Org.insertAsync(clean);
}

export async function updateOrganizationForAdmin(userId, orgId, input, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  let clean;
  try { clean = normalizeBase(input); } catch (error) {
    report(actor, context, `refused invalid organization update: ${error.error || error.message}`,
      'validation');
    throw error;
  }
  const duplicate = await Org.findOneAsync({ _id: { $ne: orgId },
    orgShortName: clean.orgShortName }, { fields: { _id: 1 } });
  if (duplicate) throw new Meteor.Error('orgname-already-taken');
  const existing = await Org.findOneAsync(orgId, { fields: { orgDisplayName: 1 } });
  if (!existing) throw new Meteor.Error('organization-not-found');
  await Org.direct.updateAsync(orgId, { $set: clean });
  if (existing.orgDisplayName !== clean.orgDisplayName) {
    const members = await Meteor.users.find({ 'orgs.orgId': orgId }, {
      fields: { _id: 1 },
    }).fetchAsync();
    for (const member of members) {
      await Meteor.users.updateAsync({ _id: member._id, 'orgs.orgId': orgId }, {
        $set: { 'orgs.$.orgDisplayName': clean.orgDisplayName },
      });
    }
  }
  return organizationForAdmin(userId, orgId, context);
}

export async function setOrganizationFeatureForAdmin(
  userId, orgId, field, value, context = {},
) {
  const actor = await requireSiteAdmin(userId, context);
  if (!ORGANIZATION_FEATURE_FIELDS.includes(field) || typeof value !== 'boolean') {
    report(actor, context, `refused invalid organization feature ${String(field).slice(0, 100)}`,
      'validation');
    throw new Meteor.Error('invalid-field');
  }
  if (!await Org.findOneAsync(orgId, { fields: { _id: 1 } })) {
    throw new Meteor.Error('organization-not-found');
  }
  await Org.direct.updateAsync(orgId, { $set: { [field]: value } });
  if (field === 'orgPropagateMembersToBoards' && value) {
    const { propagateGroupMembersToBoards } = require('/server/propagateOrgTeamMembers');
    await propagateGroupMembersToBoards('org', orgId);
  }
  return organizationForAdmin(userId, orgId, context);
}

export async function setAllOrganizationsFeatureForAdmin(
  userId, field, value, context = {},
) {
  const actor = await requireSiteAdmin(userId, context);
  if (!ORGANIZATION_FEATURE_FIELDS.includes(field) || typeof value !== 'boolean') {
    report(actor, context, `refused invalid bulk organization feature ${String(field).slice(0, 100)}`,
      'validation');
    throw new Meteor.Error('invalid-field');
  }
  const result = await Org.direct.updateAsync({}, { $set: { [field]: value } }, { multi: true });
  if (field === 'orgPropagateMembersToBoards' && value) {
    const { propagateAllFlaggedGroupsToBoards } = require('/server/propagateOrgTeamMembers');
    await propagateAllFlaggedGroupsToBoards('org');
  }
  return result;
}

export async function setBoardMembersSameOrgForAdmin(userId, value, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  if (typeof value !== 'boolean') {
    report(actor, context, 'refused invalid same-organization restriction', 'validation');
    throw new Meteor.Error('invalid-setting-value');
  }
  const setting = await Settings.findOneAsync({}, { fields: { _id: 1 } });
  await Settings.direct.updateAsync(setting._id, {
    $set: { boardMembersFromSameOrgOnly: value },
  });
  return value;
}

export async function saveOrganizationTenantFieldsForAdmin(
  userId, orgId, input = {}, context = {},
) {
  const actor = await requireOrganizationAdmin(userId, orgId, context);
  if (!input || typeof input !== 'object' || Array.isArray(input)) {
    throw new Meteor.Error('invalid-organization');
  }
  const allowed = new Set(['orgDomains', ...Object.keys(TENANT_TEXT_LIMITS),
    ...TENANT_LINK_FIELDS]);
  if (Object.keys(input).some(field => !allowed.has(field))) {
    report(actor, context, 'refused unknown tenant branding field', 'validation');
    throw new Meteor.Error('invalid-field');
  }
  const set = {};
  if (Object.prototype.hasOwnProperty.call(input, 'orgDomains')) {
    const raw = bounded(input.orgDomains, 1000, 'orgDomains');
    const hosts = tenants.parseHostList(raw);
    const others = await Org.find({ _id: { $ne: orgId },
      orgDomains: { $exists: true, $ne: '' } }, { fields: { orgDomains: 1 } }).fetchAsync();
    const clashes = tenants.conflictingHosts(others, orgId, hosts);
    if (clashes.length) throw new Meteor.Error('tenant-domain-taken', clashes.join(', '));
    set.orgDomains = hosts.join(', ');
  }
  for (const [field, maximum] of Object.entries(TENANT_TEXT_LIMITS)) {
    if (Object.prototype.hasOwnProperty.call(input, field)) {
      set[field] = bounded(input[field], maximum, field);
    }
  }
  for (const field of TENANT_LINK_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(input, field)) set[field] = safeLink(input[field], field);
  }
  if (Object.keys(set).length) await Org.direct.updateAsync(orgId, { $set: set });
  return organizationForAdmin(userId, orgId, context);
}

export async function organizationMembersForAdmin(userId, orgId, context = {}) {
  await requireOrganizationAdmin(userId, orgId, context);
  const members = await Meteor.users.find({ 'orgs.orgId': orgId }, {
    sort: { username: 1 },
    fields: { username: 1, 'profile.fullname': 1, isAdmin: 1, orgs: 1 },
  }).fetchAsync();
  return members.map(member => ({ _id: member._id, username: member.username,
    fullname: member.profile?.fullname || '', isSiteAdmin: member.isAdmin === true,
    isOrgAdmin: tenantAdmin.isOrgAdmin(member, orgId) }));
}

export async function setOrganizationAdminForAdmin(
  userId, orgId, targetUserId, value, context = {},
) {
  const actor = await requireOrganizationAdmin(userId, orgId, context);
  if (typeof value !== 'boolean') throw new Meteor.Error('invalid-setting-value');
  const target = await Meteor.users.findOneAsync(targetUserId, {
    fields: { isAdmin: 1, orgs: 1 },
  });
  if (!target) throw new Meteor.Error('user-not-found');
  if (!tenantAdmin.canManageUser(actor, target)) {
    report(actor, context,
      `refused organization-admin change for out-of-scope user ${String(targetUserId).slice(0, 100)}`);
    throw new Meteor.Error('not-authorized');
  }
  if (!tenantAdmin.memberOrgIds(target).includes(orgId)) {
    report(actor, context,
      `refused organization-admin change for non-member ${String(targetUserId).slice(0, 100)}`,
      'validation', 'medium');
    throw new Meteor.Error('not-a-member');
  }
  await Meteor.users.updateAsync({ _id: targetUserId, 'orgs.orgId': orgId }, {
    $set: { 'orgs.$.isAdmin': value },
  });
  return { orgId, userId: targetUserId, isOrgAdmin: value };
}

export async function deleteOrganizationForAdmin(userId, orgId, context = {}) {
  const actor = await requireSiteAdmin(userId, context);
  const members = await Meteor.users.find({ 'orgs.orgId': orgId }).countAsync();
  if (members > 0) {
    // This is an expected safety constraint in both UIs, not evidence that an
    // authenticated administrator attempted a vulnerability. Keep it visible
    // in Problems without disabling the administrator's account.
    report(actor, context, `refused deletion of non-empty organization ${orgId}`,
      'validation', 'medium');
    throw new Meteor.Error('organization-not-empty');
  }
  const removed = await Org.direct.removeAsync(orgId);
  if (!removed) throw new Meteor.Error('organization-not-found');
  return true;
}

export default {
  organizationsPageForAdmin, organizationForAdmin, createOrganizationForAdmin,
  updateOrganizationForAdmin, setOrganizationFeatureForAdmin,
  setAllOrganizationsFeatureForAdmin, setBoardMembersSameOrgForAdmin,
  saveOrganizationTenantFieldsForAdmin, organizationMembersForAdmin,
  setOrganizationAdminForAdmin, deleteOrganizationForAdmin,
};
